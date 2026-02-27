<?php

namespace Tests\Unit\Services;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\Department;
use App\Services\RolePermissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Exception;

class RolePermissionServiceTest extends TestCase
{
    use RefreshDatabase;

    protected RolePermissionService $rolePermissionService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->rolePermissionService = app(RolePermissionService::class);
    }

    /**
     * Test successful role assignment
     */
    public function test_can_assign_role_to_user(): void
    {
        $user = User::factory()->create();
        $role = Role::factory()->create(['is_active' => true]);

        $this->rolePermissionService->assignRole($user, $role);

        $this->assertTrue($user->roles()->where('role_id', $role->id)->exists());
    }

    /**
     * Test cannot assign inactive role
     */
    public function test_cannot_assign_inactive_role(): void
    {
        $user = User::factory()->create();
        $role = Role::factory()->create(['is_active' => false]);

        $this->expectException(Exception::class);
        $this->rolePermissionService->assignRole($user, $role);
    }

    /**
     * Test cannot assign duplicate role
     */
    public function test_cannot_assign_duplicate_role(): void
    {
        $user = User::factory()->create();
        $role = Role::factory()->create(['is_active' => true]);

        // First assignment
        $this->rolePermissionService->assignRole($user, $role);

        // Second assignment should fail
        $this->expectException(Exception::class);
        $this->rolePermissionService->assignRole($user, $role);
    }

    /**
     * Test remove role from user
     */
    public function test_can_remove_role_from_user(): void
    {
        $user = User::factory()->create();
        $role = Role::factory()->create(['is_active' => true]);

        $this->rolePermissionService->assignRole($user, $role);
        $this->rolePermissionService->removeRole($user, $role);

        $this->assertFalse($user->roles()->where('role_id', $role->id)->exists());
    }

    /**
     * Test add permission to role propagates to users
     */
    public function test_add_permission_to_role_propagates_to_users(): void
    {
        $role = Role::factory()->create();
        $permission = Permission::factory()->create();
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        // Assign role to users
        $this->rolePermissionService->assignRole($user1, $role);
        $this->rolePermissionService->assignRole($user2, $role);

        // Add permission to role
        $this->rolePermissionService->addPermissionToRole($role, $permission);

        // Check both users have permission
        $user1->refresh();
        $user2->refresh();

        $this->assertTrue($user1->permissions()->where('permission_id', $permission->id)->exists());
        $this->assertTrue($user2->permissions()->where('permission_id', $permission->id)->exists());
    }

    /**
     * Test cannot add duplicate permission
     */
    public function test_cannot_add_duplicate_permission_to_role(): void
    {
        $role = Role::factory()->create();
        $permission = Permission::factory()->create();

        $this->rolePermissionService->addPermissionToRole($role, $permission);

        $this->expectException(Exception::class);
        $this->rolePermissionService->addPermissionToRole($role, $permission);
    }

    /**
     * Test remove permission from role propagates to users
     */
    public function test_remove_permission_from_role_propagates_to_users(): void
    {
        $role = Role::factory()->create();
        $permission = Permission::factory()->create();
        $user = User::factory()->create();

        $this->rolePermissionService->assignRole($user, $role);
        $this->rolePermissionService->addPermissionToRole($role, $permission);

        $user->refresh();
        $this->assertTrue($user->permissions()->where('permission_id', $permission->id)->exists());

        $this->rolePermissionService->removePermissionFromRole($role, $permission);

        $user->refresh();
        $this->assertFalse($user->permissions()->where('permission_id', $permission->id)->exists());
    }

    /**
     * Test sync user permissions
     */
    public function test_sync_user_permissions(): void
    {
        $user = User::factory()->create();
        $role = Role::factory()->create();
        $permission1 = Permission::factory()->create();
        $permission2 = Permission::factory()->create();

        $this->rolePermissionService->assignRole($user, $role);
        $this->rolePermissionService->addPermissionToRole($role, $permission1);
        $this->rolePermissionService->addPermissionToRole($role, $permission2);

        $this->rolePermissionService->syncUserPermissions($user);

        $user->refresh();
        $this->assertTrue($user->permissions()->where('permission_id', $permission1->id)->exists());
        $this->assertTrue($user->permissions()->where('permission_id', $permission2->id)->exists());
    }

    /**
     * Test bulk assign role
     */
    public function test_bulk_assign_role(): void
    {
        $users = User::factory()->count(3)->create();
        $role = Role::factory()->create(['is_active' => true]);

        $results = $this->rolePermissionService->bulkAssignRole(
            collect($users),
            $role
        );

        $this->assertEquals(3, $results['successful']);
        $this->assertEquals(0, $results['failed']);

        foreach ($users as $user) {
            $this->assertTrue($user->roles()->where('role_id', $role->id)->exists());
        }
    }

    /**
     * Test get affected users
     */
    public function test_get_affected_users(): void
    {
        $role = Role::factory()->create();
        $users = User::factory()->count(3)->create();

        foreach ($users as $user) {
            $this->rolePermissionService->assignRole($user, $role);
        }

        $affected = $this->rolePermissionService->getAffectedUsers($role);

        $this->assertCount(3, $affected);
    }

    /**
     * Test role permission sync history
     */
    public function test_get_role_permission_sync_history(): void
    {
        $role = Role::factory()->create();
        $permission = Permission::factory()->create();

        $this->rolePermissionService->addPermissionToRole($role, $permission);

        $history = $this->rolePermissionService->getRolePermissionHistory($role);

        $this->assertGreaterThan(0, $history->count());
    }
}
