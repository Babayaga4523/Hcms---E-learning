<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\Enrollment;
use App\Models\ModuleProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Prediction API Controller
 * Provides ML/statistical predictions for at-risk learners and dropout risk
 */
class PredictionController
{
    /**
     * Get dropout risk predictions
     * GET /api/admin/predictions/dropout-risk
     */
    public function dropoutRisk(Request $request)
    {
        try {
            $limit = $request->input('limit', 50);
            $threshold = $request->input('threshold', 0.5); // Risk score threshold (0-1)

            $predictions = [
                'high_risk_users' => $this->getHighRiskUsers($limit, $threshold),
                'risk_distribution' => $this->getRiskDistribution(),
                'risk_factors' => $this->getTopRiskFactors(),
                'intervention_recommendations' => $this->getInterventions(),
                'predictions_summary' => $this->getPredictionsSummary(),
            ];

            return response()->json([
                'status' => 'success',
                'data' => $predictions,
                'timestamp' => now(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch dropout risk predictions',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get high-risk users for dropout
     */
    private function getHighRiskUsers($limit = 50, $threshold = 0.5)
    {
        $users = User::where('role', '!=', 'admin')
            ->select('users.id', 'users.name', 'users.email', 'users.department', 'users.created_at')
            ->get();

        $atRiskUsers = [];

        foreach ($users as $user) {
            $riskScore = $this->calculateDropoutRiskScore($user);

            if ($riskScore >= $threshold) {
                $atRiskUsers[] = [
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'user_email' => $user->email,
                    'department' => $user->department ?? 'Unknown',
                    'risk_score' => round($riskScore, 3),
                    'risk_level' => $this->getRiskLevel($riskScore),
                    'days_enrolled' => now()->diffInDays($user->created_at),
                    'risk_factors' => $this->identifyRiskFactors($user),
                    'recommended_action' => $this->getRecommendedAction($riskScore),
                ];
            }
        }

        // Sort by risk score descending
        usort($atRiskUsers, function ($a, $b) {
            return $b['risk_score'] <=> $a['risk_score'];
        });

        return array_slice($atRiskUsers, 0, $limit);
    }

    /**
     * Calculate dropout risk score (0-1) with trend analysis
     * Improved algorithm with recency weighting and trend detection
     */
    private function calculateDropoutRiskScore($user)
    {
        // Factor 1: Completion rate (35% weight)
        $totalEnrollments = Enrollment::where('user_id', $user->id)->count();
        $completedEnrollments = Enrollment::where('user_id', $user->id)
            ->where('status', 'completed')
            ->count();

        $completionRate = $totalEnrollments > 0 ? $completedEnrollments / $totalEnrollments : 0;
        $completionRiskScore = (1 - $completionRate) * 0.35;

        // Factor 2: Recent performance - last 30 days (35% weight)
        $currentMonthAvg = ModuleProgress::where('user_id', $user->id)
            ->where('completed_at', '>=', now()->subDays(30))
            ->avg('score') ?? 0;

        $recentPerformanceScore = (1 - min($currentMonthAvg / 100, 1)) * 0.35;

        // Factor 3: Recent engagement - activities in last 30 days (20% weight)
        $recentActivity = ModuleProgress::where('user_id', $user->id)
            ->where('completed_at', '>=', now()->subDays(30))
            ->count();

        $recentEngagementScore = (1 - min($recentActivity / 5, 1)) * 0.20;

        // Factor 4: Trend analysis - comparing past 30-60 days vs current 0-30 days (10% weight)
        $pastMonthAvg = ModuleProgress::where('user_id', $user->id)
            ->where('completed_at', '>=', now()->subDays(60))
            ->where('completed_at', '<', now()->subDays(30))
            ->avg('score') ?? 0;

        $trend = 0;
        if ($pastMonthAvg > 0) {
            $trend = ($currentMonthAvg - $pastMonthAvg) / $pastMonthAvg;
        }

        // Reduce risk score if trending positively (improving)
        $trendBonus = max($trend, 0) * 0.10; // Max 10% reduction if improving

        // Calculate final score and clamp to 0-1 range
        $riskScore = $completionRiskScore + $recentPerformanceScore + $recentEngagementScore - $trendBonus;
        return max(min($riskScore, 1), 0);
    }

    /**
     * Get risk level label
     */
    private function getRiskLevel($riskScore)
    {
        if ($riskScore >= 0.7) {
            return 'critical';
        } elseif ($riskScore >= 0.5) {
            return 'high';
        } elseif ($riskScore >= 0.3) {
            return 'medium';
        }
        return 'low';
    }

    /**
     * Identify specific risk factors for user
     */
    private function identifyRiskFactors($user)
    {
        $factors = [];

        // Check completion rate
        $totalEnrollments = Enrollment::where('user_id', $user->id)->count();
        $completedEnrollments = Enrollment::where('user_id', $user->id)
            ->where('status', 'completed')
            ->count();

        if ($totalEnrollments > 0) {
            $completionRate = $completedEnrollments / $totalEnrollments;
            if ($completionRate < 0.5) {
                $factors[] = [
                    'name' => 'low_completion_rate',
                    'description' => "Only completed {$completionRate}% of enrollments",
                    'severity' => 'high',
                ];
            }
        }

        // Check average score
        $avgScore = ModuleProgress::where('user_id', $user->id)
            ->whereNotNull('score')
            ->avg('score') ?? 0;

        if ($avgScore < 60) {
            $factors[] = [
                'name' => 'low_average_score',
                'description' => "Average score is {$avgScore}%",
                'severity' => 'high',
            ];
        }

        // Check inactivity
        $lastActivity = ModuleProgress::where('user_id', $user->id)
            ->orderBy('completed_at', 'desc')
            ->first();

        $daysSinceActivity = $lastActivity
            ? now()->diffInDays($lastActivity->completed_at)
            : now()->diffInDays($user->created_at);

        if ($daysSinceActivity > 30) {
            $factors[] = [
                'name' => 'inactivity',
                'description' => "No activity for {$daysSinceActivity} days",
                'severity' => $daysSinceActivity > 60 ? 'high' : 'medium',
            ];
        }

        return $factors;
    }

    /**
     * Get recommended action based on risk score
     */
    private function getRecommendedAction($riskScore)
    {
        if ($riskScore >= 0.7) {
            return 'Immediate intervention - contact user urgently';
        } elseif ($riskScore >= 0.5) {
            return 'Schedule one-on-one coaching session';
        } elseif ($riskScore >= 0.3) {
            return 'Send encouragement message';
        }
        return 'Continue monitoring';
    }

    /**
     * Get risk distribution
     */
    private function getRiskDistribution()
    {
        $distribution = [
            'critical' => 0,
            'high' => 0,
            'medium' => 0,
            'low' => 0,
        ];

        $users = User::where('role', '!=', 'admin')->get();

        foreach ($users as $user) {
            $riskScore = $this->calculateDropoutRiskScore($user);
            $riskLevel = $this->getRiskLevel($riskScore);
            $distribution[$riskLevel]++;
        }

        return $distribution;
    }

    /**
     * Get top risk factors across all users
     */
    private function getTopRiskFactors()
    {
        $factorCounts = [
            'low_completion_rate' => 0,
            'low_average_score' => 0,
            'inactivity' => 0,
            'no_recent_engagement' => 0,
        ];

        $users = User::where('role', '!=', 'admin')->get();

        foreach ($users as $user) {
            $factors = $this->identifyRiskFactors($user);
            foreach ($factors as $factor) {
                if (isset($factorCounts[$factor['name']])) {
                    $factorCounts[$factor['name']]++;
                }
            }
        }

        // Convert to array of factor details
        $topFactors = [];
        foreach ($factorCounts as $factor => $count) {
            $topFactors[] = [
                'factor' => $factor,
                'count' => $count,
                'percentage' => round(($count / max(count($users), 1)) * 100, 2),
            ];
        }

        usort($topFactors, function ($a, $b) {
            return $b['count'] <=> $a['count'];
        });

        return $topFactors;
    }

    /**
     * Get intervention recommendations
     */
    private function getInterventions()
    {
        return [
            [
                'type' => 'immediate',
                'name' => 'Critical Risk Alert',
                'description' => 'Contact users with risk score > 0.7',
                'suggested_actions' => [
                    'Call or video chat with user',
                    'Identify obstacles preventing progress',
                    'Create personalized action plan',
                ],
            ],
            [
                'type' => 'short_term',
                'name' => 'Coaching Session',
                'description' => 'Schedule coaching for risk score 0.5-0.7',
                'suggested_actions' => [
                    'One-on-one meeting',
                    'Review progress and goals',
                    'Provide additional resources',
                ],
            ],
            [
                'type' => 'ongoing',
                'name' => 'Engagement Program',
                'description' => 'Boost engagement for risk score 0.3-0.5',
                'suggested_actions' => [
                    'Send motivational messages',
                    'Offer additional learning resources',
                    'Create peer study groups',
                ],
            ],
        ];
    }

    /**
     * Get predictions summary
     */
    private function getPredictionsSummary()
    {
        $users = User::where('role', '!=', 'admin')->get();
        $distribution = $this->getRiskDistribution();

        return [
            'total_users_analyzed' => count($users),
            'users_at_risk' => $distribution['critical'] + $distribution['high'],
            'critical_risk_count' => $distribution['critical'],
            'high_risk_count' => $distribution['high'],
            'medium_risk_count' => $distribution['medium'],
            'low_risk_count' => $distribution['low'],
            'overall_risk_percentage' => round((($distribution['critical'] + $distribution['high']) / max(count($users), 1)) * 100, 2),
        ];
    }
}
