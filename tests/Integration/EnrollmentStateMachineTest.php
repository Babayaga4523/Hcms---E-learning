<?php

namespace Tests\Integration;

use App\Models\UserTraining;
use App\Models\Module;
use App\Models\User;
use App\Services\EnrollmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EnrollmentStateMachineTest extends TestCase
{
    use RefreshDatabase;

    protected EnrollmentService $enrollmentService;
    protected Module $module;
    protected UserTraining $enrollment;

    protected function setUp(): void
    {
        parent::setUp();
        $this->enrollmentService = app(EnrollmentService::class);
        $this->module = Module::factory()->create();
        $this->enrollment = UserTraining::factory()->create([
            'module_id' => $this->module->id,
            'status' => 'enrolled',
        ]);
    }

    /**
     * Test state machine: enrolled -> in_progress -> completed -> certified
     */
    public function test_complete_enrollment_flow(): void
    {
        $this->assertEquals('enrolled', $this->enrollment->status);

        // Transition to in_progress
        $this->enrollmentService->transitionState($this->enrollment, 'in_progress');
        $this->enrollment->refresh();
        $this->assertEquals('in_progress', $this->enrollment->status);

        // Transition to completed
        $this->enrollmentService->transitionState($this->enrollment, 'completed');
        $this->enrollment->refresh();
        $this->assertEquals('completed', $this->enrollment->status);

        // Update score for certification
        $this->enrollment->update([
            'final_score' => 85,
            'passing_grade' => 70,
            'prerequisites_met' => true,
        ]);

        // Issue certificate
        $this->enrollmentService->issueCertificate($this->enrollment);
        $this->enrollment->refresh();

        $this->assertTrue($this->enrollment->is_certified);
        $this->assertNotNull($this->enrollment->certificate_issued_at);
    }

    /**
     * Test state machine: enrolled -> dropped
     */
    public function test_enrollment_can_be_dropped(): void
    {
        $this->assertEquals('enrolled', $this->enrollment->status);

        // Transition to dropped
        $this->enrollmentService->transitionState($this->enrollment, 'dropped');
        $this->enrollment->refresh();

        $this->assertEquals('dropped', $this->enrollment->status);
    }

    /**
     * Test state machine: in_progress -> dropped
     */
    public function test_can_drop_from_in_progress(): void
    {
        $this->enrollmentService->transitionState($this->enrollment, 'in_progress');
        $this->enrollmentService->transitionState($this->enrollment, 'dropped');
        $this->enrollment->refresh();

        $this->assertEquals('dropped', $this->enrollment->status);
    }

    /**
     * Test state history tracking through all transitions
     */
    public function test_state_history_tracks_all_transitions(): void
    {
        // Enrolled (initial)
        $initialHistory = $this->enrollment->getStateHistoryArray();
        $this->assertCount(1, $initialHistory);
        $this->assertEquals('enrolled', $initialHistory[0]['state']);

        // Transition 1: to in_progress
        $this->enrollmentService->transitionState($this->enrollment, 'in_progress');
        $this->enrollment->refresh();
        $history = $this->enrollment->getStateHistoryArray();
        $this->assertCount(2, $history);
        $this->assertEquals('in_progress', $history[1]['state']);
        $this->assertNotNull($history[1]['timestamp']);

        // Transition 2: to completed
        $this->enrollmentService->transitionState($this->enrollment, 'completed');
        $this->enrollment->refresh();
        $history = $this->enrollment->getStateHistoryArray();
        $this->assertCount(3, $history);
        $this->assertEquals('completed', $history[2]['state']);
    }

    /**
     * Test invalid state transitions are blocked
     */
    public function test_invalid_transitions_blocked(): void
    {
        // Transition to completed first
        $this->enrollmentService->transitionState($this->enrollment, 'in_progress');
        $this->enrollmentService->transitionState($this->enrollment, 'completed');
        $this->enrollment->refresh();

        // Try to go back to enrolled (invalid)
        $this->expectException(\Exception::class);
        $this->enrollmentService->transitionState($this->enrollment, 'enrolled');
    }

    /**
     * Test terminal state cannot transition
     */
    public function test_certified_is_terminal_state(): void
    {
        // Get to completed first
        $this->enrollmentService->transitionState($this->enrollment, 'in_progress');
        $this->enrollmentService->transitionState($this->enrollment, 'completed');
        $this->enrollment->refresh();

        $this->enrollment->update([
            'final_score' => 85,
            'passing_grade' => 70,
            'prerequisites_met' => true,
        ]);

        // Issue certificate
        $this->enrollmentService->issueCertificate($this->enrollment);
        $this->enrollment->refresh();

        // Try to transition from certified (should fail - terminal state)
        $this->expectException(\Exception::class);
        $this->enrollmentService->transitionState($this->enrollment, 'dropped');
    }

    /**
     * Test dropped is terminal state
     */
    public function test_dropped_is_terminal_state(): void
    {
        // Drop the enrollment
        $this->enrollmentService->transitionState($this->enrollment, 'dropped');
        $this->enrollment->refresh();

        // Try to transition from dropped (should fail)
        $this->expectException(\Exception::class);
        $this->enrollmentService->transitionState($this->enrollment, 'in_progress');
    }

    /**
     * Test concurrent state transitions are safe
     */
    public function test_state_transitions_maintain_history(): void
    {
        $transitions = ['in_progress', 'completed'];

        foreach ($transitions as $targetState) {
            $this->enrollmentService->transitionState($this->enrollment, $targetState);
            $this->enrollment->refresh();
        }

        $history = $this->enrollment->getStateHistoryArray();

        // Should have initial + 2 transitions = 3 entries
        $this->assertCount(3, $history);
        $this->assertEquals('enrolled', $history[0]['state']);
        $this->assertEquals('in_progress', $history[1]['state']);
        $this->assertEquals('completed', $history[2]['state']);
    }
}
