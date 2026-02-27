<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\Department;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RolePermissionControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $targetUser;
    protected Role $role;
    protected Permission $permission;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->targetUser = User::factory()->create();
        $this->role = Role::factory()->create(['is_active' => true]);
        $this->permission = Permission::factory()->create();
    }

    /**
     * Test POST /api/roles-permissions/assign-role
     */
    public function test_can_assign_role_to_user(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/roles-permissions/assign-role', [
                'user_id' => $this->targetUser->id,
                'role_id' => $this->role->id,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'data']);

        $this->assertDatabaseHas('role_user', [
            'user_id' => $this->targetUser->id,
            'role_id' => $this->role->id,
        ]);
    }

    /**
     * Test POST /api/roles-permissions/assign-role - validation
     */
    public function test_cannot_assign_inactive_role(): void
    {
        $inactiveRole = Role::factory()->create(['is_active' => false]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/roles-permissions/assign-role', [
                'user_id' => $this->targetUser->id,
                'role_id' => $inactiveRole->id,
            ]);

        $response->assertStatus(400);
    }

    /**
     * Test POST /api/roles-permissions/remove-role
     */
    public function test_can_remove_role_from_user(): void
    {
        $this->targetUser->roles()->attach($this->role->id);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/roles-permissions/remove-role', [
                'user_id' => $this->targetUser->id,
                'role_id' => $this->role->id,
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseMissing('role_user', [
            'user_id' => $this->targetUser->id,
            'role_id' => $this->role->id,
        ]);
    }

    /**
     * Test POST /api/roles-permissions/add-permission
     */
    public function test_can_add_permission_to_role(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/roles-permissions/add-permission', [
                'role_id' => $this->role->id,
                'permission_id' => $this->permission->id,
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('permission_role', [
            'role_id' => $this->role->id,
            'permission_id' => $this->permission->id,
        ]);
    }

    /**
     * Test POST /api/roles-permissions/remove-permission
     */
    public function test_can_remove_permission_from_role(): void
    {
        $this->role->permissions()->attach($this->permission->id);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/roles-permissions/remove-permission', [
                'role_id' => $this->role->id,
                'permission_id' => $this->permission->id,
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseMissing('permission_role', [
            'role_id' => $this->role->id,
            'permission_id' => $this->permission->id,
        ]);
    }

    /**
     * Test POST /api/roles-permissions/bulk-assign-role
     */
    public function test_can_bulk_assign_role(): void
    {
        $users = User::factory()->count(3)->create();
        $userIds = $users->pluck('id')->toArray();

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/roles-permissions/bulk-assign-role', [
                'user_ids' => $userIds,
                'role_id' => $this->role->id,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'summary']);

        foreach ($userIds as $userId) {
            $this->assertDatabaseHas('role_user', [
                'user_id' => $userId,
                'role_id' => $this->role->id,
            ]);
        }
    }

    /**
     * Test POST /api/roles-permissions/sync-permissions/{userId}
     */
    public function test_can_sync_user_permissions(): void
    {
        $this->targetUser->roles()->attach($this->role->id);
        $this->role->permissions()->attach($this->permission->id);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/roles-permissions/sync-permissions/{$this->targetUser->id}");

        $response->assertStatus(200);

        $this->targetUser->refresh();
        $this->assertTrue($this->targetUser->permissions()->where('permission_id', $this->permission->id)->exists());
    }

    /**
     * Test GET /api/roles-permissions/user/{userId}
     */
    public function test_can_get_user_roles_and_permissions(): void
    {
        $this->targetUser->roles()->attach($this->role->id);
        $this->role->permissions()->attach($this->permission->id);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/roles-permissions/user/{$this->targetUser->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'user_id',
                    'roles',
                    'permissions',
                ]
            ]);
    }

    /**
     * Test GET /api/roles-permissions/role/{roleId}/sync-history
     */
    public function test_can_get_role_sync_history(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/roles-permissions/role/{$this->role->id}/sync-history");

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    /**
     * Test permission propagation
     */
    public function test_permission_propagates_to_users_with_role(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        // Assign role to users
        $user1->roles()->attach($this->role->id);
        $user2->roles()->attach($this->role->id);

        // Add permission to role
        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/roles-permissions/add-permission', [
                'role_id' => $this->role->id,
                'permission_id' => $this->permission->id,
            ]);

        // Sync permissions for both users
        $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/roles-permissions/sync-permissions/{$user1->id}");

        $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/roles-permissions/sync-permissions/{$user2->id}");

        $user1->refresh();
        $user2->refresh();

        $this->assertTrue($user1->permissions()->where('permission_id', $this->permission->id)->exists());
        $this->assertTrue($user2->permissions()->where('permission_id', $this->permission->id)->exists());
    }
}
