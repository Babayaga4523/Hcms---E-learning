<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Module;
use App\Models\UserTraining;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EnrollmentControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Module $module;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->module = Module::factory()->create();
    }

    /**
     * Test POST /api/enrollments - enroll user
     */
    public function test_can_enroll_user_in_module(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/enrollments', [
                'user_id' => $this->user->id,
                'module_id' => $this->module->id,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'user_id',
                    'module_id',
                    'status',
                ]
            ]);

        $this->assertDatabaseHas('user_trainings', [
            'user_id' => $this->user->id,
            'module_id' => $this->module->id,
        ]);
    }

    /**
     * Test POST /api/enrollments - validation fails for duplicate
     */
    public function test_cannot_enroll_twice(): void
    {
        UserTraining::factory()->create([
            'user_id' => $this->user->id,
            'module_id' => $this->module->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/enrollments', [
                'user_id' => $this->user->id,
                'module_id' => $this->module->id,
            ]);

        $response->assertStatus(400)
            ->assertJsonStructure(['message', 'error']);
    }

    /**
     * Test POST /api/enrollments/{id}/transition-state
     */
    public function test_can_transition_enrollment_state(): void
    {
        $enrollment = UserTraining::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'enrolled',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/enrollments/{$enrollment->id}/transition-state", [
                'status' => 'in_progress',
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'data']);

        $this->assertDatabaseHas('user_trainings', [
            'id' => $enrollment->id,
            'status' => 'in_progress',
        ]);
    }

    /**
     * Test POST /api/enrollments/{id}/transition-state - invalid transition
     */
    public function test_cannot_transition_to_invalid_state(): void
    {
        $enrollment = UserTraining::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'certified',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/enrollments/{$enrollment->id}/transition-state", [
                'status' => 'enrolled',
            ]);

        $response->assertStatus(400);
    }

    /**
     * Test POST /api/enrollments/{id}/issue-certificate
     */
    public function test_can_issue_certificate(): void
    {
        $module = Module::factory()->create(['passing_grade' => 70]);
        $enrollment = UserTraining::factory()->create([
            'module_id' => $module->id,
            'status' => 'completed',
            'final_score' => 85,
            'passing_grade' => 70,
            'prerequisites_met' => true,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/enrollments/{$enrollment->id}/issue-certificate");

        $response->assertStatus(200);

        $this->assertDatabaseHas('user_trainings', [
            'id' => $enrollment->id,
            'is_certified' => true,
        ]);
    }

    /**
     * Test POST /api/enrollments/{id}/issue-certificate - invalid conditions
     */
    public function test_cannot_issue_certificate_with_low_score(): void
    {
        $enrollment = UserTraining::factory()->create([
            'status' => 'completed',
            'final_score' => 50,
            'passing_grade' => 70,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/enrollments/{$enrollment->id}/issue-certificate");

        $response->assertStatus(400);
    }

    /**
     * Test GET /api/enrollments/{id}
     */
    public function test_can_view_enrollment_details(): void
    {
        $enrollment = UserTraining::factory()->create();

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/enrollments/{$enrollment->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'user_id',
                    'module_id',
                    'status',
                ]
            ]);
    }

    /**
     * Test GET /api/enrollments/user/{userId}
     */
    public function test_can_get_user_enrollments(): void
    {
        UserTraining::factory()->count(3)->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/enrollments/user/{$this->user->id}");

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    /**
     * Test GET /api/enrollments/module/{moduleId}
     */
    public function test_can_get_module_enrollments(): void
    {
        UserTraining::factory()->count(2)->create(['module_id' => $this->module->id]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/enrollments/module/{$this->module->id}");

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }
}
