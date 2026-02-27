<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\Enrollment;
use App\Models\ModuleAssignment;
use App\Models\ComplianceAuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Compliance Escalation API Controller
 * Shows overdue assignments, non-compliance cases, and escalation tracking
 */
class ComplianceEscalationController
{
    /**
     * Get compliance escalations
     * GET /api/admin/compliance/escalations
     */
    public function escalations(Request $request)
    {
        try {
            $escalations = [
                'critical_escalations' => $this->getCriticalEscalations(),
                'non_compliant_users' => $this->getNonCompliantUsers(),
                'escalation_timeline' => $this->getEscalationTimeline(),
                'department_compliance' => $this->getDepartmentCompliance(),
                'summary' => $this->getEscalationSummary(),
            ];

            return response()->json([
                'status' => 'success',
                'data' => $escalations,
                'timestamp' => now(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch compliance escalations',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get critical escalations requiring immediate action
     */
    private function getCriticalEscalations()
    {
        return ModuleAssignment::where('due_date', '<', now()->subDays(7))
            ->where('status', '!=', 'completed')
            ->with(['user:id,name,email,department', 'module:id,title'])
            ->orderBy('due_date', 'asc')
            ->limit(20)
            ->get()
            ->map(function ($assignment) {
                $daysOverdue = now()->diffInDays($assignment->due_date, false);
                $escalationLevel = $this->calculateEscalationLevel($daysOverdue);

                return [
                    'id' => $assignment->id,
                    'user_id' => $assignment->user_id,
                    'user_name' => $assignment->user->name ?? 'Unknown',
                    'user_email' => $assignment->user->email ?? '',
                    'department' => $assignment->user->department ?? 'Unknown',
                    'module_title' => $assignment->module->title ?? 'Unknown',
                    'due_date' => $assignment->due_date->format('Y-m-d'),
                    'days_overdue' => $daysOverdue,
                    'status' => $assignment->status,
                    'escalation_level' => $escalationLevel,
                    'action_required' => $this->getRequiredAction($escalationLevel),
                    'assigned_date' => $assignment->assigned_date?->format('Y-m-d'),
                ];
            });
    }

    /**
     * Get non-compliant users
     */
    private function getNonCompliantUsers()
    {
        return User::where('role', '!=', 'admin')
            ->select('users.id', 'users.name', 'users.email', 'users.department')
            ->selectRaw('COUNT(module_assignments.id) as overdue_count')
            ->selectRaw('SUM(CASE WHEN enrollments.status = "completed" THEN 1 ELSE 0 END) as completed_enrollments')
            ->selectRaw('COUNT(DISTINCT enrollments.id) as total_enrollments')
            ->leftJoin('enrollments', 'users.id', '=', 'enrollments.user_id')
            ->leftJoin('module_assignments', function ($join) {
                $join->on('users.id', '=', 'module_assignments.user_id')
                    ->whereRaw('module_assignments.due_date < ?', [now()])
                    ->where('module_assignments.status', '!=', 'completed');
            })
            ->groupBy('users.id', 'users.name', 'users.email', 'users.department')
            ->havingRaw('overdue_count > 0 OR (total_enrollments > 0 AND (completed_enrollments / total_enrollments) < 0.5)')
            ->orderByDesc('overdue_count')
            ->limit(50)
            ->get()
            ->map(function ($user) {
                $completionRate = $user->total_enrollments > 0
                    ? round(($user->completed_enrollments / $user->total_enrollments) * 100, 2)
                    : 0;

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'department' => $user->department ?? 'Unknown',
                    'overdue_assignments' => $user->overdue_count ?? 0,
                    'completion_rate' => $completionRate,
                    'total_enrollments' => $user->total_enrollments ?? 0,
                    'compliance_status' => $this->calculateComplianceStatus($completionRate, $user->overdue_count ?? 0),
                ];
            });
    }

    /**
     * Get escalation timeline (past 7 days)
     */
    private function getEscalationTimeline()
    {
        $timeline = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dateStr = $date->format('Y-m-d');

            $count = ModuleAssignment::whereDate('due_date', $dateStr)
                ->where('due_date', '<', now())
                ->where('status', '!=', 'completed')
                ->count();

            $timeline[] = [
                'date' => $dateStr,
                'day' => $date->format('l'),
                'overdue_count' => $count,
            ];
        }

        return $timeline;
    }

    /**
     * Get department-level compliance metrics with optimized aggregation
     */
    private function getDepartmentCompliance()
    {
        return DB::table('module_assignments as ma')
            ->select('u.department',
                DB::raw('COUNT(*) as total_assignments'),
                DB::raw('SUM(CASE WHEN ma.due_date < NOW() AND ma.status != "completed" THEN 1 ELSE 0 END) as overdue_count'),
                DB::raw('COUNT(DISTINCT u.id) as user_count')
            )
            ->join('users as u', 'ma.user_id', '=', 'u.id')
            ->where('u.role', '!=', 'admin')
            ->groupBy('u.department')
            ->orderByDesc('overdue_count')
            ->get()
            ->map(function ($dept) {
                $complianceRate = $dept->total_assignments > 0
                    ? round((($dept->total_assignments - $dept->overdue_count) / $dept->total_assignments) * 100, 2)
                    : 100;

                return [
                    'department' => $dept->department ?? 'Unassigned',
                    'user_count' => $dept->user_count,
                    'total_assignments' => $dept->total_assignments,
                    'overdue_assignments' => $dept->overdue_count,
                    'compliance_rate' => $complianceRate,
                    'status' => $complianceRate >= 80 ? 'compliant' : ($complianceRate >= 50 ? 'at_risk' : 'non_compliant'),
                ];
            });
    }

    /**
     * Get escalation summary
     */
    private function getEscalationSummary()
    {
        $criticalCount = ModuleAssignment::where('due_date', '<', now()->subDays(30))
            ->where('status', '!=', 'completed')
            ->count();

        $warningCount = ModuleAssignment::where('due_date', '<', now()->subDays(7))
            ->where('due_date', '>=', now()->subDays(30))
            ->where('status', '!=', 'completed')
            ->count();

        $totalOverdue = ModuleAssignment::where('due_date', '<', now())
            ->where('status', '!=', 'completed')
            ->count();

        return [
            'total_overdue_assignments' => $totalOverdue,
            'critical_escalations' => $criticalCount,
            'warning_level_escalations' => $warningCount,
            'non_compliant_users' => User::select('id')
                ->leftJoin('module_assignments', function ($join) {
                    $join->on('users.id', '=', 'module_assignments.user_id')
                        ->whereRaw('module_assignments.due_date < ?', [now()])
                        ->where('module_assignments.status', '!=', 'completed');
                })
                ->whereNotNull('module_assignments.id')
                ->distinct()
                ->count(),
            'escalation_trend' => 'stable',
        ];
    }

    /**
     * Calculate escalation level based on days overdue
     * Uses configurable thresholds from config/escalation.php
     */
    private function calculateEscalationLevel($daysOverdue)
    {
        $criticalDays = config('escalation.critical_days', 30);
        $highDays = config('escalation.high_days', 14);
        $mediumDays = config('escalation.medium_days', 7);

        if ($daysOverdue > $criticalDays) {
            return 'critical';
        } elseif ($daysOverdue > $highDays) {
            return 'high';
        } elseif ($daysOverdue > $mediumDays) {
            return 'medium';
        }
        return 'low';
    }

    /**
     * Get required action for escalation level
     */
    private function getRequiredAction($level)
    {
        $actions = [
            'critical' => 'Immediate intervention required - contact manager',
            'high' => 'Schedule follow-up with user',
            'medium' => 'Send reminder notification',
            'low' => 'Monitor closely',
        ];

        return $actions[$level] ?? 'Unknown';
    }

    /**
     * Calculate compliance status
     */
    private function calculateComplianceStatus($completionRate, $overdueCount)
    {
        if ($overdueCount > 3 || $completionRate < 30) {
            return 'non_compliant';
        } elseif ($overdueCount > 0 || $completionRate < 60) {
            return 'at_risk';
        }
        return 'compliant';
    }
}
