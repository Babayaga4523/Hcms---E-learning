<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\Enrollment;
use App\Models\ModuleProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * User Statistics API Controller
 * Provides aggregate user enrollment, completion, and performance metrics
 */
class UserStatisticsController
{
    /**
     * Get overall user statistics
     * GET /api/admin/users/statistics
     */
    public function statistics(Request $request)
    {
        try {
            $stats = [
                'total_users' => User::where('role', '!=', 'admin')->count(),
                'active_users' => User::where('role', '!=', 'admin')
                    ->whereNotNull('last_login_at')
                    ->where('last_login_at', '>=', now()->subDays(30))
                    ->count(),
                'inactive_users' => User::where('role', '!=', 'admin')
                    ->where(function ($query) {
                        $query->whereNull('last_login_at')
                              ->orWhere('last_login_at', '<', now()->subDays(30));
                    })
                    ->count(),
                'total_enrollments' => Enrollment::count(),
                'active_enrollments' => Enrollment::where('status', 'active')->count(),
                'completed_enrollments' => Enrollment::where('status', 'completed')->count(),
                'completion_rate' => $this->calculateCompletionRate(),
                'average_score' => $this->calculateAverageScore(),
                'users_by_department' => $this->getUsersByDepartment(),
                'enrollment_trend' => $this->getEnrollmentTrend(),
                'top_performers' => $this->getTopPerformers(10),
                'at_risk_learners' => $this->getAtRiskLearners(10),
            ];

            return response()->json([
                'status' => 'success',
                'data' => $stats,
                'timestamp' => now(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch user statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Calculate overall completion rate
     */
    private function calculateCompletionRate()
    {
        $totalEnrollments = Enrollment::count();
        if ($totalEnrollments === 0) {
            return 0;
        }
        $completedEnrollments = Enrollment::where('status', 'completed')->count();
        return round(($completedEnrollments / $totalEnrollments) * 100, 2);
    }

    /**
     * Calculate average score across all users
     */
    private function calculateAverageScore()
    {
        return ModuleProgress::whereNotNull('score')
            ->avg('score') ?? 0;
    }

    /**
     * Get user distribution by department
     */
    private function getUsersByDepartment()
    {
        return User::where('role', '!=', 'admin')
            ->select('department', DB::raw('count(*) as count'))
            ->groupBy('department')
            ->get()
            ->map(function ($item) {
                return [
                    'department' => $item->department ?? 'Unassigned',
                    'count' => $item->count,
                ];
            });
    }

    /**
     * Get enrollment trend (last 7 days)
     */
    private function getEnrollmentTrend()
    {
        $trend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $count = Enrollment::whereDate('created_at', $date)->count();
            $trend[] = [
                'date' => $date,
                'enrollments' => $count,
            ];
        }
        return $trend;
    }

    /**
     * Get top performers by average score
     */
    private function getTopPerformers($limit = 10)
    {
        return User::where('role', '!=', 'admin')
            ->select('users.id', 'users.name', 'users.email', 'users.department')
            ->selectRaw('AVG(module_progress.score) as average_score')
            ->leftJoin('module_progress', 'users.id', '=', 'module_progress.user_id')
            ->groupBy('users.id', 'users.name', 'users.email', 'users.department')
            ->orderByDesc('average_score')
            ->limit($limit)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'department' => $user->department,
                    'average_score' => round($user->average_score ?? 0, 2),
                ];
            });
    }

    /**
     * Get at-risk learners (low completion rate or scores) - optimized with DB::raw
     */
    private function getAtRiskLearners($limit = 10)
    {
        return DB::table('users')
            ->select('users.id', 'users.name', 'users.email', 'users.department',
                DB::raw('COUNT(DISTINCT enrollments.id) as total_enrollments'),
                DB::raw('SUM(CASE WHEN enrollments.status = "completed" THEN 1 ELSE 0 END) as completed_enrollments'),
                DB::raw('AVG(module_progress.score) as average_score')
            )
            ->leftJoin('enrollments', 'users.id', '=', 'enrollments.user_id')
            ->leftJoin('module_progress', 'users.id', '=', 'module_progress.user_id')
            ->where('users.role', '!=', 'admin')
            ->groupBy('users.id', 'users.name', 'users.email', 'users.department')
            ->havingRaw('AVG(module_progress.score) < 60 OR (COUNT(DISTINCT enrollments.id) > 0 AND (SUM(CASE WHEN enrollments.status = "completed" THEN 1 ELSE 0 END) / COUNT(DISTINCT enrollments.id)) < 0.5)')
            ->orderByRaw('AVG(module_progress.score) ASC')
            ->limit($limit)
            ->get()
            ->map(function ($user) {
                $completionRate = $user->total_enrollments > 0
                    ? round(($user->completed_enrollments / $user->total_enrollments) * 100, 2)
                    : 0;

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'department' => $user->department ?? 'Unassigned',
                    'average_score' => round($user->average_score ?? 0, 2),
                    'completion_rate' => $completionRate,
                    'risk_level' => $this->calculateRiskLevel($user->average_score ?? 0, $completionRate),
                ];
            });
    }

    /**
     * Calculate risk level based on score and completion rate
     * Uses configurable thresholds from config/predictions.php
     */
    private function calculateRiskLevel($averageScore, $completionRate)
    {
        $highScoreThreshold = (float) config('predictions.risk_score_high', 40);
        $highCompletionThreshold = (float) config('predictions.risk_completion_high', 30);
        $mediumScoreThreshold = (float) config('predictions.risk_score_medium', 60);
        $mediumCompletionThreshold = (float) config('predictions.risk_completion_medium', 60);

        if ($averageScore < $highScoreThreshold || $completionRate < $highCompletionThreshold) {
            return 'high';
        } elseif ($averageScore < $mediumScoreThreshold || $completionRate < $mediumCompletionThreshold) {
            return 'medium';
        }
        return 'low';
    }
}
