<?php

namespace Tests\Unit\Services;

use App\Models\UserTraining;
use App\Models\Module;
use App\Models\User;
use App\Services\EnrollmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Exception;

class EnrollmentServiceTest extends TestCase
{
    use RefreshDatabase;

    protected EnrollmentService $enrollmentService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->enrollmentService = app(EnrollmentService::class);
    }

    /**
     * Test successful enrollment
     */
    public function test_can_enroll_user_in_module(): void
    {
        $user = User::factory()->create();
        $module = Module::factory()->create();

        $enrollment = $this->enrollmentService->enroll($user, $module);

        $this->assertInstanceOf(UserTraining::class, $enrollment);
        $this->assertEquals($user->id, $enrollment->user_id);
        $this->assertEquals($module->id, $enrollment->module_id);
        $this->assertEquals('enrolled', $enrollment->status);
    }

    /**
     * Test duplicate enrollment prevention
     */
    public function test_cannot_enroll_twice_in_same_module(): void
    {
        $user = User::factory()->create();
        $module = Module::factory()->create();

        // First enrollment should succeed
        $this->enrollmentService->enroll($user, $module);

        // Second enrollment should fail
        $this->expectException(Exception::class);
        $this->enrollmentService->enroll($user, $module);
    }

    /**
     * Test prerequisite validation
     */
    public function test_cannot_enroll_without_prerequisites(): void
    {
        $user = User::factory()->create();
        $prerequisiteModule = Module::factory()->create();
        $module = Module::factory()->create(['prerequisite_module_id' => $prerequisiteModule->id]);

        // Should fail - prerequisites not met
        $this->expectException(Exception::class);
        $this->enrollmentService->enroll($user, $module);
    }

    /**
     * Test successful enrollment with prerequisites met
     */
    public function test_can_enroll_with_prerequisites_met(): void
    {
        $user = User::factory()->create();
        $prerequisiteModule = Module::factory()->create();
        $module = Module::factory()->create(['prerequisite_module_id' => $prerequisiteModule->id]);

        // Complete prerequisite
        UserTraining::factory()->create([
            'user_id' => $user->id,
            'module_id' => $prerequisiteModule->id,
            'status' => 'completed',
        ]);

        // Should succeed
        $enrollment = $this->enrollmentService->enroll($user, $module);
        $this->assertInstanceOf(UserTraining::class, $enrollment);
    }

    /**
     * Test valid state transitions
     */
    public function test_valid_state_transitions(): void
    {
        $enrollment = UserTraining::factory()->create(['status' => 'enrolled']);

        // enrolled -> in_progress
        $this->enrollmentService->transitionState($enrollment, 'in_progress');
        $this->assertEquals('in_progress', $enrollment->fresh()->status);

        // in_progress -> completed
        $this->enrollmentService->transitionState($enrollment, 'completed');
        $this->assertEquals('completed', $enrollment->fresh()->status);

        // completed -> certified
        $this->enrollmentService->transitionState($enrollment, 'certified');
        $this->assertEquals('certified', $enrollment->fresh()->status);
    }

    /**
     * Test invalid state transition
     */
    public function test_invalid_state_transition_throws_exception(): void
    {
        $enrollment = UserTraining::factory()->create(['status' => 'certified']);

        // certified is terminal state
        $this->expectException(Exception::class);
        $this->enrollmentService->transitionState($enrollment, 'enrolled');
    }

    /**
     * Test state history tracking
     */
    public function test_state_history_is_tracked(): void
    {
        $enrollment = UserTraining::factory()->create(['status' => 'enrolled']);

        $this->enrollmentService->transitionState($enrollment, 'in_progress');
        $enrollment->refresh();

        $history = $enrollment->getStateHistoryArray();
        $this->assertCount(2, $history); // enrolled + in_progress
        $this->assertEquals('in_progress', $history[1]['state']);
    }

    /**
     * Test certificate issuance with valid conditions
     */
    public function test_can_issue_certificate_with_valid_conditions(): void
    {
        $module = Module::factory()->create(['passing_grade' => 70]);
        $enrollment = UserTraining::factory()->create([
            'module_id' => $module->id,
            'status' => 'completed',
            'final_score' => 85,
            'passing_grade' => 70,
            'prerequisites_met' => true,
            'is_certified' => false,
        ]);

        $this->enrollmentService->issueCertificate($enrollment);
        $enrollment->refresh();

        $this->assertTrue($enrollment->is_certified);
        $this->assertNotNull($enrollment->certificate_issued_at);
    }

    /**
     * Test certificate issuance fails without passing score
     */
    public function test_cannot_issue_certificate_below_passing_score(): void
    {
        $enrollment = UserTraining::factory()->create([
            'status' => 'completed',
            'final_score' => 50,
            'passing_grade' => 70,
            'prerequisites_met' => true,
        ]);

        $this->expectException(Exception::class);
        $this->enrollmentService->issueCertificate($enrollment);
    }

    /**
     * Test certificate issuance fails without completed status
     */
    public function test_cannot_issue_certificate_without_completed_status(): void
    {
        $enrollment = UserTraining::factory()->create([
            'status' => 'in_progress',
            'final_score' => 85,
            'passing_grade' => 70,
        ]);

        $this->expectException(Exception::class);
        $this->enrollmentService->issueCertificate($enrollment);
    }

    /**
     * Test prerequisite checking
     */
    public function test_check_prerequisites_returns_correct_status(): void
    {
        $user = User::factory()->create();
        $prerequisiteModule = Module::factory()->create();
        $module = Module::factory()->create(['prerequisite_module_id' => $prerequisiteModule->id]);

        $result = $this->enrollmentService->checkPrerequisites($user, $module);

        $this->assertFalse($result['met']);
        $this->assertNotEmpty($result['missing']);

        // Complete prerequisite
        UserTraining::factory()->create([
            'user_id' => $user->id,
            'module_id' => $prerequisiteModule->id,
            'status' => 'completed',
        ]);

        $result = $this->enrollmentService->checkPrerequisites($user, $module);
        $this->assertTrue($result['met']);
        $this->assertEmpty($result['missing']);
    }
}
