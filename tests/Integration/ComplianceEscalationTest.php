<?php

namespace Tests\Integration;

use App\Models\UserTraining;
use App\Models\Module;
use App\Models\User;
use App\Models\Notification;
use App\Services\ComplianceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComplianceEscalationTest extends TestCase
{
    use RefreshDatabase;

    protected ComplianceService $complianceService;
    protected User $user;
    protected Module $module;
    protected UserTraining $enrollment;

    protected function setUp(): void
    {
        parent::setUp();
        $this->complianceService = app(ComplianceService::class);
        $this->user = User::factory()->create();
        $this->module = Module::factory()->create(['compliance_required' => true]);
        $this->enrollment = UserTraining::factory()->create([
            'user_id' => $this->user->id,
            'module_id' => $this->module->id,
            'compliance_status' => 'compliant',
            'escalation_level' => 0,
        ]);
    }

    /**
     * Test escalation level 0 to 1 (manager notification)
     */
    public function test_escalation_to_level_1_creates_manager_notification(): void
    {
        // Create a manager for the user
        $manager = User::factory()->create();
        $this->user->update(['manager_id' => $manager->id]);

        $this->complianceService->escalateNonCompliance($this->enrollment, 'Overdue completion');
        $this->enrollment->refresh();

        $this->assertEquals(1, $this->enrollment->escalation_level);
        $this->assertEquals('non_compliant', $this->enrollment->compliance_status);

        // Check that notification was created for manager
        $notification = Notification::where('user_id', $manager->id)->first();
        $this->assertNotNull($notification);
        $this->assertStringContainsString('Compliance Alert', $notification->title);
    }

    /**
     * Test escalation level 1 to 2 (department head notification)
     */
    public function test_escalation_to_level_2_creates_dept_head_notification(): void
    {
        // Setup: create department and department head
        $dept = \App\Models\Department::factory()->create();
        $deptHead = User::factory()->create([
            'department_id' => $dept->id,
            'is_department_head' => true,
        ]);
        $this->user->update(['department_id' => $dept->id]);

        // Set to level 1
        $this->enrollment->update(['escalation_level' => 1]);

        // Escalate to level 2
        $this->complianceService->escalateNonCompliance($this->enrollment, 'Level 2 escalation');
        $this->enrollment->refresh();

        $this->assertEquals(2, $this->enrollment->escalation_level);

        // Check notification for department head
        $notification = Notification::where('user_id', $deptHead->id)->first();
        $this->assertNotNull($notification);
    }

    /**
     * Test escalation level 2 to 3 (executive notification)
     */
    public function test_escalation_to_level_3_creates_executive_notification(): void
    {
        // Create executives
        $executiveRole = \App\Models\Role::factory()->create(['name' => 'executive']);
        $executive = User::factory()->create();
        $executive->roles()->attach($executiveRole->id);

        // Set to level 2
        $this->enrollment->update(['escalation_level' => 2]);

        // Escalate to level 3
        $this->complianceService->escalateNonCompliance($this->enrollment, 'Level 3 escalation');
        $this->enrollment->refresh();

        $this->assertEquals(3, $this->enrollment->escalation_level);

        // Check notification for executive
        $notification = Notification::where('user_id', $executive->id)->first();
        $this->assertNotNull($notification);
        $this->assertStringContainsString('URGENT', $notification->title);
    }

    /**
     * Test escalation max level (level 3 is ceiling)
     */
    public function test_escalation_cannot_exceed_level_3(): void
    {
        // Create executive
        $executiveRole = \App\Models\Role::factory()->create(['name' => 'executive']);
        $executive = User::factory()->create();
        $executive->roles()->attach($executiveRole->id);

        // Set to level 3
        $this->enrollment->update(['escalation_level' => 3]);

        // Try to escalate further
        $this->complianceService->escalateNonCompliance($this->enrollment, 'Another escalation');
        $this->enrollment->refresh();

        // Should still be level 3
        $this->assertEquals(3, $this->enrollment->escalation_level);
    }

    /**
     * Test full escalation workflow: check -> escalate -> resolve
     */
    public function test_full_escalation_workflow(): void
    {
        $manager = User::factory()->create();
        $this->user->update(['manager_id' => $manager->id]);

        // Mark as overdue
        $this->module->update(['end_date' => now()->subDay()]);
        $this->enrollment->update(['status' => 'enrolled']);

        // Check compliance - should detect non-compliance
        $this->complianceService->checkAndEscalateCompliance($this->enrollment);
        $this->enrollment->refresh();

        $this->assertEquals('non_compliant', $this->enrollment->compliance_status);
        $this->assertGreaterThan(0, $this->enrollment->escalation_level);

        // Resolve the non-compliance
        $this->complianceService->resolveNonCompliance($this->enrollment, 'User completed makeup work');
        $this->enrollment->refresh();

        $this->assertEquals('compliant', $this->enrollment->compliance_status);
        $this->assertEquals(0, $this->enrollment->escalation_level);
        $this->assertNull($this->enrollment->escalated_at);
    }

    /**
     * Test escalation audit trail
     */
    public function test_escalation_creates_comprehensive_audit_trail(): void
    {
        // Escalate multiple times
        $this->complianceService->escalateNonCompliance($this->enrollment, 'First escalation');
        $this->enrollment->refresh();
        $level1 = $this->enrollment->escalation_level;

        $this->complianceService->escalateNonCompliance($this->enrollment, 'Second escalation');
        $this->enrollment->refresh();
        $level2 = $this->enrollment->escalation_level;

        // Check audit logs exist
        $logs = $this->enrollment->complianceAuditLogs()->get();
        $this->assertGreaterThan(0, $logs->count());

        // Check escalation logs
        $escalationLogs = $logs->where('action', 'escalation');
        $this->assertGreaterThan(0, $escalationLogs->count());

        // Verify log details
        $firstLog = $escalationLogs->first();
        $this->assertNotNull($firstLog->old_value);
        $this->assertNotNull($firstLog->new_value);
        $this->assertNotNull($firstLog->reason);
    }

    /**
     * Test multiple users with same issue escalate independently
     */
    public function test_multiple_users_escalate_independently(): void
    {
        $user2 = User::factory()->create();
        $enrollment2 = UserTraining::factory()->create([
            'user_id' => $user2->id,
            'module_id' => $this->module->id,
            'compliance_status' => 'compliant',
            'escalation_level' => 0,
        ]);

        // Escalate first user once
        $this->complianceService->escalateNonCompliance($this->enrollment, 'First user escalation');

        // Escalate second user twice
        $this->complianceService->escalateNonCompliance($enrollment2, 'Second user escalation 1');
        $this->complianceService->escalateNonCompliance($enrollment2, 'Second user escalation 2');

        $this->enrollment->refresh();
        $enrollment2->refresh();

        $this->assertEquals(1, $this->enrollment->escalation_level);
        $this->assertEquals(2, $enrollment2->escalation_level);
    }

    /**
     * Test resolution clears all escalation
     */
    public function test_resolution_completely_clears_escalation(): void
    {
        // Escalate to level 3
        $this->enrollment->update(['escalation_level' => 3, 'escalated_at' => now()]);

        // Resolve
        $this->complianceService->resolveNonCompliance($this->enrollment, 'Resolved after supervisory intervention');
        $this->enrollment->refresh();

        // Should be back to level 0
        $this->assertEquals(0, $this->enrollment->escalation_level);
        $this->assertNull($this->enrollment->escalated_at);
        $this->assertEquals('compliant', $this->enrollment->compliance_status);

        // Check resolution log
        $resolutionLog = $this->enrollment->complianceAuditLogs()
            ->where('action', 'resolution')
            ->first();
        $this->assertNotNull($resolutionLog);
    }
}
