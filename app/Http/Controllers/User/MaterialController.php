<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\TrainingProgram;
use App\Models\UserTrainingProgress;
use App\Models\TrainingEnrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MaterialController extends Controller
{
    /**
     * Get materials for a training
     */
    public function index($trainingId)
    {
        $user = Auth::user();
        
        $training = TrainingProgram::with(['modules.materials'])->findOrFail($trainingId);
        
        // Get all materials from modules
        $materials = collect();
        foreach ($training->modules as $module) {
            foreach ($module->materials as $material) {
                $material->module_title = $module->title;
                $materials->push($material);
            }
        }
        
        // Get user's completed materials
        $completedIds = UserTrainingProgress::where('user_id', $user->id)
            ->where('training_program_id', $trainingId)
            ->where('material_completed', true)
            ->pluck('material_id')
            ->toArray();
        
        // Mark materials as completed
        $materials = $materials->map(function($material) use ($completedIds) {
            $material->is_completed = in_array($material->id, $completedIds);
            return $material;
        });
        
        return response()->json([
            'materials' => $materials,
            'total' => $materials->count(),
            'completed' => count($completedIds)
        ]);
    }
    
    /**
     * Get single material detail
     */
    public function show($trainingId, $materialId)
    {
        $user = Auth::user();
        
        $training = TrainingProgram::findOrFail($trainingId);
        $material = Material::findOrFail($materialId);
        
        // Get all materials for navigation
        $allMaterials = Material::whereHas('module', function($q) use ($trainingId) {
            $q->where('training_program_id', $trainingId);
        })->orderBy('order')->get();
        
        $currentIndex = $allMaterials->search(function($m) use ($materialId) {
            return $m->id == $materialId;
        });
        
        $prevMaterial = $currentIndex > 0 ? $allMaterials[$currentIndex - 1] : null;
        $nextMaterial = $currentIndex < count($allMaterials) - 1 ? $allMaterials[$currentIndex + 1] : null;
        
        // Check if completed
        $progress = UserTrainingProgress::where('user_id', $user->id)
            ->where('training_program_id', $trainingId)
            ->where('material_id', $materialId)
            ->first();
        
        $material->is_completed = $progress ? $progress->material_completed : false;
        
        // Add completion status to all materials
        $completedIds = UserTrainingProgress::where('user_id', $user->id)
            ->where('training_program_id', $trainingId)
            ->where('material_completed', true)
            ->pluck('material_id')
            ->toArray();
        
        $allMaterials = $allMaterials->map(function($m) use ($completedIds) {
            $m->is_completed = in_array($m->id, $completedIds);
            return $m;
        });
        
        return response()->json([
            'training' => $training,
            'material' => $material,
            'materials' => $allMaterials,
            'prevMaterial' => $prevMaterial,
            'nextMaterial' => $nextMaterial
        ]);
    }
    
    /**
     * Mark material as completed
     */
    public function complete($trainingId, $materialId)
    {
        $user = Auth::user();
        
        // Create or update progress record
        $progress = UserTrainingProgress::updateOrCreate(
            [
                'user_id' => $user->id,
                'training_program_id' => $trainingId,
                'material_id' => $materialId
            ],
            [
                'material_completed' => true,
                'completed_at' => now()
            ]
        );
        
        // Update enrollment progress percentage
        $this->updateEnrollmentProgress($trainingId, $user->id);
        
        return response()->json([
            'success' => true,
            'progress' => $progress
        ]);
    }
    
    /**
     * Update enrollment progress based on completed materials
     */
    private function updateEnrollmentProgress($trainingId, $userId)
    {
        $training = TrainingProgram::with(['modules.materials'])->find($trainingId);
        
        $totalMaterials = 0;
        foreach ($training->modules as $module) {
            $totalMaterials += $module->materials->count();
        }
        
        $completedCount = UserTrainingProgress::where('user_id', $userId)
            ->where('training_program_id', $trainingId)
            ->where('material_completed', true)
            ->count();
        
        $progressPercent = $totalMaterials > 0 ? round(($completedCount / $totalMaterials) * 100) : 0;
        
        TrainingEnrollment::where('user_id', $userId)
            ->where('training_program_id', $trainingId)
            ->update([
                'progress' => $progressPercent,
                'status' => $progressPercent >= 100 ? 'completed' : 'in_progress',
                'completed_at' => $progressPercent >= 100 ? now() : null
            ]);
    }
}
