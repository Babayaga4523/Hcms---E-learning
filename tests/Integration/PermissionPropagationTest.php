<?php

namespace Tests\Integration;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\Department;
use App\Services\RolePermissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PermissionPropagationTest extends TestCase
{
    use RefreshDatabase;

    protected RolePermissionService $rolePermissionService;
    protected Role $role;
    protected Permission $permission1;
    protected Permission $permission2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->rolePermissionService = app(RolePermissionService::class);
        $this->role = Role::factory()->create(['is_active' => true]);
        $this->permission1 = Permission::factory()->create();
        $this->permission2 = Permission::factory()->create();
    }

    /**
     * Test permission added to role propagates to all users with that role
     */
    public function test_permission_added_propagates_to_all_users_with_role(): void
    {
        $users = User::factory()->count(3)->create();

        // Assign role to all users
        foreach ($users as $user) {
            $this->rolePermissionService->assignRole($user, $this->role);
        }

        // Add permission to role
        $this->rolePermissionService->addPermissionToRole($this->role, $this->permission1);

        // Sync permissions for each user
        foreach ($users as $user) {
            $this->rolePermissionService->syncUserPermissions($user);
            $user->refresh();

            // Verify user has the permission
            $this->assertTrue(
                $user->permissions()->where('permission_id', $this->permission1->id)->exists(),
                "User {$user->id} should have permission {$this->permission1->id}"
            );
        }
    }

    /**
     * Test multiple permissions propagate together
     */
    public function test_multiple_permissions_propagate_together(): void
    {
        $user = User::factory()->create();
        $this->rolePermissionService->assignRole($user, $this->role);

        // Add multiple permissions
        $this->rolePermissionService->addPermissionToRole($this->role, $this->permission1);
        $this->rolePermissionService->addPermissionToRole($this->role, $this->permission2);

        // Sync
        $this->rolePermissionService->syncUserPermissions($user);
        $user->refresh();

        // Both permissions should be present
        $this->assertTrue($user->permissions()->where('permission_id', $this->permission1->id)->exists());
        $this->assertTrue($user->permissions()->where('permission_id', $this->permission2->id)->exists());
    }

    /**
     * Test permission removed from role propagates to all users
     */
    public function test_permission_removed_propagates_to_all_users(): void
    {
        $users = User::factory()->count(2)->create();

        // Setup: assign role and add permission
        foreach ($users as $user) {
            $this->rolePermissionService->assignRole($user, $this->role);
        }
        $this->rolePermissionService->addPermissionToRole($this->role, $this->permission1);

        // Sync initial permissions
        foreach ($users as $user) {
            $this->rolePermissionService->syncUserPermissions($user);
        }

        // Verify permissions exist
        foreach ($users as $user) {
            $user->refresh();
            $this->assertTrue($user->permissions()->where('permission_id', $this->permission1->id)->exists());
        }

        // Remove permission from role
        $this->rolePermissionService->removePermissionFromRole($this->role, $this->permission1);

        // Verify permissions removed
        foreach ($users as $user) {
            $user->refresh();
            $this->assertFalse($user->permissions()->where('permission_id', $this->permission1->id)->exists());
        }
    }

    /**
     * Test new users assigned to role get all existing permissions
     */
    public function test_new_users_get_all_role_permissions(): void
    {
        // Add permissions to role first
        $this->rolePermissionService->addPermissionToRole($this->role, $this->permission1);
        $this->rolePermissionService->addPermissionToRole($this->role, $this->permission2);

        // Create new user and assign role
        $newUser = User::factory()->create();
        $this->rolePermissionService->assignRole($newUser, $this->role);

        // Sync permissions
        $this->rolePermissionService->syncUserPermissions($newUser);
        $newUser->refresh();

        // Should have both permissions
        $this->assertTrue($newUser->permissions()->where('permission_id', $this->permission1->id)->exists());
        $this->assertTrue($newUser->permissions()->where('permission_id', $this->permission2->id)->exists());
    }

    /**
     * Test role with no permissions propagates empty set
     */
    public function test_role_with_no_permissions_syncs_correctly(): void
    {
        $user = User::factory()->create();
        $this->rolePermissionService->assignRole($user, $this->role);

        // Don't add any permissions
        $this->rolePermissionService->syncUserPermissions($user);
        $user->refresh();

        // User should have no permissions
        $this->assertEquals(0, $user->permissions()->count());
    }

    /**
     * Test permission sync audit trail
     */
    public function test_permission_propagation_creates_audit_logs(): void
    {
        $user = User::factory()->create();
        $this->rolePermissionService->assignRole($user, $this->role);
        $this->rolePermissionService->addPermissionToRole($this->role, $this->permission1);

        // Track logs before sync
        $logsBefore = $this->role->permissionSyncLogs()->count();

        // Sync
        $this->rolePermissionService->syncUserPermissions($user);

        // Should have audit logs
        $this->assertGreaterThan($logsBefore, $this->role->permissionSyncLogs()->count());
    }

    /**
     * Test bulk role assignment propagates permissions
     */
    public function test_bulk_role_assignment_with_permissions(): void
    {
        $users = User::factory()->count(3)->create();

        // Add permission to role first
        $this->rolePermissionService->addPermissionToRole($this->role, $this->permission1);

        // Bulk assign
        $this->rolePermissionService->bulkAssignRole(collect($users), $this->role);

        // Sync all users
        foreach ($users as $user) {
            $this->rolePermissionService->syncUserPermissions($user);
            $user->refresh();

            // Should have permission
            $this->assertTrue($user->permissions()->where('permission_id', $this->permission1->id)->exists());
        }
    }

    /**
     * Test removing role removes propagated permissions
     */
    public function test_removing_role_removes_permissions(): void
    {
        $user = User::factory()->create();

        // Assign role and add permission
        $this->rolePermissionService->assignRole($user, $this->role);
        $this->rolePermissionService->addPermissionToRole($this->role, $this->permission1);
        $this->rolePermissionService->syncUserPermissions($user);

        $user->refresh();
        $this->assertTrue($user->permissions()->where('permission_id', $this->permission1->id)->exists());

        // Remove role
        $this->rolePermissionService->removeRole($user, $this->role);

        $user->refresh();
        $this->assertFalse($user->permissions()->where('permission_id', $this->permission1->id)->exists());
    }

    /**
     * Test permission propagation with multiple roles
     */
    public function test_permission_propagation_with_multiple_roles(): void
    {
        $role2 = Role::factory()->create(['is_active' => true]);
        $permission3 = Permission::factory()->create();

        $user = User::factory()->create();

        // Assign both roles
        $this->rolePermissionService->assignRole($user, $this->role);
        $this->rolePermissionService->assignRole($user, $role2);

        // Add different permissions to each role
        $this->rolePermissionService->addPermissionToRole($this->role, $this->permission1);
        $this->rolePermissionService->addPermissionToRole($role2, $permission3);

        // Sync
        $this->rolePermissionService->syncUserPermissions($user);
        $user->refresh();

        // Should have permissions from both roles
        $this->assertTrue($user->permissions()->where('permission_id', $this->permission1->id)->exists());
        $this->assertTrue($user->permissions()->where('permission_id', $permission3->id)->exists());
    }
}
