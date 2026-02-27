<?php

namespace App\Services;

use App\Models\UserTraining;
use App\Models\User;
use App\Models\Module;
use App\Models\Notification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Collection;
use Carbon\Carbon;

/**
 * ComplianceService
 * Handles compliance tracking, escalation, and non-compliance notifications
 */
class ComplianceService
{
    const ESCALATION_LEVELS = [
        0 => 'none',
        1 => 'manager',
        2 => 'department_head',
        3 => 'executive',
    ];

    /**
     * Check compliance status and trigger escalation if needed
     */
    public function checkAndEscalateCompliance(UserTraining $enrollment): void
    {
        if (!$enrollment->module->compliance_required) {
            return;
        }

        $module = $enrollment->module;
        $isNonCompliant = false;
        $reason = null;

        // Check 1: Overdue completion
        if ($module->end_date && now()->isAfter($module->end_date)) {
            if ($enrollment->status !== 'completed' && !$enrollment->is_certified) {
                $isNonCompliant = true;
                $reason = "Compliance deadline ({$module->end_date->toDateString()}) has passed";
            }
        }

        // Check 2: Score below passing
        if ($enrollment->final_score !== null && $enrollment->status === 'completed') {
            if ($enrollment->final_score < ($enrollment->passing_grade ?? 70)) {
                $isNonCompliant = true;
                $reason = "Score {$enrollment->final_score} below passing grade {$enrollment->passing_grade}";
            }
        }

        if ($isNonCompliant) {
            $this->escalateNonCompliance($enrollment, $reason);
        } else {
            // Mark as compliant if all checks pass
            if ($enrollment->status === 'completed' || $enrollment->is_certified) {
                $enrollment->update([
                    'compliance_status' => 'compliant',
                    'escalation_level' => 0,
                ]);
            }
        }
    }

