<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Models\UserTraining;
use App\Models\ExamAttempt;
use App\Models\AuditLog;
use App\Models\ModuleProgress;
use App\Models\Notification;
use App\Services\QuizService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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
        
        // Pre-fetch all module progress records to avoid N+1 queries
        $progressRecords = ModuleProgress::where('user_id', $userId)
            ->pluck('progress_percentage', 'module_id')
            ->toArray();
        
        // Initialize QuizService for comprehensive progress calculation
        $quizService = new QuizService();
        
        $trainings = UserTraining::where('user_id', $userId)
            ->with(['module'])
            ->get()
            ->filter(function ($training) {
                // Only include trainings that have a valid module
                return $training->module !== null;
            })
            ->map(function ($training) use ($userId, $progressRecords, $quizService) {
                $status = $training->status;
                // Ensure status is not empty, default to 'enrolled' if empty
                if (empty($status)) {
                    $status = 'enrolled';
                }
                
                // PERBAIKAN: Use comprehensive progress (materials 40% + pretest 30% + posttest 30%)
                // instead of simple materials-only progress
                try {
                    $comprehensiveProgress = $quizService->calculateComprehensiveProgress($userId, $training->module_id);
                    $progressPercentage = (int)($comprehensiveProgress['total_progress'] ?? 0);
                } catch (\Exception $e) {
                    // Fallback to 0 if calculation fails
                    \Illuminate\Support\Facades\Log::warning("Progress calculation failed for user {$userId}, module {$training->module_id}: " . $e->getMessage());
                    $progressPercentage = 0;
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
                    'progress' => $progressPercentage,
                ];
            });

        // Categorize trainings by status and progress
        // PERBAIKAN: Ensure "Selesai" only shows 100% completed trainings
        // Active = in_progress OR (enrolled with progress > 0)
        $activeTrainings = $trainings->filter(fn($t) => 
            $t['status'] === 'in_progress' || 
            ($t['status'] === 'enrolled' && $t['progress'] > 0)
        )->values();
        
        // Assigned = enrolled with progress = 0
        $assignedTrainings = $trainings->filter(fn($t) => 
            $t['status'] === 'enrolled' && $t['progress'] === 0
        )->values();
        
        // Completed = status completed AND progress 100%
        $completedTrainings = $trainings->filter(fn($t) => 
            $t['status'] === 'completed' && $t['progress'] >= 100
        )->values();
        
        // SAFETY: If no active trainings, show all trainings (fallback for debug)
        // This ensures something always displays
        if ($activeTrainings->isEmpty()) {
            $activeTrainings = $trainings->values();
        }

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
            'trainings' => $activeTrainings,  // Pass active trainings for "Aktif" tab
            'assignedTrainings' => $assignedTrainings,  // Pass assigned for "Ditugaskan" tab
            'completedTrainings' => $completedTrainings,  // Pass fully completed for "Selesai" tab (100% only)
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
            ->where('is_certified', 1)
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

        // Pre-fetch all module progress records to avoid N+1 queries
        $progressRecords = ModuleProgress::where('user_id', $userId)
            ->get()
            ->groupBy('module_id')
            ->map(fn($items) => $items->first());

        $trainings = UserTraining::where('user_id', $userId)
            ->with(['module'])
            ->get()
            ->filter(function ($training) {
                // Only include trainings that have a valid module
                return $training->module !== null;
            })
            ->map(function ($training) use ($userId, $progressRecords) {
                $progress = $progressRecords->get($training->module_id);

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

    /**
     * Get unified updates (announcements + notifications) with tabs support
     */
    public function getUnifiedUpdates(Request $request)
    {
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated'
            ], 401);
        }

        $user = Auth::user();
        $userId = $user->id;
        
        // Get all active announcements from database if table exists
        $announcements = collect();
        try {
            $announcementRecords = DB::table('announcements')
                ->where('status', 'active')
                ->where(function($q) {
                    $q->whereNull('start_date')
                      ->orWhere('start_date', '<=', now());
                })
                ->where(function($q) {
                    $q->whereNull('end_date')
                      ->orWhere('end_date', '>=', now());
                })
                ->orderBy('created_at', 'desc')
                ->get();

            $announcements = $announcementRecords->map(function($ann) {
                return [
                    'id' => $ann->id,
                    'type' => 'announcement',
                    'category' => $ann->type ?? 'general',
                    'title' => $ann->title,
                    'content' => $ann->content,
                    'body' => $ann->content,
                    'is_read' => true,
                    'created_at' => $ann->created_at,
                    'timestamp' => strtotime($ann->created_at),
                    'icon' => $this->getAnnouncementIcon($ann->type ?? 'general'),
                    'color' => $this->getAnnouncementColor($ann->type ?? 'general'),
                ];
            });
        } catch (\Exception $e) {
            // Announcements table doesn't exist, skip
        }

        // Get user's notifications
        $notifications = Notification::query()
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function($notif) {
                return [
                    'id' => $notif->id,
                    'type' => 'notification',
                    'category' => $notif->type ?? 'info',
                    'title' => $notif->title,
                    'content' => $notif->message,
                    'body' => $notif->message,
                    'is_read' => $notif->is_read ?? false,
                    'created_at' => $notif->created_at,
                    'timestamp' => $notif->created_at->timestamp,
                    'icon' => $this->getNotificationIcon($notif->type ?? 'info'),
                    'color' => $this->getNotificationColor($notif->type ?? 'info'),
                ];
            });

        // Merge and sort by timestamp (newest first)
        $allUpdates = collect()
            ->merge($announcements)
            ->merge($notifications)
            ->sortByDesc('timestamp')
            ->values()
            ->toArray();

        // Count unread notifications
        $unreadCount = Notification::query()
            ->where('user_id', $userId)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'success' => true,
            'data' => $allUpdates,
            'announcements_count' => $announcements->count(),
            'notifications_count' => $notifications->count(),
            'unread_count' => $unreadCount,
            'total_count' => count($allUpdates),
        ]);
    }

    /**
     * Helper: Get icon for announcement type
     */
    private function getAnnouncementIcon($type)
    {
        return match($type) {
            'urgent' => '⚠️',
            'maintenance' => '🔧',
            'event' => '📅',
            default => '📢',
        };
    }

    /**
     * Helper: Get color for announcement type
     */
    private function getAnnouncementColor($type)
    {
        return match($type) {
            'urgent' => 'red',
            'maintenance' => 'orange',
            'event' => 'green',
            default => 'blue',
        };
    }

    /**
     * Helper: Get icon for notification type
     */
    private function getNotificationIcon($type)
    {
        return match($type) {
            'success' => '✓',
            'warning' => '⚠',
            'error' => '✕',
            default => 'ℹ',
        };
    }

    /**
     * Helper: Get color for notification type
     */
    private function getNotificationColor($type)
    {
        return match($type) {
            'success' => 'green',
            'warning' => 'orange',
            'error' => 'red',
            default => 'blue',
        };
    }

    /**
     * Display user activity page
     */
    public function activity()
    {
        $user = Auth::user();

        return Inertia::render('User/Activity', [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'nip' => $user->nip ?? null,
                ],
            ],
        ]);
    }
}
