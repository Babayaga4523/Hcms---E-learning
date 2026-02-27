<?php

namespace Tests\Unit\Services;

use App\Models\UserTraining;
use App\Models\Module;
use App\Models\User;
use App\Services\ComplianceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComplianceServiceTest extends TestCase
{
    use RefreshDatabase;

    protected ComplianceService $complianceService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->complianceService = app(ComplianceService::class);
    }

    /**
     * Test compliance check marks compliant enrollment
     */
    public function test_marks_compliant_enrollment_as_compliant(): void
    {
        $module = Module::factory()->create(['compliance_required' => true]);
        $enrollment = UserTraining::factory()->create([
            'module_id' => $module->id,
            'status' => 'completed',
            'is_certified' => true,
            'final_score' => 85,
        ]);

        $this->complianceService->checkAndEscalateCompliance($enrollment);
        $enrollment->refresh();

        $this->assertEquals('compliant', $enrollment->compliance_status);
        $this->assertEquals(0, $enrollment->escalation_level);
    }

    /**
     * Test compliance check detects overdue non-compliance
     */
    public function test_detects_overdue_non_compliance(): void
    {
        $module = Module::factory()->create([
            'compliance_required' => true,
            'end_date' => now()->subDay(),
        ]);
        $enrollment = UserTraining::factory()->create([
            'module_id' => $module->id,
            'status' => 'enrolled',
            'is_certified' => false,
        ]);

        $this->complianceService->checkAndEscalateCompliance($enrollment);
        $enrollment->refresh();

        $this->assertEquals('non_compliant', $enrollment->compliance_status);
        $this->assertGreaterThan(0, $enrollment->escalation_level);
    }

    /**
     * Test compliance check detects low score non-compliance
     */
    public function test_detects_low_score_non_compliance(): void
    {
        $module = Module::factory()->create(['compliance_required' => true]);
        $enrollment = UserTraining::factory()->create([
            'module_id' => $module->id,
            'status' => 'completed',
            'final_score' => 50,
            'passing_grade' => 70,
        ]);

        $this->complianceService->checkAndEscalateCompliance($enrollment);
        $enrollment->refresh();

        $this->assertEquals('non_compliant', $enrollment->compliance_status);
    }

    /**
     * Test escalation increments level
     */
    public function test_escalation_increments_level(): void
    {
        $enrollment = UserTraining::factory()->create(['escalation_level' => 0]);

        $this->complianceService->escalateNonCompliance($enrollment, 'Test reason');
        $enrollment->refresh();

        $this->assertEquals(1, $enrollment->escalation_level);
    }

    /**
     * Test escalation reaches maximum level
     */
    public function test_escalation_reaches_maximum_level(): void
    {
        $enrollment = UserTraining::factory()->create(['escalation_level' => 2]);

        $this->complianceService->escalateNonCompliance($enrollment, 'Test reason');
        $enrollment->refresh();

        $this->assertEquals(3, $enrollment->escalation_level);

        // Try to escalate further - should stay at 3
        $this->complianceService->escalateNonCompliance($enrollment, 'Another reason');
        $enrollment->refresh();

        $this->assertEquals(3, $enrollment->escalation_level);
    }

    /**
     * Test escalation creates audit log
     */
    public function test_escalation_creates_audit_log(): void
    {
        $enrollment = UserTraining::factory()->create(['escalation_level' => 0]);

        $this->complianceService->escalateNonCompliance($enrollment, 'Test escalation');

        $logs = $enrollment->complianceAuditLogs()
            ->where('action', 'escalation')
            ->get();

        $this->assertCount(1, $logs);
        $this->assertEquals('none', $logs->first()->old_value);
        $this->assertEquals('manager', $logs->first()->new_value);
    }

    /**
     * Test get non-compliant users
     */
    public function test_get_non_compliant_users(): void
    {
        $module = Module::factory()->create();

        UserTraining::factory()->count(3)->create([
            'module_id' => $module->id,
            'compliance_status' => 'non_compliant',
        ]);

        UserTraining::factory()->count(2)->create([
            'module_id' => $module->id,
            'compliance_status' => 'compliant',
        ]);

        $nonCompliant = $this->complianceService->getNonCompliantUsers($module);

        $this->assertCount(3, $nonCompliant);
    }

    /**
     * Test get at-risk users
     */
    public function test_get_at_risk_users(): void
    {
        $module = Module::factory()->create([
            'end_date' => now()->addDays(5),
        ]);

        UserTraining::factory()->create([
            'module_id' => $module->id,
            'status' => 'enrolled',
            'compliance_status' => 'non_compliant',
        ]);

        UserTraining::factory()->create([
            'module_id' => $module->id,
            'status' => 'completed',
            'compliance_status' => 'compliant',
        ]);

        $atRisk = $this->complianceService->getAtRiskUsers($module, 7);

        $this->assertCount(1, $atRisk);
    }

    /**
     * Test resolve non-compliance
     */
    public function test_resolve_non_compliance(): void
    {
        $enrollment = UserTraining::factory()->create([
            'compliance_status' => 'non_compliant',
            'escalation_level' => 2,
        ]);

        $this->complianceService->resolveNonCompliance($enrollment, 'User completed makeup exam');
        $enrollment->refresh();

        $this->assertEquals('compliant', $enrollment->compliance_status);
        $this->assertEquals(0, $enrollment->escalation_level);
        $this->assertNull($enrollment->escalated_at);
    }

    /**
     * Test resolve creates audit log
     */
    public function test_resolve_creates_audit_log(): void
    {
        $enrollment = UserTraining::factory()->create([
            'compliance_status' => 'non_compliant',
            'escalation_level' => 1,
        ]);

        $this->complianceService->resolveNonCompliance($enrollment, 'Resolution reason');

        $logs = $enrollment->complianceAuditLogs()
            ->where('action', 'resolution')
            ->get();

        $this->assertCount(1, $logs);
        $this->assertEquals('compliant', $logs->first()->new_value);
    }

    /**
     * Test compliance summary
     */
    public function test_get_compliance_summary(): void
    {
        UserTraining::factory()->count(5)->create(['compliance_status' => 'compliant']);
        UserTraining::factory()->count(3)->create(['compliance_status' => 'non_compliant']);
        UserTraining::factory()->count(2)->create(['compliance_status' => 'escalated']);

        $summary = $this->complianceService->getComplianceSummary();

        $this->assertEquals(10, $summary['total_enrollments']);
        $this->assertEquals(5, $summary['compliant_count']);
        $this->assertEquals(3, $summary['non_compliant_count']);
        $this->assertEquals(2, $summary['escalated_count']);
    }
}
