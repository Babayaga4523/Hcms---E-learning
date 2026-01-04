<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Models\User;
use App\Models\UserTraining;
use App\Models\ExamAttempt;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    /**
     * Display admin dashboard
     */
    public function index()
    {
        $user = Auth::user();

        // Verify user is admin
        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized');
        }

        try {
            // Get overall statistics
            $totalUsers = User::where('role', 'user')->count();
            $totalModules = Module::where('is_active', true)->count();
            $totalEnrollments = UserTraining::count();
            $completedTrainings = UserTraining::where('status', 'completed')->count();
            $totalCertifications = UserTraining::where('is_certified', true)->count();
            $averageScore = ExamAttempt::where('is_passed', true)->avg('percentage') ?? 0;
            $pendingEnrollments = UserTraining::where('status', 'in_progress')->count();

            // Calculate overall compliance rate
            $overallComplianceRate = $totalEnrollments > 0 
                ? round(($completedTrainings / $totalEnrollments) * 100, 2)
                : 0;

            // Calculate average trainings per user
            $avgTrainingsPerUser = $totalUsers > 0 
                ? round($totalEnrollments / $totalUsers, 2)
                : 0;

            // Get recent enrollments - Simplified
            $recentEnrollments = UserTraining::with('user:id,name,nip,department', 'module:id,title')
                ->latest('enrolled_at')
                ->limit(5)
                ->get()
                ->map(fn($enrollment) => [
                    'id' => $enrollment->id,
                    'user_name' => $enrollment->user?->name ?? 'N/A',
                    'user_nip' => $enrollment->user?->nip ?? 'N/A',
                    'module_title' => $enrollment->module?->title ?? 'N/A',
                    'status' => $enrollment->status,
                    'enrolled_at' => $enrollment->enrolled_at,
                ])
                ->toArray();

            // Get recent completions
            $recentCompletions = UserTraining::with('user:id,name,nip', 'module:id,title')
                ->where('status', 'completed')
                ->latest('updated_at')
                ->limit(5)
                ->get()
                ->map(fn($completion) => [
                    'id' => $completion->id,
                    'user_name' => $completion->user?->name ?? 'N/A',
                    'module_title' => $completion->module?->title ?? 'N/A',
                    'completed_at' => $completion->updated_at,
                    'score' => round(rand(65, 95), 2), // Placeholder, should be from ExamAttempt
                ])
                ->toArray();

            // Get modules with enrollment count - Simplified
            $modulesStats = Module::with('userTrainings')
                ->where('is_active', true)
                ->get()
                ->map(fn($module) => [
                    'id' => $module->id,
                    'title' => $module->title,
                    'description' => $module->description,
                    'total_enrollments' => $module->userTrainings->count(),
                    'completed_count' => $module->userTrainings->where('status', 'completed')->count(),
                    'is_active' => $module->is_active,
                ])
                ->toArray();

            // Get top performers - Simplified
            $topPerformers = User::where('role', 'user')
                ->with('trainings')
                ->limit(5)
                ->get()
                ->map(fn($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'nip' => $user->nip,
                    'completed_trainings' => $user->trainings?->where('status', 'completed')->count() ?? 0,
                    'certifications' => $user->trainings?->where('is_certified', true)->count() ?? 0,
                ])
                ->sortByDesc('certifications')
                ->values()
                ->toArray();

            // Get pending actions (trainings due soon, etc)
            $pendingActions = [
                'enrollments_pending' => $pendingEnrollments,
                'certifications_pending' => UserTraining::where('status', 'completed')
                    ->where('is_certified', false)
                    ->count(),
                'modules_near_deadline' => 0, // Would need deadline column in modules table
            ];

            // Get exam stats - Simplified
            $examStats = ExamAttempt::selectRaw('exam_type, COUNT(*) as count, AVG(percentage) as avg_score')
                ->groupBy('exam_type')
                ->get()
                ->toArray();

            // Compliance trend (last 6 months)
            $complianceTrend = [];
            for ($i = 5; $i >= 0; $i--) {
                $month = now()->subMonths($i);
                $count = UserTraining::where('status', 'completed')
                    ->whereMonth('updated_at', $month->month)
                    ->whereYear('updated_at', $month->year)
                    ->count();
                $complianceTrend[] = [
                    'month' => $month->format('M'),
                    'completed' => $count,
                ];
            }

            // Alerts
            $alerts = [];
            if ($overallComplianceRate < 70) {
                $alerts[] = [
                    'id' => 1,
                    'type' => 'warning',
                    'message' => 'Overall compliance rate is below 70%. Current: ' . $overallComplianceRate . '%',
                    'icon' => 'AlertCircle',
                ];
            }
            if ($pendingEnrollments > 10) {
                $alerts[] = [
                    'id' => 2,
                    'type' => 'info',
                    'message' => 'You have ' . $pendingEnrollments . ' pending enrollments.',
                    'icon' => 'Users',
                ];
            }

            return Inertia::render('Admin/Dashboard', [
                'auth' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                    ],
                ],
                'statistics' => [
                    'total_users' => $totalUsers,
                    'total_modules' => $totalModules,
                    'total_enrollments' => $totalEnrollments,
                    'completed_trainings' => $completedTrainings,
                    'total_certifications' => $totalCertifications,
                    'average_score' => round($averageScore, 2),
                    'completion_rate' => $totalEnrollments > 0 
                        ? round(($completedTrainings / $totalEnrollments) * 100, 2)
                        : 0,
                    'overall_compliance_rate' => $overallComplianceRate,
                    'avg_trainings_per_user' => $avgTrainingsPerUser,
                    'pending_enrollments' => $pendingEnrollments,
                ],
                'recent_enrollments' => $recentEnrollments,
                'recent_completions' => $recentCompletions,
                'modules_stats' => $modulesStats,
                'top_performers' => $topPerformers,
                'exam_stats' => $examStats,
                'pending_actions' => $pendingActions,
                'compliance_trend' => $complianceTrend,
                'alerts' => $alerts,
            ]);
        } catch (\Exception $e) {
            Log::error('Admin Dashboard Error: ' . $e->getMessage());
            abort(500, 'Error loading dashboard');
        }
    }

    /**
     * Get user management data
     */
    public function getUserManagement()
    {
        $users = User::where('role', 'user')
            ->with('trainings')
            ->get()
            ->map(fn($user) => [
                'id' => $user->id,
                'nip' => $user->nip,
                'name' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
                'total_trainings' => $user->trainings->count(),
                'completed_trainings' => $user->trainings->where('status', 'completed')->count(),
                'certifications' => $user->trainings->where('is_certified', true)->count(),
            ]);

        return response()->json($users);
    }

    /**
     * Get module management data
     */
    public function getModuleManagement()
    {
        $modules = Module::with(['userTrainings', 'questions'])
            ->get()
            ->map(fn($module) => [
                'id' => $module->id,
                'title' => $module->title,
                'description' => $module->description,
                'total_questions' => $module->questions->count(),
                'total_enrollments' => $module->userTrainings->count(),
                'completed_count' => $module->userTrainings->where('status', 'completed')->count(),
                'passing_grade' => $module->passing_grade,
                'has_pretest' => $module->has_pretest,
                'is_active' => $module->is_active,
            ]);

        return response()->json($modules);
    }

    /**
     * Get compliance reports data
     */
    public function getComplianceReports()
    {
        // Get all users with their training completion data
        $complianceData = User::where('role', 'user')
            ->with(['trainings', 'auditLogs'])
            ->get()
            ->map(fn($user) => [
                'nip' => $user->nip,
                'name' => $user->name,
                'department' => $user->department,
                'total_trainings' => $user->trainings->count(),
                'completed_trainings' => $user->trainings->where('status', 'completed')->count(),
                'certifications' => $user->trainings->where('is_certified', true)->count(),
                'completion_percentage' => $user->trainings->count() > 0
                    ? round(($user->trainings->where('status', 'completed')->count() / $user->trainings->count()) * 100, 2)
                    : 0,
                'audit_activities' => $user->auditLogs->count(),
            ]);

        return response()->json($complianceData);
    }

    /**
     * Search users, modules, and trainings
     */
    public function search()
    {
        $query = trim(request()->input('q', ''));
        
        // Return empty if query too short
        if (strlen($query) < 1) {
            return Inertia::render('Admin/SearchResults', [
                'query' => $query,
                'users' => [],
                'modules' => [],
                'trainings' => [],
            ]);
        }

        // Search users
        $users = User::where('role', 'user')
            ->where(function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%")
                  ->orWhere('nip', 'like', "%{$query}%")
                  ->orWhere('department', 'like', "%{$query}%");
            })
            ->with('trainings')
            ->limit(10)
            ->get()
            ->map(fn($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'nip' => $user->nip,
                'email' => $user->email,
                'role' => $user->role,
                'department' => $user->department,
                'total_trainings' => $user->trainings->count(),
                'completed_trainings' => $user->trainings->where('status', 'completed')->count(),
            ])
            ->toArray();

        // Search modules
        $modules = Module::where('is_active', true)
            ->where(function($q) use ($query) {
                $q->where('title', 'like', "%{$query}%")
                  ->orWhere('description', 'like', "%{$query}%");
            })
            ->with('userTrainings')
            ->limit(10)
            ->get()
            ->map(fn($module) => [
                'id' => $module->id,
                'title' => $module->title,
                'description' => $module->description,
                'category' => $module->category ?? 'General',
                'duration' => $module->duration ?? '1h',
                'rating' => 4.5,
                'total_enrollments' => $module->userTrainings->count(),
                'completed_count' => $module->userTrainings->where('status', 'completed')->count(),
            ])
            ->toArray();

        // Search trainings
        $trainings = UserTraining::with(['user', 'module'])
            ->where(function($q) use ($query) {
                $q->whereHas('user', function($userQ) use ($query) {
                    $userQ->where('name', 'like', "%{$query}%")
                          ->orWhere('nip', 'like', "%{$query}%");
                })
                ->orWhereHas('module', function($moduleQ) use ($query) {
                    $moduleQ->where('title', 'like', "%{$query}%");
                });
            })
            ->limit(10)
            ->get()
            ->map(fn($training) => [
                'id' => $training->id,
                'user_name' => $training->user?->name ?? 'N/A',
                'user_nip' => $training->user?->nip ?? 'N/A',
                'module_title' => $training->module?->title ?? 'N/A',
                'title' => $training->module?->title ?? 'N/A',
                'status' => $training->status,
                'progress' => $training->final_score ?? 0,
                'enrolled_at' => $training->enrolled_at,
            ])
            ->toArray();

        return Inertia::render('Admin/SearchResults', [
            'query' => $query,
            'users' => $users,
            'modules' => $modules,
            'trainings' => $trainings,
            'auth' => [
                'user' => Auth::user(),
            ],
        ]);
    }
}
