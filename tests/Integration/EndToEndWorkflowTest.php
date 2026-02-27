<?php

namespace Tests\Integration;

use App\Models\User;
use App\Models\Module;
use App\Models\UserTraining;
use App\Services\EnrollmentService;
use App\Services\ComplianceService;
use App\Services\RolePermissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * End-to-End Integration Tests
 * Tests complete workflows across multiple services
 */
class EndToEndWorkflowTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test complete user onboarding and compliance workflow
     */
    public function test_complete_onboarding_and_compliance_workflow(): void
    {
        // Setup
        $enrollmentService = app(EnrollmentService::class);
        $complianceService = app(ComplianceService::class);
        $user = User::factory()->create();
        $module = Module::factory()->create([
            'compliance_required' => true,
            'passing_grade' => 70,
            'end_date' => now()->addDays(30),
        ]);

        // Phase 1: Enrollment
        $enrollment = $enrollmentService->enroll($user, $module);
        $this->assertNotNull($enrollment->id);
        $this->assertEquals('enrolled', $enrollment->status);

        // Phase 2: Progress through module
        $enrollmentService->transitionState($enrollment, 'in_progress');
        $enrollment->refresh();
        $this->assertEquals('in_progress', $enrollment->status);

        // Phase 3: Complete module with good score
        $enrollmentService->transitionState($enrollment, 'completed');
        $enrollment->update([
            'final_score' => 85,
            'passing_grade' => 70,
            'prerequisites_met' => true,
        ]);

        // Phase 4: Issue certificate
        $enrollmentService->issueCertificate($enrollment);
        $enrollment->refresh();
        $this->assertTrue($enrollment->is_certified);

        // Phase 5: Check compliance - should be compliant
        $complianceService->checkAndEscalateCompliance($enrollment);
        $enrollment->refresh();
        $this->assertEquals('compliant', $enrollment->compliance_status);
    }

    /**
     * Test compliance escalation to resolution workflow
     */
    public function test_compliance_escalation_and_resolution_workflow(): void
    {
        // Setup
        $complianceService = app(ComplianceService::class);
        $manager = User::factory()->create();
        $user = User::factory()->create(['manager_id' => $manager->id]);
        $module = Module::factory()->create([
            'compliance_required' => true,
            'end_date' => now()->subDay(), // Already overdue
        ]);

        $enrollment = UserTraining::factory()->create([
            'user_id' => $user->id,
            'module_id' => $module->id,
            'status' => 'enrolled',
            'compliance_status' => 'compliant',
            'escalation_level' => 0,
        ]);

        // Phase 1: Check compliance - detect non-compliance
        $complianceService->checkAndEscalateCompliance($enrollment);
        $enrollment->refresh();

        $this->assertEquals('non_compliant', $enrollment->compliance_status);
        $this->assertGreaterThan(0, $enrollment->escalation_level);

        // Phase 2: Escalate further
        $complianceService->escalateNonCompliance($enrollment, 'Further escalation');
        $enrollment->refresh();

        $previousLevel = $enrollment->escalation_level;

        // Phase 3: Resolve non-compliance
        $complianceService->resolveNonCompliance($enrollment, 'User completed makeup work');
        $enrollment->refresh();

        $this->assertEquals('compliant', $enrollment->compliance_status);
        $this->assertEquals(0, $enrollment->escalation_level);

        // Verify audit trail exists
        $logs = $enrollment->complianceAuditLogs()->get();
        $this->assertGreaterThan(0, $logs->count());
    }

    /**
     * Test bulk user enrollment in module
     */
    public function test_bulk_enrollment_workflow(): void
    {
        $enrollmentService = app(EnrollmentService::class);
        $module = Module::factory()->create();
        $users = User::factory()->count(5)->create();

        // Enroll all users
        foreach ($users as $user) {
            $enrollment = $enrollmentService->enroll($user, $module);
            $this->assertNotNull($enrollment->id);
        }

        // Verify all enrollments exist
        $this->assertEquals(5, $module->enrollments()->count());
    }

    /**
     * Test role assignment with permission propagation workflow
     */
    public function test_role_assignment_and_permission_workflow(): void
    {
        $rolePermissionService = app(RolePermissionService::class);

        // Create resources
        $role = \App\Models\Role::factory()->create(['is_active' => true]);
        $permission = \App\Models\Permission::factory()->create();
        $users = User::factory()->count(3)->create();

        // Phase 1: Add permission to role
        $rolePermissionService->addPermissionToRole($role, $permission);

        // Phase 2: Assign role to users
        foreach ($users as $user) {
            $rolePermissionService->assignRole($user, $role);
        }

        // Phase 3: Sync permissions
        foreach ($users as $user) {
            $rolePermissionService->syncUserPermissions($user);
            $user->refresh();

            // Verify permission propagated
            $this->assertTrue($user->permissions()->where('permission_id', $permission->id)->exists());
        }

        // Phase 4: Remove permission
        $rolePermissionService->removePermissionFromRole($role, $permission);

        // Phase 5: Verify removal propagates
        foreach ($users as $user) {
            $user->refresh();
            $this->assertFalse($user->permissions()->where('permission_id', $permission->id)->exists());
        }
    }

    /**
     * Test department hierarchy and reporting structure
     */
    public function test_department_hierarchy_workflow(): void
    {
        $departmentService = app(\App\Services\DepartmentHierarchyService::class);

        // Create hierarchy
        $executive = \App\Models\Department::factory()->create([
            'parent_id' => null,
            'level' => 0,
            'name' => 'Executive',
        ]);

        $division = \App\Models\Department::factory()->create([
            'parent_id' => $executive->id,
            'level' => 1,
            'name' => 'Division',
        ]);

        $department = \App\Models\Department::factory()->create([
            'parent_id' => $division->id,
            'level' => 2,
            'name' => 'Department',
        ]);

        // Test tree building
        $tree = $departmentService->buildTree();
        $this->assertNotEmpty($tree);

        // Test path navigation
        $path = $departmentService->getHierarchyPath($department->id);
        $this->assertCount(3, $path);
        $this->assertEquals($department->id, $path[0]->id);
        $this->assertEquals($division->id, $path[1]->id);
        $this->assertEquals($executive->id, $path[2]->id);

        // Test ancestor retrieval
        $ancestors = $departmentService->getAncestors($department);
        $this->assertCount(2, $ancestors);

        // Test descendant retrieval
        $descendants = $departmentService->getDescendants($executive);
        $this->assertCount(2, $descendants);
    }
}
