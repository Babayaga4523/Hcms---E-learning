<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\Department;
use App\Services\RolePermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Collection;
use Exception;

class RolePermissionController extends Controller
{
    protected RolePermissionService $rolePermissionService;

    public function __construct(RolePermissionService $rolePermissionService)
    {
        $this->rolePermissionService = $rolePermissionService;
    }

    /**
     * Assign role to user
     */
    public function assignRole(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'user_id' => 'required|integer|exists:users,id',
                'role_id' => 'required|integer|exists:roles,id',
                'department_id' => 'nullable|integer|exists:departments,id',
            ]);

            $user = User::findOrFail($validated['user_id']);
            $role = Role::findOrFail($validated['role_id']);
            $department = $validated['department_id'] 
                ? Department::findOrFail($validated['department_id']) 
                : null;

            $this->rolePermissionService->assignRole(
                $user,
                $role,
                $department,
                Auth::id() ?? 1
            );

            return response()->json([
                'success' => true,
                'message' => "Role '{$role->name}' assigned to user '{$user->name}'",
                'data' => $user->load('roles', 'permissions'),
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Remove role from user
     */
    public function removeRole(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'user_id' => 'required|integer|exists:users,id',
                'role_id' => 'required|integer|exists:roles,id',
            ]);

            $user = User::findOrFail($validated['user_id']);
            $role = Role::findOrFail($validated['role_id']);

            $this->rolePermissionService->removeRole($user, $role);

            return response()->json([
                'success' => true,
                'message' => "Role '{$role->name}' removed from user '{$user->name}'",
                'data' => $user->load('roles', 'permissions'),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Add permission to role
     */
    public function addPermission(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'role_id' => 'required|integer|exists:roles,id',
                'permission_id' => 'required|integer|exists:permissions,id',
            ]);

            $role = Role::findOrFail($validated['role_id']);
            $permission = Permission::findOrFail($validated['permission_id']);

            $this->rolePermissionService->addPermissionToRole($role, $permission);

            return response()->json([
                'success' => true,
                'message' => "Permission '{$permission->name}' added to role '{$role->name}'",
                'data' => $role->load('permissions'),
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Remove permission from role
     */
    public function removePermission(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'role_id' => 'required|integer|exists:roles,id',
                'permission_id' => 'required|integer|exists:permissions,id',
            ]);

            $role = Role::findOrFail($validated['role_id']);
            $permission = Permission::findOrFail($validated['permission_id']);

            $this->rolePermissionService->removePermissionFromRole($role, $permission);

            return response()->json([
                'success' => true,
                'message' => "Permission '{$permission->name}' removed from role '{$role->name}'",
                'data' => $role->load('permissions'),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Bulk assign role to users
     */
    public function bulkAssignRole(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'user_ids' => 'required|array|min:1',
                'user_ids.*' => 'integer|exists:users,id',
                'role_id' => 'required|integer|exists:roles,id',
            ]);

            $users = User::whereIn('id', $validated['user_ids'])->get();
            $role = Role::findOrFail($validated['role_id']);

            $results = $this->rolePermissionService->bulkAssignRole(
                $users,
                $role,
                Auth::id() ?? 1
            );

            return response()->json([
                'success' => $results['failed'] === 0,
                'message' => "Assigned '{$role->name}' to {$results['successful']} users",
                'data' => $results,
            ], $results['failed'] === 0 ? 201 : 207);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Sync user permissions
     */
    public function syncPermissions(int $userId): JsonResponse
    {
        try {
            $user = User::findOrFail($userId);

            $this->rolePermissionService->syncUserPermissions($user);

            return response()->json([
                'success' => true,
                'message' => 'User permissions synced',
                'data' => $user->load('roles', 'permissions'),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get user roles and permissions
     */
    public function userRoles(int $userId): JsonResponse
    {
        try {
            $user = User::with('roles.permissions', 'permissions')->findOrFail($userId);

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $user,
                    'roles' => $user->roles,
                    'permissions' => $user->permissions,
                    'role_count' => $user->roles->count(),
                    'permission_count' => $user->permissions->count(),
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get role permission sync history
     */
    public function syncHistory(int $roleId): JsonResponse
    {
        try {
            $role = Role::findOrFail($roleId);
            $history = $this->rolePermissionService->getRolePermissionHistory($role);

            return response()->json([
                'success' => true,
                'data' => $history,
                'count' => $history->count(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
