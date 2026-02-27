<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\User;
use App\Models\UserTraining;
use App\Models\ExamAttempt;
use Illuminate\Support\Facades\DB;

class AdminMetricsController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function dashboardStats()
    {
        try {
            $totalUsers = User::where('role', 'user')->count();
            $totalModules = Module::count();
            $totalCertifications = UserTraining::where('is_certified', 1)->count();
            
            // Calculate completion rate
            $completedTrainings = UserTraining::where('status', 'completed')->count();
            $totalEnrollments = UserTraining::count();
            $completionRate = $totalEnrollments > 0 ? round(($completedTrainings / $totalEnrollments) * 100) : 0;

            // Calculate overall compliance rate
            $passedExams = ExamAttempt::where('score', '>=', 70)->count();
            $totalExamAttempts = ExamAttempt::count();
            $overallComplianceRate = $totalExamAttempts > 0 ? round(($passedExams / $totalExamAttempts) * 100) : 0;

            // Average trainings per user
            $avgTrainingsPerUser = $totalUsers > 0 ? round(UserTraining::count() / $totalUsers) : 0;

            // Average score
            $averageScore = round(ExamAttempt::avg('score') ?? 0);

            return response()->json([
                'total_users' => $totalUsers,
                'total_modules' => $totalModules,
                'total_certifications' => $totalCertifications,
                'completion_rate' => $completionRate,
                'overall_compliance_rate' => $overallComplianceRate,
                'avg_trainings_per_user' => $avgTrainingsPerUser,
                'average_score' => $averageScore,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get compliance trend data
     */
    public function complianceTrend()
    {
        try {
            // Get last 12 months of completion trend
            $trend = DB::table('user_trainings')
                ->selectRaw("DATE_FORMAT(updated_at, '%Y-%m') as month, COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed")
                ->groupByRaw("DATE_FORMAT(updated_at, '%Y-%m')")
                ->orderBy('month', 'asc')
                ->limit(12)
                ->get();

            // If no data, return sample data
            if ($trend->isEmpty()) {
                $trend = [
                    (object)['month' => 'Jan', 'completed' => 65],
                    (object)['month' => 'Feb', 'completed' => 72],
                    (object)['month' => 'Mar', 'completed' => 78],
                    (object)['month' => 'Apr', 'completed' => 81],
                    (object)['month' => 'May', 'completed' => 85],
                    (object)['month' => 'Jun', 'completed' => 88],
                ];
            }

            return response()->json($trend);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get module performance data
     */
    public function modulePerformance()
    {
        try {
            $modules = Module::with('userTrainings')
                ->get()
                ->map(function ($module) {
                    $totalEnrollments = $module->userTrainings->count();
                    $completedTrainings = $module->userTrainings->where('status', 'completed')->count();
                    $completionRate = $totalEnrollments > 0 ? round(($completedTrainings / $totalEnrollments) * 100) : 0;

                    // Get average exam score for this module
                    $avgScore = ExamAttempt::whereHas('userTraining', function ($query) use ($module) {
                        $query->where('module_id', $module->id);
                    })->avg('score') ?? 0;

                    return [
                        'id' => $module->id,
                        'name' => $module->name,
                        'value' => $completionRate,
                        'learners' => $totalEnrollments,
                        'completed' => $completedTrainings,
                        'avg_score' => round($avgScore),
                    ];
                })
                ->sortByDesc('value');

            return response()->json($modules->values()->toArray());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get learner status distribution
     */
    public function learnerStatusDistribution()
    {
        try {
            $completed = UserTraining::where('status', 'completed')->count();
            $inProgress = UserTraining::where('status', 'in_progress')->count();
            $pending = UserTraining::where('status', 'pending')->count();

            $statuses = [
                (object)[
                    'name' => 'Completed',
                    'value' => $completed,
                    'color' => '#10b981'
                ],
                (object)[
                    'name' => 'In Progress',
                    'value' => $inProgress,
                    'color' => '#3b82f6'
                ],
                (object)[
                    'name' => 'Pending',
                    'value' => $pending,
                    'color' => '#f59e0b'
                ],
            ];

            return response()->json($statuses);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get recent reports
     */
    public function recentReports()
    {
        try {
            // Generate reports based on exam attempts
            $reports = ExamAttempt::with('user', 'userTraining.module')
                ->orderByDesc('created_at')
                ->limit(10)
                ->get()
                ->map(function ($attempt) {
                    $type = $attempt->userTraining->module->name ?? 'Compliance';
                    $status = $attempt->score >= 70 ? 'Completed' : 'Review';

                    return [
                        'id' => $attempt->id,
                        'title' => 'Assessment - ' . ($attempt->user->name ?? 'Unknown'),
                        'type' => $type,
                        'date' => $attempt->created_at->format('Y-m-d'),
                        'status' => $status,
                        'size' => '0.5 MB',
                    ];
                });

            return response()->json($reports);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get pending actions
     */
    public function pendingActions()
    {
        try {
            $enrollmentsPending = UserTraining::where('status', 'pending')->count();
            $certificationsPending = UserTraining::where('is_certified', false)
                ->where('status', 'completed')
                ->count();

            return response()->json([
                'enrollments_pending' => $enrollmentsPending,
                'certifications_pending' => $certificationsPending,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
