<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Models\UserTraining;
use App\Models\ExamAttempt;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the main dashboard
     */
    public function index()
    {
        $user = Auth::user();

        // Get all user trainings with module relationship
        $userId = $user->id;
        $trainings = UserTraining::where('user_id', $userId)
            ->with(['module', 'module.questions'])
            ->get()
            ->filter(function ($training) {
                // Only include trainings that have a valid module
                return $training->module !== null;
            })
            ->map(function ($training) use ($userId) {
                $status = $training->status;
                // Ensure status is not empty, default to 'enrolled' if empty
                if (empty($status)) {
                    $status = 'enrolled';
                }
                
                return [
                    'id' => $training->id,
                    'title' => $training->module->title ?? 'Unknown Training',
                    'description' => $training->module->description ?? '',
                    'status' => $status,
                    'final_score' => $training->final_score,
                    'is_certified' => $training->is_certified,
                    'passing_grade' => $training->module->passing_grade ?? 70,
                    'enrolled_at' => $training->enrolled_at,
                    'completed_at' => $training->completed_at,
                    'module_progress' => $training->module->progress()
                        ->where('user_id', $userId)
                        ->first(),
                    // Top-level numeric progress for compatibility with frontend components
                    'progress' => ($training->module->progress()->where('user_id', $userId)->first() ? (int)$training->module->progress()->where('user_id', $userId)->first()->progress_percentage : ($training->final_score ?? 0)),
                    
                ];
            });

        // Get completed trainings
        $completedTrainings = $trainings->filter(fn($t) => $t['status'] === 'completed');

        // Get upcoming trainings (assigned but not yet enrolled)
        // Only show modules that user has access to via ModuleAssignment
        $enrolledModuleIds = UserTraining::where('user_id', $userId)
            ->pluck('module_id')
            ->toArray();
        
        // Get module IDs that user is assigned to (has access)
        $assignedModuleIds = \App\Models\ModuleAssignment::where('user_id', $userId)
            ->pluck('module_id')
            ->toArray();
        
        // Upcoming = assigned modules that are not yet in user_trainings
        $upcomingTrainings = Module::whereIn('id', $assignedModuleIds)
            ->whereNotIn('id', $enrolledModuleIds)
            ->where('is_active', true)
            ->limit(5)
            ->get()
            ->map(fn($m) => [
                'id' => $m->id,
                'title' => $m->title,
                'description' => $m->description,
            ]);

        // Get recent activity (last 5 exam attempts and enrollments)
        $recentActivity = $this->getRecentActivity($user);

        return Inertia::render('User/Dashboard', [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'nip' => $user->nip,
                    'name' => $user->name,
                    'email' => $user->email,
                    'department' => $user->department,
                    'role' => $user->role,
                ],
            ],
            'trainings' => $trainings,
            'completedTrainings' => $completedTrainings,
            'upcomingTrainings' => $upcomingTrainings,
            'recentActivity' => $recentActivity,
        ]);
    }

    /**
     * Get recent activity for the user
     */
    private function getRecentActivity($user)
    {
        $user_id = $user->id;

        // Get recent exam attempts
        $examAttempts = ExamAttempt::where('user_id', $user_id)
            ->with('module')
            ->orderBy('finished_at', 'desc')
            ->limit(5)
            ->get()
            ->filter(function ($attempt) {
                return $attempt->module !== null;
            })
            ->map(function ($attempt) {
                $type = $attempt->exam_type === 'pre_test' ? 'Pre-Test' : 'Post-Test';
                $time = $attempt->finished_at ?? $attempt->started_at ?? null;
                return [
                    'title' => "{$type} - {$attempt->module->title}",
                    'time' => $time ? $time->diffForHumans() : 'Belum selesai',
                    'timestamp' => $time ? $time->timestamp : 0,
                    'score' => (int)$attempt->percentage,
                    'passed' => $attempt->is_passed,
                ];
            });

        // Get recent completions
        $completions = UserTraining::where('user_id', $user_id)
            ->where('status', 'completed')
            ->with('module')
            ->orderBy('completed_at', 'desc')
            ->limit(5)
            ->get()
            ->filter(function ($training) {
                return $training->module !== null;
            })
            ->map(function ($training) {
                $time = $training->completed_at ?? null;
                return [
                    'title' => "Training Selesai - {$training->module->title}",
                    'time' => $time ? $time->diffForHumans() : 'Waktu tidak tersedia',
                    'timestamp' => $time ? $time->timestamp : 0,
                    'score' => $training->final_score,
                    'passed' => $training->final_score >= ($training->module->passing_grade ?? 70),
                ];
            });

        // Convert to base Support Collections to avoid Eloquent collection merge semantics
        $examAttempts = $examAttempts->toBase();
        $completions = $completions->toBase();

        // Merge and sort by timestamp (newest first)
        $activities = $examAttempts->merge($completions)
            ->sortByDesc('timestamp')
            ->values()
            // Remove timestamp before returning to keep payload clean
            ->map(function($item) {
                unset($item['timestamp']);
                return $item;
            });

        return $activities;
    }

    /**
     * Get dashboard statistics
     */
    public function getRecentActivityApi()
    {
        $user = Auth::user();
        $activities = $this->getRecentActivity($user);
        return response()->json($activities);
    }


    public function getUpcomingTrainingsApi()
    {
        $user = Auth::user();

        $userId = $user->id;

        $enrolledModuleIds = UserTraining::where('user_id', $userId)
            ->pluck('module_id')
            ->toArray();

        $assignedModuleIds = \App\Models\ModuleAssignment::where('user_id', $userId)
            ->pluck('module_id')
            ->toArray();

        $upcomingTrainings = Module::whereIn('id', $assignedModuleIds)
            ->whereNotIn('id', $enrolledModuleIds)
            ->where('is_active', true)
            ->limit(10)
            ->get()
            ->map(fn($m) => [
                'id' => $m->id,
                'title' => $m->title,
                'description' => $m->description,
                'start_date' => $m->start_date ?? null,
            ]);

        return response()->json($upcomingTrainings);
    }

    public function getStatistics()
    {
        $user = Auth::user();

        $totalTrainings = UserTraining::where('user_id', $user->id)->count();
        $completedCount = UserTraining::where('user_id', $user->id)
            ->where('status', 'completed')
            ->count();
        $inProgressCount = UserTraining::where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->count();
        $certifications = UserTraining::where('user_id', $user->id)
            ->where('is_certified', true)
            ->count();

        $completionPercentage = $totalTrainings > 0 
            ? round(($completedCount / $totalTrainings) * 100) 
            : 0;

        return response()->json([
            'total_trainings' => $totalTrainings,
            'completed_count' => $completedCount,
            'in_progress_count' => $inProgressCount,
            'certifications' => $certifications,
            'completion_percentage' => $completionPercentage,
        ]);
    }

    /**
     * Get training cards data for dashboard
     */
    public function getTrainingCards()
    {
        $user = Auth::user();
        $userId = $user->id;

        $trainings = UserTraining::where('user_id', $userId)
            ->with(['module', 'module.progress'])
            ->get()
            ->filter(function ($training) {
                // Only include trainings that have a valid module
                return $training->module !== null;
            })
            ->map(function ($training) use ($userId) {
                $progress = $training->module->progress()
                    ->where('user_id', $userId)
                    ->first();

                return [
                    'id' => $training->id,
                    'title' => $training->module->title ?? 'Unknown Training',
                    'description' => $training->module->description ?? '',
                    'status' => $training->status,
                    'final_score' => $training->final_score,
                    'is_certified' => $training->is_certified,
                    'passing_grade' => $training->module->passing_grade ?? 70,
                    'enrolled_at' => $training->enrolled_at,
                    'completed_at' => $training->completed_at,
                    'module_progress' => $progress ? [
                        'progress_percentage' => $progress->progress_percentage,
                        'status' => $progress->status,
                    ] : null,
                    // Top-level progress for compatibility with components expecting `progress`
                    'progress' => $progress ? (int)$progress->progress_percentage : ($training->final_score ?? 0),
                ];
            });

        return response()->json($trainings);
    }
}
