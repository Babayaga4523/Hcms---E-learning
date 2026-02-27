<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Module;
use App\Models\UserTraining;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComplianceControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Module $module;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->module = Module::factory()->create(['compliance_required' => true]);
    }

    /**
     * Test GET /api/compliance/dashboard
     */
    public function test_can_get_compliance_dashboard(): void
    {
        UserTraining::factory()->count(3)->create(['compliance_status' => 'compliant']);
        UserTraining::factory()->count(2)->create(['compliance_status' => 'non_compliant']);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/compliance/dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'total_enrollments',
                    'compliant_count',
                    'non_compliant_count',
                    'escalated_count',
                    'escalation_breakdown',
                ]
            ]);
    }

    /**
     * Test GET /api/compliance/module/{id}/non-compliant
     */
    public function test_can_get_non_compliant_users(): void
    {
        UserTraining::factory()->count(3)->create([
            'module_id' => $this->module->id,
            'compliance_status' => 'non_compliant',
        ]);

        UserTraining::factory()->count(2)->create([
            'module_id' => $this->module->id,
            'compliance_status' => 'compliant',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/compliance/module/{$this->module->id}/non-compliant");

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    /**
     * Test GET /api/compliance/module/{id}/at-risk
     */
    public function test_can_get_at_risk_users(): void
    {
        $module = Module::factory()->create([
            'compliance_required' => true,
            'end_date' => now()->addDays(5),
        ]);

        UserTraining::factory()->count(2)->create([
            'module_id' => $module->id,
            'status' => 'enrolled',
            'compliance_status' => 'non_compliant',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/compliance/module/{$module->id}/at-risk?days_before_deadline=7");

        $response->assertStatus(200);
    }

    /**
     * Test POST /api/compliance/check/{id}
     */
    public function test_can_check_compliance(): void
    {
        $enrollment = UserTraining::factory()->create([
            'module_id' => $this->module->id,
            'status' => 'completed',
            'is_certified' => true,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/compliance/check/{$enrollment->id}");

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'data']);
    }

    /**
     * Test POST /api/compliance/check-all
     */
    public function test_can_check_all_compliance(): void
    {
        UserTraining::factory()->count(5)->create([
            'module_id' => $this->module->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/compliance/check-all');

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'summary']);
    }

    /**
     * Test POST /api/compliance/{id}/resolve
     */
    public function test_can_resolve_non_compliance(): void
    {
        $enrollment = UserTraining::factory()->create([
            'compliance_status' => 'non_compliant',
            'escalation_level' => 1,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/compliance/{$enrollment->id}/resolve", [
                'reason' => 'User completed makeup exam',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('user_trainings', [
            'id' => $enrollment->id,
            'compliance_status' => 'compliant',
        ]);
    }

    /**
     * Test GET /api/compliance/{id}/audit-logs
     */
    public function test_can_get_compliance_audit_logs(): void
    {
        $enrollment = UserTraining::factory()->create();
        $enrollment->complianceAuditLogs()->create([
            'action' => 'escalation',
            'old_value' => 'none',
            'new_value' => 'manager',
            'triggered_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/compliance/{$enrollment->id}/audit-logs");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    /**
     * Test compliance escalation flow
     */
    public function test_compliance_escalation_flow(): void
    {
        $module = Module::factory()->create([
            'compliance_required' => true,
            'end_date' => now()->subDay(),
        ]);

        $enrollment = UserTraining::factory()->create([
            'module_id' => $module->id,
            'status' => 'enrolled',
            'compliance_status' => 'compliant',
        ]);

        // Check compliance - should escalate
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/compliance/check/{$enrollment->id}");

        $enrollment->refresh();

        $this->assertEquals('non_compliant', $enrollment->compliance_status);
        $this->assertGreaterThan(0, $enrollment->escalation_level);
    }
}
