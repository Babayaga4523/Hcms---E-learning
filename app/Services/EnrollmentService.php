<?php

namespace App\Services;

use App\Models\UserTraining;
use App\Models\Module;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Exception;

/**
 * EnrollmentService
 * Handles all enrollment business logic including validation, state management, and prerequisites
 */
class EnrollmentService
{
    const VALID_STATE_TRANSITIONS = [
        'enrolled' => ['in_progress', 'cancelled'],
        'in_progress' => ['completed', 'failed', 'enrolled'],
        'completed' => ['certified'],
        'failed' => ['enrolled'], // Can retry
        'cancelled' => ['enrolled'], // Can re-enroll
        'certified' => [], // Terminal state
    ];

    /**
     * Enroll user in a module with validation
     */
    public function enroll(User $user, Module $module, array $metadata = []): UserTraining
    {
        DB::beginTransaction();
        try {
            // Check 1: Prevent duplicate enrollment
            $existing = UserTraining::where('user_id', $user->id)
                ->where('module_id', $module->id)
                ->whereIn('status', ['enrolled', 'in_progress', 'completed', 'certified'])
                ->first();

            if ($existing) {
                throw new Exception("User is already enrolled in this module (Status: {$existing->status})");
            }

            // Check 2: Verify prerequisites
            $prerequisitesMet = $this->checkPrerequisites($user, $module);
            if (!$prerequisitesMet['met']) {
                throw new Exception("Prerequisites not met: " . implode(', ', $prerequisitesMet['missing']));
            }

            // Check 3: Department compatibility is validated in role assignment

            // Create enrollment with initial state
            $enrollment = UserTraining::create([
                'user_id' => $user->id,
                'module_id' => $module->id,
                'status' => 'enrolled',
                'compliance_status' => $module->compliance_required ? 'non_compliant' : 'compliant',
                'enrolled_at' => now(),
                'passing_grade' => $module->passing_grade,
                'prerequisites_met' => $prerequisitesMet['met'],
                'state_history' => json_encode([
                    ['state' => 'enrolled', 'timestamp' => now(), 'reason' => 'Initial enrollment']
                ]),
            ]);

            DB::commit();
            return $enrollment;
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Check if user has completed all prerequisites for a module
     */
    public function checkPrerequisites(User $user, Module $module): array
    {
        $missing = [];

        // Check prerequisite module
        if ($module->prerequisite_module_id) {
            $prerequisiteCompleted = UserTraining::where('user_id', $user->id)
                ->where('module_id', $module->prerequisite_module_id)
                ->where('status', 'completed')
                ->orWhere('is_certified', 1)
                ->exists();

            if (!$prerequisiteCompleted) {
                $prereqModule = Module::find($module->prerequisite_module_id);
                $missing[] = "Must complete '{$prereqModule->title}' first";
            }
        }

        return [
            'met' => empty($missing),
            'missing' => $missing,
        ];
    }

    /**
     * Transition enrollment to new state with validation
     */
    public function transitionState(UserTraining $enrollment, string $newState, array $metadata = []): UserTraining
    {
        DB::beginTransaction();
        try {
            $currentState = $enrollment->status;

            // Validate state transition
            $allowedTransitions = self::VALID_STATE_TRANSITIONS[$currentState] ?? [];
            if (!in_array($newState, $allowedTransitions)) {
                throw new Exception(
                    "Cannot transition from '{$currentState}' to '{$newState}'. " .
                    "Allowed transitions: " . implode(', ', $allowedTransitions)
                );
            }

            // Additional validation for specific transitions
            if ($newState === 'completed' || $newState === 'certified') {
                $this->validateCompletionRequirements($enrollment);
            }

            // Update state and history
            $enrollment->status = $newState;
            $enrollment->state_history = $this->appendStateHistory(
                $enrollment->state_history,
                $newState,
                $metadata['reason'] ?? null
            );

            // Handle completion timestamp
            if ($newState === 'completed') {
                $enrollment->completed_at = now();
            }

            // Log the transition
            $this->logComplianceChange(
                $enrollment,
                'state_change',
                $currentState,
                $newState,
                $metadata['reason'] ?? 'State transition'
            );

            $enrollment->save();
            DB::commit();

            return $enrollment;
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Issue certificate after final validation
     */
    public function issueCertificate(UserTraining $enrollment): UserTraining
    {
        DB::beginTransaction();
        try {
            // Validate prerequisites for certification
            $this->validateCertificationRequirements($enrollment);

            $enrollment->is_certified = true;
            $enrollment->certificate_issued_at = now();
            $enrollment->status = 'certified';

            $this->logComplianceChange(
                $enrollment,
                'certification',
                'uncertified',
                'certified',
                'Certificate issued after score verification'
            );

            $enrollment->save();
            DB::commit();

            return $enrollment;
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Validate requirements for completion
     */
    private function validateCompletionRequirements(UserTraining $enrollment): void
    {
        $module = $enrollment->module;

        // Check if pretest and posttest are required
        if ($module->has_pretest || $module->has_posttest) {
            // Implementation depends on how pretest/posttest are tracked
            // This would need additional model/table definitions
        }
    }

    /**
     * Validate requirements for certificate issuance
     */
    private function validateCertificationRequirements(UserTraining $enrollment): void
    {
        // Check 1: Final score meets passing grade
        if ($enrollment->final_score !== null) {
            if ($enrollment->final_score < ($enrollment->passing_grade ?? 70)) {
                throw new Exception(
                    "Cannot issue certificate. Score {$enrollment->final_score} " .
                    "below passing grade {$enrollment->passing_grade}"
                );
            }
        }

        // Check 2: Enrollment status is completed
        if ($enrollment->status !== 'completed') {
            throw new Exception("Enrollment must be 'completed' before certification");
        }

        // Check 3: All prerequisites are met
        if (!$enrollment->prerequisites_met) {
            throw new Exception("All prerequisites must be met before certification");
        }

        // Check 4: Not already certified
        if ($enrollment->is_certified) {
            throw new Exception("This enrollment is already certified");
        }
    }

    /**
     * Append state to history
     */
    private function appendStateHistory(?string $history, string $newState, ?string $reason): string
    {
        $historyArray = json_decode($history ?? '[]', true) ?? [];

        $historyArray[] = [
            'state' => $newState,
            'timestamp' => now()->toIso8601String(),
            'reason' => $reason ?? 'No reason provided',
        ];

        return json_encode($historyArray);
    }

    /**
     * Log compliance changes for audit trail
     */
    private function logComplianceChange(
        UserTraining $enrollment,
        string $action,
        ?string $oldValue,
        ?string $newValue,
        ?string $reason
    ): void {
        $enrollment->complianceAuditLogs()->create([
            'action' => $action,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'triggered_by' => Auth::id() ?? 1,
            'reason' => $reason,
        ]);
    }
}
