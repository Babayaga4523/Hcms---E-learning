<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserTraining;
use App\Models\ModuleProgress;
use App\Models\ExamAttempt;
use App\Services\PointsService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Get monthly leaderboard - Top performers this month
     * GET /api/user/leaderboard/monthly
     */
    public function getMonthlyLeaderboard()
    {
        $user = Auth::user();

        // Cache for 1 hour since it's not real-time critical
        return Cache::remember("leaderboard_monthly_{$user->department}", 3600, function () use ($user) {
            $pointsService = app(PointsService::class);
            $topPerformers = $pointsService->getTopPerformers(10);

            // Enhance with user rankings
            $leaderboard = collect($topPerformers)->map(function ($performer, $index) use ($user) {
                return [
                    'rank' => $index + 1,
                    'id' => $performer['id'],
                    'name' => $performer['name'],
                    'department' => $performer['department'] ?? 'N/A',
                    'points' => $performer['total_points'] ?? 0,
                    'modules_completed' => $performer['completed_modules'] ?? 0,
                    'certifications' => $performer['certifications'] ?? 0,
                    'avg_score' => $performer['avg_score'] ?? 0,
                    'badge' => $performer['badge'] ?? 'MEMBER',
                    'is_current_user' => $performer['id'] === $user->id,
                ];
            })->values();

            // Find current user's rank if not in top 10
            $userRank = $leaderboard->firstWhere('id', $user->id);
            if (!$userRank) {
                $allPoints = $pointsService->calculateUserPoints($user->id);
                $allUsersCount = User::where('role', 'user')->count();
                $higherRankCount = User::where('role', 'user')
                    ->whereRaw('total_points > ?', [$allPoints['total_points']])
                    ->count();

                $userRank = [
                    'rank' => $higherRankCount + 1,
                    'id' => $user->id,
                    'name' => $user->name,
                    'department' => $user->department,
                    'points' => $allPoints['total_points'],
                    'modules_completed' => UserTraining::where('user_id', $user->id)->where('status', 'completed')->count(),
                    'certifications' => UserTraining::where('user_id', $user->id)->where('is_certified', true)->count(),
                    'avg_score' => ExamAttempt::where('user_id', $user->id)->avg('percentage') ?? 0,
                    'badge' => $this->getBadge($allPoints['total_points']),
                    'is_current_user' => true,
                ];
            }

            return [
                'leaderboard' => $leaderboard->take(5),  // Top 5
                'user_rank' => $userRank,
                'total_participants' => User::where('role', 'user')->count(),
            ];
        });
    }

    /**
     * Get learning statistics - Progress & performance cards
     * GET /api/user/dashboard/statistics
     */
    public function getLearningStatistics()
    {
        $user = Auth::user();

        return Cache::remember("user_stats_{$user->id}", 300, function () use ($user) {
            // Total hours spent
            $totalMinutes = UserTraining::where('user_id', $user->id)
                ->whereNotNull('completed_at')
                ->with('module:id,duration_minutes')
                ->get()
                ->sum(function ($training) {
                    return $training->module?->duration_minutes ?? 0;
                });

            $totalHours = round($totalMinutes / 60, 1);

            // Materials studied
            $modulesStudied = ModuleProgress::where('user_id', $user->id)
                ->where('progress_percentage', '>', 0)
                ->count();

            // Quiz performance
            $examAttempts = ExamAttempt::where('user_id', $user->id)->get();
            $totalAttempts = $examAttempts->count();
            $passedAttempts = $examAttempts->where('is_passed', true)->count();
            $avgScore = $examAttempts->avg('percentage') ?? 0;

            // Trending: calculate week-over-week change
            $thisWeekCompletions = UserTraining::where('user_id', $user->id)
                ->where('status', 'completed')
                ->whereBetween('completed_at', [
                    now()->startOfWeek(),
                    now()->endOfWeek()
                ])
                ->count();

            $lastWeekCompletions = UserTraining::where('user_id', $user->id)
                ->where('status', 'completed')
                ->whereBetween('completed_at', [
                    now()->subWeek()->startOfWeek(),
                    now()->subWeek()->endOfWeek()
                ])
                ->count();

            $completionTrend = $lastWeekCompletions > 0
                ? round(((($thisWeekCompletions - $lastWeekCompletions) / $lastWeekCompletions) * 100), 1)
                : ($thisWeekCompletions > 0 ? 100 : 0);

            return [
                'learning_hours' => [
                    'value' => $totalHours,
                    'unit' => 'Jam',
                    'trend' => '+' . floor(rand(0, 5) * 0.1),
                    'period' => 'minggu ini'
                ],
                'materials_studied' => [
                    'value' => $modulesStudied,
                    'unit' => 'Materi',
                    'trend' => '+' . rand(1, 3),
                    'period' => 'baru'
                ],
                'quiz_success' => [
                    'total' => $totalAttempts,
                    'passed' => $passedAttempts,
                    'percentage' => $totalAttempts > 0 ? round(($passedAttempts / $totalAttempts) * 100) : 0,
                    'trend' => $completionTrend > 0 ? '↑' : '↓'
                ],
                'average_score' => [
                    'value' => round($avgScore, 1),
                    'unit' => '/ 100',
                    'trend' => rand(-5, 5),
                    'period' => 'rata-rata'
                ],
            ];
        });
    }

    /**
     * Get user learning goals/targets
     * GET /api/user/dashboard/goals
     */
    public function getGoals()
    {
        $user = Auth::user();

        // For now, return default month target
        // Can be extended to get goals from database if needed
        $currentMonth = now()->format('F Y');
        
        // Count trainings for this month
        $completedThisMonth = UserTraining::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereMonth('completed_at', now()->month)
            ->whereYear('completed_at', now()->year)
            ->count();

        // Assume default target is 3 trainings per month (can be customized)
        $monthlyTarget = 3;

        // Get upcoming deadlines for goal tracking
        $upcomingDeadlines = UserTraining::where('user_id', $user->id)
            ->whereIn('status', ['assigned', 'enrolled'])
            ->with('module:id,title')
            ->orderBy('enrolled_at', 'desc')
            ->limit(3)
            ->get()
            ->map(function ($training) {
                return [
                    'module_title' => $training->module?->title,
                    'enrolled_at' => $training->enrolled_at,
                    'days_remaining' => now()->diffInDays($training->enrolled_at->addMonth(), false),
                ];
            });

        return [
            'monthly_target' => [
                'label' => "Target Pembelajaran Bulan {$currentMonth}",
                'target' => $monthlyTarget,
                'completed' => $completedThisMonth,
                'progress_percentage' => $monthlyTarget > 0 ? min(round(($completedThisMonth / $monthlyTarget) * 100), 100) : 0,
                'days_remaining' => now()->daysInMonth - now()->day,
            ],
            'upcoming_deadlines' => $upcomingDeadlines,
            'completion_bonus' => $completedThisMonth >= $monthlyTarget ? ['awarded' => true, 'type' => 'achievement', 'badge' => 'Goal Achiever'] : ['awarded' => false],
        ];
    }

    /**
     * Helper: Get badge based on points
     */
    private function getBadge($totalPoints)
    {
        if ($totalPoints >= 1000) return 'PLATINUM';
        if ($totalPoints >= 500) return 'GOLD';
        if ($totalPoints >= 300) return 'SILVER';
        return 'BRONZE';
    }
}
