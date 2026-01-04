<?php

namespace App\Http\Controllers\Learner;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserTraining;
use App\Models\ModuleProgress;
use App\Models\Module;
use App\Models\TrainingMaterial;
use App\Models\UserExamAnswer;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class LearnerProgressController extends Controller
{
    /**
     * Get learner overall progress
     */
    public function getProgress()
    {
        $userId = Auth::id();

        $programs = UserTraining::where('user_id', $userId)
            ->with('module:id,name,description,duration')
            ->get()
            ->map(function ($training) use ($userId) {
                $moduleProgress = ModuleProgress::where('user_id', $userId)
                    ->where('module_id', $training->module_id)
                    ->first();

                return [
                    'id' => $training->module_id,
                    'name' => $training->module->name,
                    'progress' => $moduleProgress->progress_percentage ?? 0,
                    'status' => $training->status,
                    'startDate' => $training->enrolled_at->format('Y-m-d'),
                    'dueDate' => now()->addMonths(6)->format('Y-m-d'),
                    'totalHours' => $training->module->duration ?? 0,
                    'completedHours' => round(($moduleProgress->progress_percentage ?? 0) / 100 * ($training->module->duration ?? 0), 2),
                    'modules' => [],
                ];
            });

        return response()->json([
            'programs' => $programs,
        ]);
    }

    /**
     * Get detailed progress for a specific program
     */
    public function getProgramProgress($programId)
    {
        $userId = Auth::id();

        // Verify user is enrolled in this program
        $training = UserTraining::where('user_id', $userId)
            ->where('module_id', $programId)
            ->firstOrFail();

        $module = Module::findOrFail($programId);
        $moduleProgress = ModuleProgress::where('user_id', $userId)
            ->where('module_id', $programId)
            ->first();

        // Get materials for this module
        $materials = TrainingMaterial::where('module_id', $programId)
            ->get()
            ->map(function ($material) use ($userId) {
                return [
                    'id' => $material->id,
                    'name' => $material->name,
                    'type' => $material->type,
                    'duration' => $material->duration,
                    'completed' => $this->isContentCompleted($userId, $material->id),
                    'score' => $this->getContentScore($userId, $material->id),
                ];
            });

        // Get modules within the program (sub-modules)
        $subModules = Module::where('parent_module_id', $programId)
            ->get()
            ->map(function ($subModule) use ($userId) {
                return $this->buildModuleData($subModule, $userId);
            });

        return response()->json([
            'program' => [
                'id' => $module->id,
                'name' => $module->name,
                'description' => $module->description,
                'progress' => $moduleProgress->progress_percentage ?? 0,
                'status' => $training->status,
                'startDate' => $training->enrolled_at->format('Y-m-d'),
                'dueDate' => now()->addMonths(6)->format('Y-m-d'),
                'totalHours' => $module->duration ?? 0,
                'completedHours' => round(($moduleProgress->progress_percentage ?? 0) / 100 * ($module->duration ?? 0), 2),
                'modules' => $subModules->isEmpty() ? $this->buildDefaultModules($module, $userId) : $subModules,
            ],
        ]);
    }

    /**
     * Build module data structure
     */
    private function buildModuleData($module, $userId)
    {
        $moduleProgress = ModuleProgress::where('user_id', $userId)
            ->where('module_id', $module->id)
            ->first();

        $materials = TrainingMaterial::where('module_id', $module->id)
            ->get()
            ->map(function ($material) use ($userId) {
                return [
                    'id' => $material->id,
                    'name' => $material->name,
                    'type' => $material->type,
                    'duration' => $material->duration,
                    'completed' => $this->isContentCompleted($userId, $material->id),
                    'score' => $this->getContentScore($userId, $material->id),
                ];
            });

        return [
            'id' => $module->id,
            'name' => $module->name,
            'progress' => $moduleProgress->progress_percentage ?? 0,
            'status' => $moduleProgress->status ?? 'locked',
            'duration' => $module->duration ?? 0,
            'materials' => $materials,
        ];
    }

    /**
     * Build default modules from materials
     */
    private function buildDefaultModules($module, $userId)
    {
        $materials = TrainingMaterial::where('module_id', $module->id)
            ->get()
            ->map(function ($material) use ($userId) {
                return [
                    'id' => $material->id,
                    'name' => $material->name,
                    'type' => $material->type,
                    'duration' => $material->duration,
                    'completed' => $this->isContentCompleted($userId, $material->id),
                    'score' => $this->getContentScore($userId, $material->id),
                ];
            });

        return [
            [
                'id' => $module->id,
                'name' => $module->name,
                'progress' => count($materials) > 0 ? round(collect($materials)->where('completed', true)->count() / count($materials) * 100) : 0,
                'status' => 'in_progress',
                'duration' => $module->duration ?? 0,
                'materials' => $materials,
            ]
        ];
    }

    /**
     * Helper method: Check if content is completed
     */
    private function isContentCompleted($userId, $materialId)
    {
        // This would typically check a user_content_progress table
        // For now, returning random value for demo
        return rand(0, 1) === 1;
    }

    /**
     * Helper method: Get content score
     */
    private function getContentScore($userId, $materialId)
    {
        // This would check quiz or exam scores
        // For now returning null if not a quiz/exam
        return null;
    }
}
