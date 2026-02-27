<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    /**
     * Normalize incoming range param (accepts '7D', '30D' etc) into valid integer days.
     */
    private function parseRange($requestRange)
    {
        $range = (int) filter_var((string)$requestRange, FILTER_SANITIZE_NUMBER_INT);
        return in_array($range, [7, 30, 90, 365]) ? $range : 30;
    }

    public function overview(Request $request)
    {
        $this->authorize('view-analytics');
        $range = $this->parseRange($request->query('range', 30));
        $department = $request->query('department', 'all');

        // Compute date bounds consistently (start/end of day)
        $startDate = now()->subDays($range)->startOfDay();
        $endDate = now()->endOfDay();

        $prevStartDate = (clone $startDate)->subDays($range);
        $prevEndDate = (clone $startDate)->subSecond();

        $cacheKey = "analytics_overview_v2_{$range}_{$department}";

        $payload = Cache::remember($cacheKey, 60 * 10, function () use ($startDate, $endDate, $prevStartDate, $prevEndDate, $department) {
            // Use a cloned base query so filters are consistent between current and previous periods
            $baseQuery = DB::table('user_trainings as ut');
            if ($department !== 'all') {
                $baseQuery->join('users as u', 'ut.user_id', '=', 'u.id')
                          ->where('u.department', $department);
            }

            // Current period
            $enrollments = (clone $baseQuery)
                ->whereBetween('ut.created_at', [$startDate, $endDate])
                ->count();

            $completions = (clone $baseQuery)
                ->where('ut.status', 'completed')
                ->whereBetween('ut.updated_at', [$startDate, $endDate])
                ->count();

            $active_learners = (clone $baseQuery)
                ->whereBetween('ut.updated_at', [$startDate, $endDate])
                ->distinct('ut.user_id')->count('ut.user_id');

            // Previous period
            $prevEnrollments = (clone $baseQuery)
                ->whereBetween('ut.created_at', [$prevStartDate, $prevEndDate])
                ->count();

            $prevCompletions = (clone $baseQuery)
                ->where('ut.status', 'completed')
                ->whereBetween('ut.updated_at', [$prevStartDate, $prevEndDate])
                ->count();

            $prevActiveUsers = (clone $baseQuery)
                ->whereBetween('ut.updated_at', [$prevStartDate, $prevEndDate])
                ->distinct('ut.user_id')->count('ut.user_id');

            $total_users = DB::table('users')->where('role', '!=', 'admin')->count();

            // --- TREND CALCULATIONS (handle prev==0 correctly) ---
            $enrollments_trend = 0;
            if ($prevEnrollments > 0) {
                $enrollments_trend = round((($enrollments - $prevEnrollments) / $prevEnrollments) * 100, 1);
            } elseif ($enrollments > 0) {
                $enrollments_trend = 100; // growth from zero
            }

            $completions_trend = 0;
            if ($prevCompletions > 0) {
                $completions_trend = round((($completions - $prevCompletions) / $prevCompletions) * 100, 1);
            } elseif ($completions > 0) {
                $completions_trend = 100;
            }

            $active_learners_trend = 0;
            if ($prevActiveUsers > 0) {
                $active_learners_trend = round((($active_learners - $prevActiveUsers) / $prevActiveUsers) * 100, 1);
            } elseif ($active_learners > 0) {
                $active_learners_trend = 100;
            }

            return [
                'enrollments' => $enrollments,
                'completions' => $completions,
                'completion_rate' => $enrollments > 0 ? round(($completions / $enrollments) * 100, 1) : 0,
                'active_learners' => $active_learners,
                'total_users' => $total_users,
                'trends' => [
                    'enrollments_trend' => $enrollments_trend,
                    'completions_trend' => $completions_trend,
                    'active_learners_trend' => $active_learners_trend,
                ]
            ];
        });

        return response()->json($payload);
    }

    public function trends(Request $request)
    {
        $this->authorize('view-analytics');
        $range = $this->parseRange($request->query('range', 30));
        $department = $request->query('department', 'all');

        $dataPoints = match($range) {
            7 => 7,
            30 => 10,
            90 => 12,
            365 => 12,
            default => 10
        };

        // choose bucket and formats
        if ($range <= 30) {
            $sqlFormat = '%Y-%m-%d';
            $labelFormat = 'M d';
            $bucketType = 'day';
        } elseif ($range == 90) {
            $sqlFormat = '%x%v'; // year + week number
            $labelFormat = 'M d';
            $bucketType = 'week';
        } else {
            $sqlFormat = '%Y-%m';
            $labelFormat = 'M Y';
            $bucketType = 'month';
        }

        // Start date for trends - aligned with parseRange, use startOfDay for stability
        $startDate = now()->subDays($range)->startOfDay();

        $cacheKey = "analytics_trends_{$range}_{$department}";

        $data = Cache::remember($cacheKey, 60 * 60, function () use ($sqlFormat, $startDate, $department, $bucketType, $labelFormat, $dataPoints) {
            // Build aggregated queries
            $enrollQ = DB::table('user_trainings')
                ->select(DB::raw("DATE_FORMAT(created_at, '$sqlFormat') as period"), DB::raw('COUNT(*) as enrollments'))
                ->where('created_at', '>=', $startDate);

            $compQ = DB::table('user_trainings')
                ->select(DB::raw("DATE_FORMAT(updated_at, '$sqlFormat') as period"), DB::raw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completions"))
                ->where('updated_at', '>=', $startDate);

            $hoursQ = DB::table('user_trainings')
                ->join('modules', 'user_trainings.module_id', '=', 'modules.id')
                ->select(DB::raw("DATE_FORMAT(user_trainings.updated_at, '$sqlFormat') as period"), DB::raw('SUM(COALESCE(modules.duration_minutes, 60))/60 as hours'))
                ->where('user_trainings.updated_at', '>=', $startDate);

            if ($department !== 'all') {
                $enrollQ->join('users', 'user_trainings.user_id', '=', 'users.id')->where('users.department', $department);
                $compQ->join('users', 'user_trainings.user_id', '=', 'users.id')->where('users.department', $department);
                $hoursQ->join('users', 'user_trainings.user_id', '=', 'users.id')->where('users.department', $department);
            }

            $enrollmentsAgg = $enrollQ->groupBy('period')->orderBy('period', 'asc')->get()->pluck('enrollments', 'period')->toArray();
            $completionsAgg = $compQ->groupBy('period')->orderBy('period', 'asc')->get()->pluck('completions', 'period')->toArray();
            $hoursAgg = $hoursQ->groupBy('period')->orderBy('period', 'asc')->get()->pluck('hours', 'period')->toArray();

            $result = [];

            for ($i = $dataPoints - 1; $i >= 0; $i--) {
                if ($bucketType === 'day') {
                    $periodEnd = now()->subDays($i);
                    $periodKey = $periodEnd->format('Y-m-d');
                    $label = $periodEnd->format($labelFormat);
                } elseif ($bucketType === 'week') {
                    $periodEnd = now()->subWeeks($i);
                    $weekNum = str_pad($periodEnd->format('W'), 2, '0', STR_PAD_LEFT);
                    $periodKey = $periodEnd->format('o') . $weekNum; // matches %x%v pattern
                    $label = $periodEnd->startOfWeek()->format($labelFormat);
                } else {
                    $periodEnd = now()->subMonths($i);
                    $periodKey = $periodEnd->format('Y-m');
                    $label = $periodEnd->format($labelFormat);
                }

                $result[] = [
                    'name' => $label,
                    'enrollments' => (int) ($enrollmentsAgg[$periodKey] ?? 0),
                    'completions' => (int) ($completionsAgg[$periodKey] ?? 0),
                    'hours' => (float) round($hoursAgg[$periodKey] ?? 0, 1),
                ];
            }

            return $result;
        });

        return response()->json($data);
    }

    public function cohortAnalysis(Request $request)
    {
        $range = $this->parseRange($request->query('range', 30));
        $department = $request->query('department', 'all');

        $cacheKey = "analytics_cohort_{$range}_{$department}";

        try {
            $data = Cache::remember($cacheKey, 60 * 60, function () use ($range, $department) {
                $startDate = now()->subDays($range)->startOfDay();

                // Group by enrollment month to create cohorts
                $cohorts = DB::table('user_trainings as ut')
                    ->join('users as u', 'ut.user_id', '=', 'u.id')
                    ->select(
                        DB::raw("DATE_FORMAT(ut.created_at, '%Y-%m') as cohort"),
                        DB::raw('COUNT(DISTINCT ut.id) as enrolled'),
                        DB::raw("SUM(CASE WHEN ut.status = 'completed' THEN 1 ELSE 0 END) as completed"),
                        DB::raw("SUM(CASE WHEN ut.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress"),
                        DB::raw("SUM(CASE WHEN ut.status = 'abandoned' THEN 1 ELSE 0 END) as abandoned"),
                        DB::raw('AVG(COALESCE(ut.final_score, 0)) as avg_score'),
                        DB::raw('COUNT(DISTINCT u.id) as unique_users')
                    )
                    ->where('ut.created_at', '>=', $startDate)
                    ->when($department !== 'all', function ($query) use ($department) {
                        return $query->where('u.department', $department);
                    })
                    ->groupBy(DB::raw("DATE_FORMAT(ut.created_at, '%Y-%m')"))
                    ->orderBy('cohort', 'desc')
                    ->get();

                if ($cohorts->isEmpty()) {
                    return [];
                }

                // Calculate retention and completion rates per cohort
                $result = $cohorts->map(function ($cohort) {
                    $enrolledCount = (int) $cohort->enrolled;
                    $completedCount = (int) $cohort->completed;
                    $inProgressCount = (int) $cohort->in_progress;
                    
                    $completionRate = $enrolledCount > 0 ? round(($completedCount / $enrolledCount) * 100, 1) : 0;
                    $retentionRate = $enrolledCount > 0 ? round((($completedCount + $inProgressCount) / $enrolledCount) * 100, 1) : 0;
                    $avgScore = round($cohort->avg_score, 1);

                    return [
                        'cohort' => $cohort->cohort,
                        'enrolled' => $enrolledCount,
                        'completed' => $completedCount,
                        'in_progress' => $inProgressCount,
                        'abandoned' => (int) $cohort->abandoned,
                        'unique_users' => (int) $cohort->unique_users,
                        'completion_rate' => $completionRate,
                        'retention_rate' => $retentionRate,
                        'avg_score' => $avgScore,
                        'status_trend' => [
                            'completed' => $completedCount,
                            'in_progress' => $inProgressCount,
                            'abandoned' => (int) $cohort->abandoned
                        ]
                    ];
                })->toArray();

                return $result;
            });

            if (empty($data)) {
                return response()->json([
                    'success' => true,
                    'message' => 'Tidak ada data kohort',
                    'cohorts' => []
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Analisis kohort berhasil diambil',
                'cohorts' => $data,
                'cohort_count' => count($data)
            ]);

        } catch (\Exception $e) {
            Log::error('AnalyticsController::cohortAnalysis error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil analisis kohort',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function predictiveAtRisk(Request $request)
    {
        $department = $request->query('department', 'all');

        // 1. Determine activity column
        $activityCol = \Illuminate\Support\Facades\Schema::hasColumn('user_trainings', 'last_activity_at') ? 'last_activity_at' : 'updated_at';

        // 2. Progress safety check
        $hasProgress = \Illuminate\Support\Facades\Schema::hasColumn('user_trainings', 'progress');
        $progressSelect = $hasProgress ? 'ut.progress' : DB::raw('0 as progress');

        // 3. Pull required fields including enrolled_at
        $query = DB::table('user_trainings as ut')
            ->join('users as u', 'ut.user_id', '=', 'u.id')
            ->select(
                'u.id as user_id',
                'u.name',
                'u.department',
                $progressSelect,
                DB::raw("ut.{$activityCol} as last_activity_at"),
                DB::raw('ut.created_at as enrolled_at')
            )
            ->where('ut.status', 'in_progress');

        if ($department !== 'all') {
            $query->where('u.department', $department);
        }

        try {
            $users = $query->get();

            $results = $users->map(function ($user) {
                $now = now();
                $lastActive = $user->last_activity_at ? Carbon::parse($user->last_activity_at) : Carbon::parse($user->enrolled_at);
                $enrolledAt = Carbon::parse($user->enrolled_at);

                $daysInactive = $now->diffInDays($lastActive);
                $daysEnrolled = $now->diffInDays($enrolledAt);
                $progress = (float) ($user->progress ?? 0);

                // --- SMART RISK CALCULATION ---

                // Grace period: skip users enrolled < 3 days
                if ($daysEnrolled < 3) {
                    return null;
                }

                // Inactivity factor (40%): scale to 0-100, cap at 14 days
                $inactivityScore = min(100, ($daysInactive / 14) * 100);

                // Stagnation factor (60%): expected progress ~2% per day
                $expectedProgress = min(100, $daysEnrolled * 2);
                $stagnationGap = max(0, $expectedProgress - $progress);

                // Weighted final score
                $riskScore = ($inactivityScore * 0.4) + ($stagnationGap * 0.6);

                // Filter low-risk
                if ($riskScore < 40) {
                    return null;
                }

                return [
                    'user_id' => $user->user_id,
                    'name' => $user->name,
                    'department' => $user->department,
                    'last_active' => $daysInactive . ' days ago',
                    'progress' => $progress . '%',
                    'days_enrolled' => $daysEnrolled . ' days',
                    'risk_score' => round($riskScore, 1),
                    'risk_factor' => $daysInactive > 14 ? 'Inactive' : 'Slow Progress',
                ];
            })
            ->filter()
            ->sortByDesc('risk_score')
            ->take(50)
            ->values()
            ->toArray();

            return response()->json($results);

        } catch (\Exception $e) {
            Log::error('AnalyticsController::predictiveAtRisk error: ' . $e->getMessage());
            return response()->json(['error' => 'Unable to compute at-risk users'], 500);
        }
    }

    /**
     * Get engagement analytics data
     */
    public function engagement(Request $request)
    {
        $range = (int) $request->query('range', 30);
        $department = $request->query('department', 'all');

        // normalize
        $range = in_array($range, [7, 30, 90, 365]) ? $range : 30;
        $days = $range;

        $cacheKey = "analytics_engagement_{$range}_{$department}";

        try {
            $payload = Cache::remember($cacheKey, 60 * 10, function () use ($days, $department) {
                $hasActivities = \Illuminate\Support\Facades\Schema::hasTable('user_activities');

                // Subquery: completions (per user)
                $compSub = DB::table('user_trainings')
                    ->select('user_id', DB::raw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completions"))
                    ->where('updated_at', '>=', now()->subDays($days))
                    ->groupBy('user_id');

                // Build users query and join activity subquery only if table exists
                $usersQ = DB::table('users')
                    ->select('users.id as user_id', 'users.name')
                    ->when($hasActivities, function ($q) use ($days, $department) {
                        $actSub = DB::table('user_activities')
                            ->select('user_id',
                                DB::raw("SUM(CASE WHEN activity_type = 'login' THEN 1 ELSE 0 END) as logins"),
                                DB::raw('SUM(COALESCE(duration_minutes,0)) as minutes'),
                                DB::raw("SUM(CASE WHEN activity_type IN ('discussion','quiz_submission','answer') THEN 1 ELSE 0 END) as interactions")
                            )
                            ->where('created_at', '>=', now()->subDays($days))
                            ->groupBy('user_id');

                        $q->leftJoinSub($actSub, 'act', 'users.id', '=', 'act.user_id');
                    })
                    ->leftJoinSub($compSub, 'ct', 'users.id', '=', 'ct.user_id')
                    ->when($department !== 'all', function ($q) use ($department) {
                        return $q->where('users.department', $department);
                    });

                // Select columns depending on whether activity table exists
                if ($hasActivities) {
                    $rows = $usersQ->selectRaw('users.id as user_id, users.name, COALESCE(act.logins,0) as logins, COALESCE(act.minutes,0) as minutes, COALESCE(ct.completions,0) as completions, COALESCE(act.interactions,0) as interactions')
                        ->get();
                } else {
                    // No activity table: fall back to zeros for activity-derived metrics
                    $rows = $usersQ->selectRaw('users.id as user_id, users.name, 0 as logins, 0 as minutes, COALESCE(ct.completions,0) as completions, 0 as interactions')
                        ->get();
                }

                return $rows;
            });
        } catch (\Exception $e) {
            Log::error('AnalyticsController::engagement error: ' . $e->getMessage());
            return response()->json(['error' => 'Unable to compute engagement metrics'], 500);
        }

        // Weighted score: L*1 + M*0.5 + C*10 + D*20
        $scores = $payload->map(function ($r) {
            $score = ($r->logins * 1) + ($r->minutes * 0.5) + ($r->completions * 10) + ($r->interactions * 20);
            return [
                'user_id' => $r->user_id,
                'name' => $r->name,
                'score' => (float) $score,
            ];
        });

        // if empty, return empty buckets
        if ($scores->isEmpty()) {
            return response()->json([
                'buckets' => [
                    ['name' => 'Highly Engaged', 'value' => 0, 'color' => '#10B981'],
                    ['name' => 'Moderately Engaged', 'value' => 0, 'color' => '#F59E0B'],
                    ['name' => 'Low Engagement', 'value' => 0, 'color' => '#EF4444'],
                ],
                'top' => [],
                'at_risk' => [],
            ]);
        }

            // compute percentiles (25th and 75th)
            $values = $scores->pluck('score')->sort()->values()->all();
            $n = count($values);
            $pctIndex = function ($p) use ($values, $n) {
                $idx = (int) floor(($n - 1) * ($p / 100));
                return $values[max(0, min($n - 1, $idx))];
            };

            $highThreshold = $pctIndex(75);
            $lowThreshold = $pctIndex(25);

            $high = $scores->filter(fn($s) => $s['score'] >= $highThreshold)->values();
            $moderate = $scores->filter(fn($s) => $s['score'] >= $lowThreshold && $s['score'] < $highThreshold)->values();
            $low = $scores->filter(fn($s) => $s['score'] < $lowThreshold)->values();

            // Prepare return structure similar to previous pie format
            $buckets = [
                ['name' => 'Highly Engaged', 'value' => $high->count(), 'color' => '#10B981'],
                ['name' => 'Moderately Engaged', 'value' => $moderate->count(), 'color' => '#F59E0B'],
                ['name' => 'Low Engagement', 'value' => $low->count(), 'color' => '#EF4444'],
            ];

            $top = $scores->sortByDesc('score')->take(10)->values()->toArray();
            $atRisk = $low->sortBy('score')->take(10)->values()->toArray();

            return response()->json([
                'buckets' => $buckets,
                'thresholds' => ['high' => $highThreshold, 'low' => $lowThreshold],
                'top' => $top,
                'at_risk' => $atRisk,
            ]);
    }

    /**
     * Get learning effectiveness metrics
     */
    public function learningEffectiveness(Request $request)
    {
        $range = $this->parseRange($request->query('range', 30));
        $department = $request->query('department', 'all');
        $moduleId = $request->query('module_id', null);

        $cacheKey = "analytics_effectiveness_{$range}_{$department}_{$moduleId}";

        try {
            $data = Cache::remember($cacheKey, 60 * 60, function () use ($range, $department, $moduleId) {
                $startDate = now()->subDays($range)->startOfDay();
                $endDate = now()->endOfDay();

                // Build base query
                $baseQuery = DB::table('user_trainings as ut')
                    ->join('users as u', 'ut.user_id', '=', 'u.id')
                    ->join('modules as m', 'ut.module_id', '=', 'm.id')
                    ->where('ut.updated_at', '>=', $startDate)
                    ->where('ut.status', 'completed');

                if ($department !== 'all') {
                    $baseQuery->where('u.department', $department);
                }

                if ($moduleId) {
                    $baseQuery->where('m.id', $moduleId);
                }

                // Calculate effectiveness metrics
                $effectiveness = (clone $baseQuery)
                    ->select(
                        DB::raw('COUNT(DISTINCT ut.id) as total_completions'),
                        DB::raw('COUNT(DISTINCT ut.user_id) as unique_learners'),
                        DB::raw('AVG(COALESCE(ut.final_score, 0)) as avg_final_score'),
                        DB::raw('MIN(COALESCE(ut.final_score, 0)) as min_score'),
                        DB::raw('MAX(COALESCE(ut.final_score, 0)) as max_score'),
                        DB::raw('STDDEV(COALESCE(ut.final_score, 0)) as score_stddev'),
                        DB::raw("SUM(CASE WHEN ut.final_score >= 75 THEN 1 ELSE 0 END) as passed_count"),
                        DB::raw("SUM(CASE WHEN ut.final_score < 75 THEN 1 ELSE 0 END) as failed_count")
                    )
                    ->first();

                $totalCompletions = (int) ($effectiveness->total_completions ?? 0);
                if ($totalCompletions === 0) {
                    return [];
                }

                $passedCount = (int) ($effectiveness->passed_count ?? 0);
                $failedCount = (int) ($effectiveness->failed_count ?? 0);
                $passRate = $totalCompletions > 0 ? round(($passedCount / $totalCompletions) * 100, 1) : 0;
                
                // Performance categories
                $avgScore = round($effectiveness->avg_final_score ?? 0, 1);
                if ($avgScore >= 85) {
                    $performanceLevel = 'Excellent';
                } elseif ($avgScore >= 75) {
                    $performanceLevel = 'Good';
                } elseif ($avgScore >= 65) {
                    $performanceLevel = 'Satisfactory';
                } else {
                    $performanceLevel = 'Needs Improvement';
                }

                // Module-level metrics
                $moduleMetrics = (clone $baseQuery)
                    ->select(
                        'm.id',
                        'm.title',
                        DB::raw('COUNT(DISTINCT ut.id) as completions'),
                        DB::raw('AVG(COALESCE(ut.final_score, 0)) as avg_score'),
                        DB::raw("SUM(CASE WHEN ut.final_score >= 75 THEN 1 ELSE 0 END) as pass_count")
                    )
                    ->groupBy('m.id', 'm.title')
                    ->orderByDesc('avg_score')
                    ->limit(10)
                    ->get();

                $topModules = $moduleMetrics->map(function ($mod) {
                    $completions = (int) $mod->completions;
                    $passCount = (int) $mod->pass_count;
                    $passRate = $completions > 0 ? round(($passCount / $completions) * 100, 1) : 0;

                    return [
                        'module_id' => (int) $mod->id,
                        'module_title' => $mod->title,
                        'completions' => $completions,
                        'avg_score' => round($mod->avg_score, 1),
                        'pass_rate' => $passRate,
                        'effectiveness_score' => round((round($mod->avg_score, 1) * 0.6) + ($passRate * 0.4), 1)
                    ];
                })->toArray();

                // Department-level comparison if applicable
                $deptMetrics = [];
                if (!$moduleId) {
                    $deptData = DB::table('user_trainings as ut')
                        ->join('users as u', 'ut.user_id', '=', 'u.id')
                        ->where('ut.updated_at', '>=', $startDate)
                        ->where('ut.status', 'completed')
                        ->select(
                            'u.department',
                            DB::raw('COUNT(DISTINCT ut.id) as completions'),
                            DB::raw('AVG(COALESCE(ut.final_score, 0)) as avg_score'),
                            DB::raw("SUM(CASE WHEN ut.final_score >= 75 THEN 1 ELSE 0 END) as pass_count")
                        )
                        ->groupBy('u.department')
                        ->orderByDesc('avg_score')
                        ->get();

                    $deptMetrics = $deptData->map(function ($dept) {
                        $completions = (int) $dept->completions;
                        $passCount = (int) $dept->pass_count;
                        $passRate = $completions > 0 ? round(($passCount / $completions) * 100, 1) : 0;

                        return [
                            'department' => $dept->department,
                            'completions' => $completions,
                            'avg_score' => round($dept->avg_score, 1),
                            'pass_rate' => $passRate
                        ];
                    })->toArray();
                }

                return [
                    'summary' => [
                        'total_completions' => $totalCompletions,
                        'unique_learners' => (int) ($effectiveness->unique_learners ?? 0),
                        'avg_final_score' => $avgScore,
                        'score_range' => [
                            'min' => round($effectiveness->min_score ?? 0, 1),
                            'max' => round($effectiveness->max_score ?? 0, 1),
                            'stddev' => round($effectiveness->score_stddev ?? 0, 1)
                        ],
                        'pass_rate' => $passRate,
                        'passed_count' => $passedCount,
                        'failed_count' => $failedCount,
                        'performance_level' => $performanceLevel
                    ],
                    'top_modules' => $topModules,
                    'department_comparison' => $deptMetrics
                ];
            });

            if (empty($data)) {
                return response()->json([
                    'success' => true,
                    'message' => 'Tidak ada data efektivitas pembelajaran',
                    'data' => []
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Metrik efektivitas pembelajaran berhasil diambil',
                'data' => $data
            ]);

        } catch (\Exception $e) {
            Log::error('AnalyticsController::learningEffectiveness error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil metrik efektivitas pembelajaran',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get skills radar chart data
     */
    public function skillsRadar(Request $request)
    {
        $userId = $request->query('user_id');
        $department = $request->query('department', 'all');

        $cacheKey = "analytics_skills_{$userId}_{$department}";

        try {
            $payload = Cache::remember($cacheKey, 60 * 60, function () use ($userId, $department) {
                // Target lookup (if competency_matrix exists)
                $targets = [];
                if (\Illuminate\Support\Facades\Schema::hasTable('competency_matrix')) {
                    $targets = DB::table('competency_matrix')->pluck('target_score','skill')->toArray();
                }

                // Use difficulty_level if exists, otherwise treat difficulty as 1
                $hasDifficulty = \Illuminate\Support\Facades\Schema::hasColumn('modules', 'difficulty_level');
                $difficultyExpr = $hasDifficulty ? 'COALESCE(m.difficulty_level, 1)' : '1';

                // Weighted proficiency: SUM(user_score * difficulty) / SUM(max_score * difficulty)
                $skillsData = DB::table('modules as m')
                    ->join('user_trainings as ut', 'm.id', '=', 'ut.module_id')
                    ->join('users as u', 'ut.user_id', '=', 'u.id')
                    ->where('ut.status', 'completed')
                    ->when($userId, function ($query) use ($userId) {
                        return $query->where('ut.user_id', $userId);
                    })
                    ->when($department !== 'all', function ($query) use ($department) {
                        return $query->where('u.department', $department);
                    })
                    ->select(
                        'm.category as skill',
                        DB::raw('SUM( COALESCE(ut.final_score,0) * ' . $difficultyExpr . ' ) as weighted_user_score'),
                        DB::raw('SUM( 100 * ' . $difficultyExpr . ' ) as weighted_max_score'),
                        DB::raw('COUNT(DISTINCT m.id) as modules_count')
                    )
                    ->whereNotNull('m.category')
                    ->groupBy('m.category')
                    ->get();

                $chartData = $skillsData->map(function ($item) use ($targets) {
                    $actual = ($item->weighted_max_score > 0) ? round(($item->weighted_user_score / $item->weighted_max_score) * 100, 1) : 0;
                    $target = $targets[$item->skill] ?? 80; // default target
                    return [
                        'subject' => $item->skill,
                        'A' => (float) $actual,
                        'B' => (float) $target,
                        'gap' => round($target - $actual, 1),
                        'modules_count' => (int) $item->modules_count,
                    ];
                })->values();

                // If empty, return defaults for frontend
                if ($chartData->isEmpty()) {
                    $chartData = collect([
                        ['subject' => 'Technical', 'A' => 0, 'B' => 80, 'gap' => 80, 'modules_count' => 0],
                        ['subject' => 'Leadership', 'A' => 0, 'B' => 80, 'gap' => 80, 'modules_count' => 0],
                        ['subject' => 'Communication', 'A' => 0, 'B' => 80, 'gap' => 80, 'modules_count' => 0],
                    ]);
                }

                return [
                    'data' => $chartData->toArray(),
                    'summary' => [
                        'total_skills' => $chartData->count(),
                        'avg_proficiency' => $chartData->avg('A'),
                        'largest_gap' => $chartData->sortByDesc('gap')->first(),
                    ]
                ];
            });

            return response()->json($payload);
        } catch (\Exception $e) {
            Log::error('AnalyticsController::skillsRadar error: ' . $e->getMessage());
            return response()->json(['error' => 'Unable to compute skills radar data'], 500);
        }
    }
}
