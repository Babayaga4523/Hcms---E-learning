<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\TrainingMaterial;
use App\Models\UserMaterialProgress;
use App\Models\ModuleProgress;
use App\Models\UserTraining;

class MaterialProgressController extends Controller
{
    public function store(Request $request, $materialId)
    {
        $validated = $request->validate([
            'is_completed' => 'nullable|boolean',
            'last_position_seconds' => 'nullable|integer|min:0',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $material = TrainingMaterial::findOrFail($materialId);

        $isCompleted = $validated['is_completed'] ?? false;
        $lastPos = $validated['last_position_seconds'] ?? null;

        $progress = UserMaterialProgress::updateOrCreate(
            [
                'user_id' => $user->id,
                'training_material_id' => $material->id,
            ],
            [
                'is_completed' => $isCompleted,
                'last_position_seconds' => $lastPos,
                'completed_at' => $isCompleted ? now() : null,
            ]
        );

        // Recalculate module progress
        $moduleId = $material->module_id;
        $total = TrainingMaterial::where('module_id', $moduleId)->count();
        $completed = UserMaterialProgress::where('user_id', $user->id)
            ->whereIn('training_material_id', function($q) use ($moduleId) {
                $q->select('id')->from('training_materials')->where('module_id', $moduleId);
            })->where('is_completed', true)->count();

        $percentage = $total > 0 ? round(($completed / $total) * 100) : 0;

        ModuleProgress::updateOrCreate(
            ['user_id' => $user->id, 'module_id' => $moduleId],
            ['progress_percentage' => $percentage, 'status' => $percentage === 100 ? 'completed' : ($percentage > 0 ? 'in_progress' : 'locked')]
        );

        // Update user_trainings status if present
        $userTraining = UserTraining::where('user_id', $user->id)->where('module_id', $moduleId)->first();
        if ($userTraining) {
            if ($percentage === 100) {
                $userTraining->update(['status' => 'completed', 'completed_at' => now()]);
            } else if ($percentage > 0 && $userTraining->status === 'pending') {
                $userTraining->update(['status' => 'in_progress']);
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'material_progress' => $progress,
                'module_progress' => ['percentage' => $percentage]
            ]
        ]);
    }
}