    /**
     * Escalate non-compliance through management chain
     */
    public function escalateNonCompliance(UserTraining $enrollment, ?string $reason): void
    {
        DB::beginTransaction();
        try {
            $user = $enrollment->user;
            $currentLevel = $enrollment->escalation_level ?? 0;
            $newLevel = min($currentLevel + 1, 3);

            $enrollment->update([
                'compliance_status' => 'non_compliant',
                'escalation_level' => $newLevel,
                'escalated_at' => $newLevel > $currentLevel ? now() : $enrollment->escalated_at,
            ]);

            // Send notifications based on escalation level
            $this->notifyEscalation($enrollment, $newLevel, $reason);

            // Log the escalation
            $this->logEscalation($enrollment, $currentLevel, $newLevel, $reason);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Send notifications to appropriate stakeholders
     */
    private function notifyEscalation(UserTraining $enrollment, int $level, ?string $reason): void
    {
        $user = $enrollment->user;
        $module = $enrollment->module;

        switch ($level) {
            case 1:
                // Notify immediate manager
                $this->notifyManager($user, $module, $reason);
                break;

            case 2:
                // Notify department head
                $this->notifyDepartmentHead($user, $module, $reason);
                break;

            case 3:
                // Notify executive
                $this->notifyExecutive($user, $module, $reason);
                break;
        }
    }

    /**
     * Log escalation for audit trail
     */
    private function logEscalation(UserTraining $enrollment, int $oldLevel, int $newLevel, ?string $reason): void
    {
        if ($oldLevel !== $newLevel) {
            $enrollment->complianceAuditLogs()->create([
                'action' => 'escalation',
                'old_value' => self::ESCALATION_LEVELS[$oldLevel] ?? 'none',
                'new_value' => self::ESCALATION_LEVELS[$newLevel] ?? 'none',
                'triggered_by' => Auth::id() ?? 1,
                'reason' => $reason,
            ]);
        }
    }

    /**
     * Get all non-compliant users for a module
     */
    public function getNonCompliantUsers(Module $module): Collection
    {
        return UserTraining::where('module_id', $module->id)
            ->where('compliance_status', 'non_compliant')
            ->with(['user', 'module'])
            ->get();
    }

    /**
     * Get at-risk users (approaching deadline)
     */
    public function getAtRiskUsers(Module $module, $daysBeforeDeadline = 7): Collection
    {
        $deadlineThreshold = now()->addDays($daysBeforeDeadline);

        return UserTraining::where('module_id', $module->id)
            ->whereIn('status', ['enrolled', 'in_progress'])
            ->where('compliance_status', '!=', 'compliant')
            ->when($module->end_date, function ($query) use ($deadlineThreshold) {
                return $query->where('module.end_date', '<=', $deadlineThreshold);
            })
            ->with(['user', 'module'])
            ->get();
    }

    /**
     * Batch check compliance for all enrollments
     */
    public function checkAllCompliance(): void
    {
        DB::beginTransaction();
        try {
            $enrollments = UserTraining::where('compliance_status', '!=', 'compliant')
                ->whereHas('module', function ($query) {
                    $query->where('compliance_required', true);
                })
                ->get();

            foreach ($enrollments as $enrollment) {
                $this->checkAndEscalateCompliance($enrollment);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Resolve non-compliance
     */
    public function resolveNonCompliance(UserTraining $enrollment, string $reason): void
    {
        DB::beginTransaction();
        try {
            $oldLevel = $enrollment->escalation_level;

            $enrollment->update([
                'compliance_status' => 'compliant',
                'escalation_level' => 0,
                'escalated_at' => null,
            ]);

            $enrollment->complianceAuditLogs()->create([
                'action' => 'resolution',
                'old_value' => self::ESCALATION_LEVELS[$oldLevel] ?? 'none',
                'new_value' => 'compliant',
                'triggered_by' => Auth::id() ?? 1,
                'reason' => $reason,
            ]);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get compliance summary dashboard
     */
    public function getComplianceSummary(): array
    {
        return [
            'total_enrollments' => UserTraining::count(),
            'compliant_count' => UserTraining::where('compliance_status', 'compliant')->count(),
            'non_compliant_count' => UserTraining::where('compliance_status', 'non_compliant')->count(),
            'escalated_count' => UserTraining::where('compliance_status', 'escalated')->count(),
            'escalation_breakdown' => UserTraining::where('compliance_status', '!=', 'compliant')
                ->selectRaw('escalation_level, COUNT(*) as count')
                ->groupBy('escalation_level')
                ->pluck('count', 'escalation_level')
                ->toArray(),
        ];
    }

    /**
     * Send notification to manager
     */
    private function notifyManager(User $user, Module $module, string $reason): void
    {
        $manager = $user->manager();
        if (!$manager) {
            return;
        }

        $this->createNotification(
            $manager->id,
            'Compliance Alert: Direct Report Non-Compliant',
            "Employee {$user->name} is non-compliant in module '{$module->title}'. Reason: {$reason}",
            'compliance_escalation'
        );
    }

    /**
     * Send notification to department head
     */
    private function notifyDepartmentHead(User $user, Module $module, string $reason): void
    {
        if (!$user->department) {
            return;
        }

        $deptHead = User::where('department_id', $user->department_id)
            ->where('is_department_head', true)
            ->first();

        if ($deptHead) {
            $this->createNotification(
                $deptHead->id,
                'Compliance Alert: Department Non-Compliance Escalation',
                "Employee {$user->name} in department '{$user->department->name}' is non-compliant in '{$module->title}'. Level 2 escalation. Reason: {$reason}",
                'compliance_escalation'
            );
        }
    }

    /**
     * Send notification to executive
     */
    private function notifyExecutive(User $user, Module $module, string $reason): void
    {
        // Get all executives (users with executive roles)
        $executives = User::whereHas('roles', fn($q) => 
            $q->where('name', 'like', '%executive%')
                ->orWhere('name', 'like', '%ceo%')
                ->orWhere('name', 'like', '%director%')
        )->get();

        foreach ($executives as $executive) {
            $this->createNotification(
                $executive->id,
                'URGENT: Level 3 Compliance Escalation',
                "Employee {$user->name} has reached Level 3 escalation for non-compliance in '{$module->title}'. Immediate action required. Reason: {$reason}",
                'compliance_escalation_urgent'
            );
        }
    }

    /**
     * Create in-app notification
     */
    private function createNotification(
        int $userId,
        string $title,
        string $message,
        string $type = 'info'
    ): void {
        try {
            Notification::create([
                'user_id' => $userId,
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'is_read' => false,
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to create notification: ' . $e->getMessage());
        }
    }
}
