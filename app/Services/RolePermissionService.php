<?php

namespace App\Services;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\Department;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Collection;
use Exception;

/**
 * RolePermissionService
 * Handles role assignment, permission propagation, and department compatibility validation
 */
class RolePermissionService
{
    /**
     * Assign role to user with validation
     */
    public function assignRole(User $user, Role $role, ?Department $department = null, ?int $assignedBy = null): void
    {
        DB::beginTransaction();
        try {
            // Validation 1: Check role exists and is active
            if (!$role->is_active) {
                throw new Exception("Cannot assign inactive role: {$role->name}");
            }

            // Validation 2: Check department compatibility
            if ($role->isDepartmentRestricted()) {
                if (!$department) {
                    throw new Exception("This role requires department assignment");
                }

                $this->validateDepartmentCompatibility($role, $department);
            }

            // Validation 3: User's department must be compatible
            if ($user->department_id && $role->isDepartmentRestricted()) {
                $userDept = $user->department;
                if (!$this->isDepartmentCompatible($role, $userDept)) {
                    throw new Exception(
                        "User's department ({$userDept->name}) is not compatible with role ({$role->name})"
                    );
                }
            }

            // Check if role already assigned
            $alreadyAssigned = $user->roles()
                ->wherePivot('active', true)
                ->where('id', $role->id)
                ->exists();

            if ($alreadyAssigned) {
                throw new Exception("User already has this role");
            }

            // Assign role with metadata
            $user->roles()->attach($role->id, [
                'assigned_at' => now(),
                'assigned_by' => $assignedBy ?? (Auth::id() ?? 1),
                'active' => true,
            ]);

            // Log role assignment
            $this->logRoleChange($user, $role, 'role_assigned', $assignedBy);

            // Propagate permissions to user
            $this->syncUserPermissions($user);

            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Remove role from user
     */
    public function removeRole(User $user, Role $role): void
    {
        DB::beginTransaction();
        try {
            $user->roles()->detach($role->id);

            $this->logRoleChange($user, $role, 'role_removed');
            $this->syncUserPermissions($user);

            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Sync permissions for a user based on assigned roles
     */
    public function syncUserPermissions(User $user): void
    {
        DB::beginTransaction();
        try {
            // Get all permissions from active roles
            $permissions = $user->roles()
                ->wherePivot('active', true)
                ->with('permissions')
                ->get()
                ->pluck('permissions')
                ->flatten()
                ->unique('id');

            // Sync user permissions
            $user->permissions()->sync($permissions->pluck('id'));

            // Log sync
            $this->logPermissionSync($user, 'user_sync', $permissions->count());

            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Add permission to role and propagate to all users
     */
    public function addPermissionToRole(Role $role, Permission $permission): void
    {
        DB::beginTransaction();
        try {
            // Check if already attached
            $alreadyHas = $role->permissions()
                ->where('permission_id', $permission->id)
                ->exists();

            if ($alreadyHas) {
                throw new Exception("Role already has this permission");
            }

            // Add permission to role
            $role->permissions()->attach($permission->id);

            // Get all users with this role
            $affectedUsers = $role->users()
                ->wherePivot('active', true)
                ->get();

            // Sync permissions for all affected users
            foreach ($affectedUsers as $user) {
                $this->syncUserPermissions($user);
            }

            // Log the change
            $this->logRolePermissionChange(
                $role,
                $permission,
                'permission_added',
                $affectedUsers->count()
            );

            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Remove permission from role and propagate
     */
    public function removePermissionFromRole(Role $role, Permission $permission): void
    {
        DB::beginTransaction();
        try {
            $role->permissions()->detach($permission->id);

            // Get all users with this role
            $affectedUsers = $role->users()
                ->wherePivot('active', true)
                ->get();

            // Sync permissions for all affected users
            foreach ($affectedUsers as $user) {
                $this->syncUserPermissions($user);
            }

            $this->logRolePermissionChange(
                $role,
                $permission,
                'permission_removed',
                $affectedUsers->count()
            );

            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Validate department compatibility with role
     */
    private function validateDepartmentCompatibility(Role $role, Department $department): bool
    {
        $compatibility = $role->departmentCompatibility()
            ->where('allowed_department_id', $department->id)
            ->where('is_restricted', false)
            ->exists();

        if (!$compatibility && $role->isDepartmentRestricted()) {
            throw new Exception(
                "Department ({$department->name}) is not compatible with role ({$role->name})"
            );
        }

        return true;
    }

    /**
     * Check if department is compatible with role
     */
    private function isDepartmentCompatible(Role $role, Department $department): bool
    {
        if (!$role->isDepartmentRestricted()) {
            return true;
        }

        return $role->departmentCompatibility()
            ->where('allowed_department_id', $department->id)
            ->where('is_restricted', false)
            ->exists();
    }

    /**
     * Get all users affected by role permission change
     */
    public function getAffectedUsers(Role $role): Collection
    {
        return $role->users()
            ->wherePivot('active', true)
            ->get();
    }

    /**
     * Bulk assign role to users with validation
     */
    public function bulkAssignRole(Collection $users, Role $role, ?int $assignedBy = null): array
    {
        $results = [
            'successful' => 0,
            'failed' => 0,
            'errors' => [],
        ];

        DB::beginTransaction();
        try {
            foreach ($users as $user) {
                try {
                    $this->assignRole($user, $role, null, $assignedBy);
                    $results['successful']++;
                } catch (Exception $e) {
                    $results['failed']++;
                    $results['errors'][$user->id] = $e->getMessage();
                }
            }

            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            $results['errors']['batch'] = $e->getMessage();
        }

        return $results;
    }

    /**
     * Log role changes for audit trail
     */
    private function logRoleChange(User $user, Role $role, string $action, ?int $assignedBy = null): void
    {
        // Implement based on your audit log system
        // Example: RoleChangeLog::create([...])
    }

    /**
     * Log permission sync
     */
    private function logPermissionSync(User $user, string $action, int $permissionCount): void
    {
        // Implement based on your audit log system
    }

    /**
     * Log role permission changes
     */
    private function logRolePermissionChange(
        Role $role,
        Permission $permission,
        string $action,
        int $affectedUsersCount
    ): void {
        // Use the existing role_permission_sync_logs table
        DB::table('role_permission_sync_logs')->insert([
            'role_id' => $role->id,
            'action' => $action,
            'permission_id' => $permission->id,
            'affected_users_count' => $affectedUsersCount,
            'synced_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Get role permission sync history
     */
    public function getRolePermissionHistory(Role $role, $limit = 50)
    {
        return DB::table('role_permission_sync_logs')
            ->where('role_id', $role->id)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
}
