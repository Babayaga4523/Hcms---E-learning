<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function overview(Request $request)
    {
        $range = (int) $request->query('range', 30);
        $department = $request->query('department', 'all');

        // Get date range based on timeRange filter
        $startDate = match($range) {
            7 => now()->subDays(7),
            90 => now()->subDays(90),
            365 => now()->subYear(),
            default => now()->subDays(30)
        };

        // Real data from database
        $enrollmentsQuery = DB::table('user_trainings')
            ->where('created_at', '>=', $startDate);
        
        $completionsQuery = DB::table('user_trainings')
            ->where('status', 'completed')
            ->where('updated_at', '>=', $startDate);

        if ($department !== 'all') {
            $enrollmentsQuery->join('users', 'user_trainings.user_id', '=', 'users.id')
                ->where('users.department', $department);
            $completionsQuery->join('users', 'user_trainings.user_id', '=', 'users.id')
                ->where('users.department', $department);
        }

        $enrollments = $enrollmentsQuery->count();
        $completions = $completionsQuery->count();
        $completion_rate = $enrollments > 0 ? round(($completions / $enrollments) * 100, 1) : 0;

        $active_learners = DB::table('user_trainings')
            ->where('updated_at', '>=', now()->subDays(30))
            ->distinct('user_id')
            ->count('user_id');

        $total_users = DB::table('users')->where('role', '!=', 'admin')->count();

        // Previous period comparison for trends
        $prevStartDate = match($range) {
            7 => now()->subDays(14),
            90 => now()->subDays(180),
            365 => now()->subYears(2),
            default => now()->subDays(60)
        };
        $prevEndDate = $startDate;

        $prevEnrollments = DB::table('user_trainings')
            ->whereBetween('created_at', [$prevStartDate, $prevEndDate])
            ->count();
        
        $prevCompletions = DB::table('user_trainings')
            ->where('status', 'completed')
            ->whereBetween('updated_at', [$prevStartDate, $prevEndDate])
            ->count();

        $prevActiveUsers = DB::table('user_trainings')
            ->whereBetween('updated_at', [now()->subDays(60), now()->subDays(30)])
            ->distinct('user_id')
            ->count('user_id');

        // Calculate percentage changes
        $enrollments_trend = $prevEnrollments > 0 
            ? round((($enrollments - $prevEnrollments) / $prevEnrollments) * 100, 1) 
            : 0;
        
        $completions_trend = $prevCompletions > 0 
            ? round((($completions - $prevCompletions) / $prevCompletions) * 100, 1) 
            : 0;

        $active_learners_trend = $prevActiveUsers > 0 
            ? round((($active_learners - $prevActiveUsers) / $prevActiveUsers) * 100, 1) 
            : 0;

        return response()->json([
            'enrollments' => $enrollments,
            'completions' => $completions,
            'completion_rate' => $completion_rate,
            'active_learners' => $active_learners,
            'total_users' => $total_users,
            'trends' => [
                'enrollments_trend' => $enrollments_trend,
                'completions_trend' => $completions_trend,
                'active_learners_trend' => $active_learners_trend,
            ]
        ]);
    }

    public function trends(Request $request)
    {
        $range = (int) $request->query('range', 30);

        // Determine number of data points based on range
        $dataPoints = match($range) {
            7 => 7,
            90 => 12,
            365 => 12,
            default => 10
        };

        $startDate = match($range) {
            7 => now()->subDays(7),
            90 => now()->subDays(90),
            365 => now()->subYear(),
            default => now()->subDays(30)
        };

        $data = [];
        $interval = match($range) {
            7 => 1, // daily
            90 => 7, // weekly
            365 => 30, // monthly
            default => 3 // every 3 days
        };

        for ($i = $dataPoints - 1; $i >= 0; $i--) {
            $periodEnd = now()->subDays($i * $interval);
            $periodStart = now()->subDays(($i + 1) * $interval);
            
            $enrollments = DB::table('user_trainings')
                ->whereBetween('created_at', [$periodStart, $periodEnd])
                ->count();
            
            $completions = DB::table('user_trainings')
                ->where('status', 'completed')
                ->whereBetween('updated_at', [$periodStart, $periodEnd])
                ->count();
            
            // Estimate hours from module duration
            $hours = DB::table('user_trainings')
                ->join('modules', 'user_trainings.module_id', '=', 'modules.id')
                ->whereBetween('user_trainings.updated_at', [$periodStart, $periodEnd])
                ->sum(DB::raw('COALESCE(modules.duration_minutes, 60)')) / 60;

            $data[] = [
                'name' => $periodEnd->format($range > 90 ? 'M Y' : 'M d'),
                'enrollments' => $enrollments,
                'completions' => $completions,
                'hours' => round($hours, 1),
            ];
        }

        return response()->json($data);
    }

    public function cohortAnalysis(Request $request)
    {
        // Placeholder - returns sample cohorts
        return response()->json([
            ['cohort' => '2025-01', 'enrolled' => 120, 'completed' => 90],
            ['cohort' => '2025-02', 'enrolled' => 140, 'completed' => 110],
        ]);
    }

    public function predictiveAtRisk(Request $request)
    {
        // Placeholder predictive results
        return response()->json([
            ['user_id' => 12, 'name' => 'Budi', 'risk_score' => 0.85],
            ['user_id' => 23, 'name' => 'Siti', 'risk_score' => 0.79],
        ]);
    }

    /**
     * Get engagement analytics data
     */
    public function engagement(Request $request)
    {
        $range = (int) $request->query('range', 30);
        $department = $request->query('department', 'all');

        // Get engagement data from user_trainings
        $engagementData = DB::table('user_trainings as ut')
            ->join('users as u', 'ut.user_id', '=', 'u.id')
            ->where('ut.updated_at', '>=', now()->subDays($range))
            ->when($department !== 'all', function ($query) use ($department) {
                return $query->where('u.department', $department);
            })
            ->select(
                DB::raw('DATE(ut.updated_at) as date'),
                DB::raw('COUNT(DISTINCT ut.user_id) as active_users'),
                DB::raw('COUNT(*) as activities'),
                DB::raw('SUM(CASE WHEN ut.status = "completed" THEN 1 ELSE 0 END) as completions')
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        // Calculate engagement metrics
        $totalUsers = DB::table('users')->where('role', '!=', 'admin')->count();
        $activeUsers = DB::table('user_trainings')
            ->where('updated_at', '>=', now()->subDays($range))
            ->distinct('user_id')
            ->count('user_id');

        $engagementRate = $totalUsers > 0 ? round(($activeUsers / $totalUsers) * 100, 2) : 0;

        // Calculate engagement levels for pie chart
        $highlyEngaged = DB::table('user_trainings')
            ->select('user_id')
            ->where('updated_at', '>=', now()->subDays(7))
            ->groupBy('user_id')
            ->havingRaw('COUNT(*) >= 3')
            ->count();

        $moderatelyEngaged = DB::table('user_trainings')
            ->select('user_id')
            ->where('updated_at', '>=', now()->subDays(30))
            ->groupBy('user_id')
            ->havingRaw('COUNT(*) >= 1 AND COUNT(*) < 3')
            ->count();

        $lowEngaged = $totalUsers - $highlyEngaged - $moderatelyEngaged;

        return response()->json([
            [
                'name' => 'Highly Engaged',
                'value' => $highlyEngaged,
                'color' => '#10B981'
            ],
            [
                'name' => 'Moderately Engaged',
                'value' => $moderatelyEngaged,
                'color' => '#F59E0B'
            ],
            [
                'name' => 'Low Engagement',
                'value' => max(0, $lowEngaged),
                'color' => '#EF4444'
            ]
        ]);
    }

    /**
     * Get skills radar chart data
     */
    public function skillsRadar(Request $request)
    {
        $userId = $request->query('user_id');
        $department = $request->query('department', 'all');

        // Get module categories/skills and completion rates
        $skillsData = DB::table('modules as m')
            ->leftJoin('user_trainings as ut', 'm.id', '=', 'ut.module_id')
            ->leftJoin('users as u', 'ut.user_id', '=', 'u.id')
            ->when($userId, function ($query) use ($userId) {
                return $query->where('ut.user_id', $userId);
            })
            ->when($department !== 'all', function ($query) use ($department) {
                return $query->where('u.department', $department);
            })
            ->select(
                'm.category',
                DB::raw('COUNT(DISTINCT ut.id) as total_enrollments'),
                DB::raw('SUM(CASE WHEN ut.status = "completed" THEN 1 ELSE 0 END) as completed'),
                DB::raw('ROUND(AVG(ut.final_score), 0) as avg_score')
            )
            ->whereNotNull('m.category')
            ->groupBy('m.category')
            ->get();

        // Transform to radar chart format
        $radarData = $skillsData->map(function ($skill) {
            $completionRate = $skill->total_enrollments > 0 
                ? round(($skill->completed / $skill->total_enrollments) * 100, 0) 
                : 0;
            
            return [
                'skill' => $skill->category ?? 'Uncategorized',
                'value' => $completionRate,
                'avg_score' => $skill->avg_score ?? 0,
                'enrollments' => $skill->total_enrollments,
                'completed' => $skill->completed,
            ];
        });

        // If no data, return default categories
        if ($radarData->isEmpty()) {
            $radarData = collect([
                ['skill' => 'Technical', 'value' => 0, 'avg_score' => 0, 'enrollments' => 0, 'completed' => 0],
                ['skill' => 'Leadership', 'value' => 0, 'avg_score' => 0, 'enrollments' => 0, 'completed' => 0],
                ['skill' => 'Communication', 'value' => 0, 'avg_score' => 0, 'enrollments' => 0, 'completed' => 0],
                ['skill' => 'Compliance', 'value' => 0, 'avg_score' => 0, 'enrollments' => 0, 'completed' => 0],
                ['skill' => 'Safety', 'value' => 0, 'avg_score' => 0, 'enrollments' => 0, 'completed' => 0],
            ]);
        }

        return response()->json([
            'data' => $radarData->toArray(),
            'summary' => [
                'total_skills' => $radarData->count(),
                'avg_completion' => round($radarData->avg('value'), 0),
                'highest_skill' => $radarData->sortByDesc('value')->first(),
                'lowest_skill' => $radarData->sortBy('value')->first(),
            ]
        ]);
    }
}
