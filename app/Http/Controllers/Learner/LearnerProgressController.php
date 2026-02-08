<?php

namespace App\Http\Controllers\Learner;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserTraining;
use App\Models\ModuleProgress;
use App\Models\Module;
use App\Models\TrainingMaterial;
use App\Models\ExamAttempt;
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
            ->with('module:id,title,description,duration_minutes')
            ->get()
            ->filter(function ($training) {
                return $training->module !== null;
            })
            ->map(function ($training) use ($userId) {
                $moduleProgress = ModuleProgress::where('user_id', $userId)
                    ->where('module_id', $training->module_id)
                    ->first();

                // Get modules/materials for this training
                $modules = $this->getModulesForProgram($training->module_id, $userId);

                return [
                    'id' => $training->module_id,
                    'name' => $training->module->title ?? 'Unknown Program',
                    'progress' => $moduleProgress->progress_percentage ?? 0,
                    'status' => $training->status ?? 'not_started',
                    'startDate' => $training->enrolled_at ? $training->enrolled_at->format('Y-m-d') : now()->format('Y-m-d'),
                    'dueDate' => $training->enrolled_at ? $training->enrolled_at->addMonths(6)->format('Y-m-d') : now()->addMonths(6)->format('Y-m-d'),
                    'totalHours' => round(($training->module->duration_minutes ?? 0) / 60, 1),
                    'completedHours' => round(($moduleProgress->progress_percentage ?? 0) / 100 * (($training->module->duration_minutes ?? 0) / 60), 2),
                    'modules' => $modules,
                ];
            })
            ->values();

        // Flatten modules from all programs for top-level access
        $allModules = [];
        foreach ($programs as $program) {
            if (isset($program['modules']) && is_array($program['modules'])) {
                $allModules = array_merge($allModules, $program['modules']);
            }
        }

        return response()->json([
            'programs' => $programs,
            'modules' => $allModules,
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
                    'name' => $material->title,
                    'type' => $material->file_type ?? 'content',
                    'duration' => $material->duration_minutes ?? 0,
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
                'name' => $module->title,
                'description' => $module->description,
                'progress' => $moduleProgress->progress_percentage ?? 0,
                'status' => $training->status,
                'startDate' => $training->enrolled_at?->format('Y-m-d') ?? now()->format('Y-m-d'),
                'dueDate' => now()->addMonths(6)->format('Y-m-d'),
                'totalHours' => round(($module->duration_minutes ?? 0) / 60, 1),
                'completedHours' => round(($moduleProgress->progress_percentage ?? 0) / 100 * (($module->duration_minutes ?? 0) / 60), 2),
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
            'name' => $module->title,
            'progress' => $moduleProgress->progress_percentage ?? 0,
            'status' => $moduleProgress->status ?? 'locked',
            'duration' => round(($module->duration_minutes ?? 0) / 60, 1),
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
                    'name' => $material->title,
                    'type' => $material->file_type ?? 'content',
                    'duration' => $material->duration_minutes ?? 0,
                    'completed' => $this->isContentCompleted($userId, $material->id),
                    'score' => $this->getContentScore($userId, $material->id),
                ];
            });

        return [
            [
                'id' => $module->id,
                'name' => $module->title,
                'progress' => count($materials) > 0 ? round(collect($materials)->where('completed', true)->count() / count($materials) * 100) : 0,
                'status' => 'in_progress',
                'duration' => round(($module->duration_minutes ?? 0) / 60, 1),
                'materials' => $materials,
            ]
        ];
    }

    /**
     * Helper method: Check if content is completed
     */
    private function isContentCompleted($userId, $materialId)
    {
        // Check if material_progress table exists and has data
        try {
            // Use UserMaterialProgress model/table which stores per-user material completion
            return \App\Models\UserMaterialProgress::where('user_id', $userId)
                ->where('training_material_id', $materialId)
                ->where('is_completed', true)
                ->exists();
        } catch (\Exception $e) {
            // If anything goes wrong, return false to avoid breaking the endpoint
            return false;
        }
    }

    /**
     * Helper method: Get content score
     */
    private function getContentScore($userId, $materialId)
    {
        // Check for quiz/exam scores related to this material
        $material = TrainingMaterial::find($materialId);
        
        if ($material && in_array($material->file_type, ['quiz', 'exam', 'assessment', 'test'])) {
            $attempt = ExamAttempt::where('user_id', $userId)
                ->where('module_id', $material->module_id)
                ->orderBy('finished_at', 'desc')
                ->first();
            
            return $attempt ? $attempt->percentage : null;
        }
        
        return null;
    }

    /**
     * Helper method: Get modules for a program
     */
    private function getModulesForProgram($moduleId, $userId)
    {
        // Get training materials for this module
        $materials = TrainingMaterial::where('module_id', $moduleId)
            ->orderBy('order', 'asc')
            ->get();

        $module = Module::find($moduleId);
        
        if (!$module) {
            return [];
        }

        // Get module progress
        $moduleProgress = ModuleProgress::where('user_id', $userId)
            ->where('module_id', $moduleId)
            ->first();

        // Build materials array
        $formattedMaterials = $materials->map(function ($material) use ($userId) {
            return [
                'id' => $material->id,
                'name' => $material->title ?? 'Material',
                'type' => $material->file_type ?? 'content',
                'duration' => $material->duration_minutes ?? 0,
                'completed' => $this->isContentCompleted($userId, $material->id),
                'score' => $this->getContentScore($userId, $material->id),
            ];
        });

        // Use module progress percentage if available
        $progress = $moduleProgress->progress_percentage ?? 0;

        // Determine status
        $status = 'not_started';
        if ($progress >= 100) {
            $status = 'completed';
        } elseif ($progress > 0) {
            $status = 'in_progress';
        }

        return [
            [
                'id' => $module->id,
                'name' => $module->title ?? 'Module',
                'progress' => $progress,
                'status' => $status,
                'duration' => round(($module->duration_minutes ?? 0) / 60, 1),
                'materials' => $formattedMaterials,
            ]
        ];
    }
}
