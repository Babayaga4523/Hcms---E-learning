<?php

namespace App\Http\Controllers\Admin;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\Department;
use App\Models\AuditLog;
use App\Models\UserTraining;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserController
{
    // Role Management
    public function getRoles()
    {
        $roles = Role::with('permissions')->get();
        $permissions = Permission::all();
        $stats = [
            'total_roles' => Role::count(),
            'total_permissions' => Permission::count(),
            'active_roles' => Role::where('is_active', true)->count(),
        ];

        return inertia('Admin/UserRolePermissions', [
            'roles' => $roles,
            'permissions' => $permissions,
            'stats' => $stats,
        ]);
    }

    public function storeRole(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|unique:roles,name',
            'description' => 'nullable',
            'selectedPermissions' => 'array',
            'is_active' => 'boolean',
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        if (!empty($validated['selectedPermissions'])) {
            $role->permissions()->attach($validated['selectedPermissions']);
        }

        return response()->json(['message' => 'Role created successfully']);
    }

    public function updateRole($id, Request $request)
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|unique:roles,name,' . $id,
            'description' => 'nullable',
            'selectedPermissions' => 'array',
            'is_active' => 'boolean',
        ]);

        $role->update([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $role->permissions()->sync($validated['selectedPermissions'] ?? []);

        return response()->json(['message' => 'Role updated successfully']);
    }

    public function deleteRole($id)
    {
        $role = Role::findOrFail($id);
        $role->delete();

        return response()->json(['message' => 'Role deleted successfully']);
    }

    // Permission Management
    public function storePermission(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|unique:permissions,name',
            'slug' => 'required|unique:permissions,slug',
            'description' => 'nullable',
            'category' => 'nullable',
            'is_active' => 'boolean',
        ]);

        Permission::create($validated);

        return response()->json(['message' => 'Permission created successfully']);
    }

    public function updatePermission($id, Request $request)
    {
        $permission = Permission::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|unique:permissions,name,' . $id,
            'slug' => 'required|unique:permissions,slug,' . $id,
            'description' => 'nullable',
            'category' => 'nullable',
            'is_active' => 'boolean',
        ]);

        $permission->update($validated);

        return response()->json(['message' => 'Permission updated successfully']);
    }

    public function deletePermission($id)
    {
        $permission = Permission::findOrFail($id);
        $permission->delete();

        return response()->json(['message' => 'Permission deleted successfully']);
    }

    // Activity Logs
    public function getActivityLogs(Request $request)
    {
        $query = AuditLog::with('user')
            ->orderBy('logged_at', 'desc');

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->action) {
            $query->where('action', $request->action);
        }

        if ($request->dateFrom) {
            $query->whereDate('logged_at', '>=', $request->dateFrom);
        }

        if ($request->dateTo) {
            $query->whereDate('logged_at', '<=', $request->dateTo);
        }

        $activities = $query->paginate(50);

        $stats = [
            'total_activities' => AuditLog::count(),
            'today_activities' => AuditLog::whereDate('logged_at', today())->count(),
            'active_users' => AuditLog::distinct('user_id')->count('user_id'),
            'logins_today' => AuditLog::where('action', 'login')->whereDate('logged_at', today())->count(),
        ];

        return inertia('Admin/UserActivityLog', [
            'activities' => $activities,
            'users' => User::select('id', 'name', 'email')->get(),
            'stats' => $stats,
            'dateRange' => [
                'from' => $request->dateFrom,
                'to' => $request->dateTo,
            ],
        ]);
    }

    public function exportActivityLogs(Request $request)
    {
        $query = AuditLog::with('user')
            ->orderBy('logged_at', 'desc');

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->action) {
            $query->where('action', $request->action);
        }

        if ($request->dateFrom) {
            $query->whereDate('logged_at', '>=', $request->dateFrom);
        }

        if ($request->dateTo) {
            $query->whereDate('logged_at', '<=', $request->dateTo);
        }

        $logs = $query->get();

        $csv = "User,Action,Entity Type,Entity ID,IP Address,Date & Time\n";
        foreach ($logs as $log) {
            $csv .= "\"{$log->user?->name}\",\"{$log->action}\",\"{$log->entity_type}\",{$log->entity_id},\"{$log->ip_address}\",\"{$log->logged_at}\"\n";
        }

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="activity-logs.csv"');
    }

    // Department Management
    public function getDepartments()
    {
        $departments = Department::with('head', 'users')->get();
        $users = User::all();

        $stats = [
            'total_departments' => Department::count(),
            'active_departments' => Department::where('is_active', true)->count(),
            'total_users_in_depts' => User::whereNotNull('department_id')->count(),
            'avg_users_per_dept' => User::whereNotNull('department_id')->count() / (Department::count() ?: 1),
        ];

        return inertia('Admin/DepartmentManagement', [
            'departments' => $departments,
            'users' => $users,
            'stats' => $stats,
        ]);
    }

    public function storeDepartment(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|unique:departments,name',
            'code' => 'nullable|unique:departments,code',
            'description' => 'nullable',
            'head_id' => 'nullable|exists:users,id',
            'is_active' => 'boolean',
        ]);

        Department::create($validated);

        return response()->json(['message' => 'Department created successfully']);
    }

    public function updateDepartment($id, Request $request)
    {
        $dept = Department::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|unique:departments,name,' . $id,
            'code' => 'nullable|unique:departments,code,' . $id,
            'description' => 'nullable',
            'head_id' => 'nullable|exists:users,id',
            'is_active' => 'boolean',
        ]);

        $dept->update($validated);

        return response()->json(['message' => 'Department updated successfully']);
    }

    public function deleteDepartment($id)
    {
        $dept = Department::findOrFail($id);
        $dept->delete();

        return response()->json(['message' => 'Department deleted successfully']);
    }

    // Enrollment History
    public function getEnrollmentHistory(Request $request)
    {
        $query = UserTraining::with('user', 'module')
            ->orderBy('enrolled_at', 'desc');

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->dateFrom) {
            $query->whereDate('enrolled_at', '>=', $request->dateFrom);
        }

        if ($request->dateTo) {
            $query->whereDate('enrolled_at', '<=', $request->dateTo);
        }

        $enrollments = $query->paginate(50);

        $totalEnrollments = UserTraining::count();
        $stats = [
            'total_enrollments' => $totalEnrollments,
            'completed' => UserTraining::where('status', 'completed')->count(),
            'in_progress' => UserTraining::where('status', 'in_progress')->count(),
            'failed' => UserTraining::where('status', 'failed')->count(),
            'enrolled' => UserTraining::where('status', 'enrolled')->count(),
            'completion_rate' => round((UserTraining::where('status', 'completed')->count() / ($totalEnrollments ?: 1)) * 100),
            'avg_completion_days' => (function() {
                $completed = UserTraining::where('status', 'completed')
                    ->whereNotNull('completed_at')
                    ->whereNotNull('enrolled_at')
                    ->get();

                if ($completed->count() === 0) return 0;

                $avgDays = (int) round($completed->map(function($e) { return $e->completed_at->diffInDays($e->enrolled_at); })->avg());

                return $avgDays;
            })(),
            'certified_users' => UserTraining::where('is_certified', true)->distinct('user_id')->count('user_id'),
            'avg_score' => round(UserTraining::whereNotNull('final_score')->avg('final_score') ?? 0),
        ];

        return inertia('Admin/UserEnrollmentHistory', [
            'enrollments' => $enrollments,
            'users' => User::select('id', 'name', 'email')->get(),
            'stats' => $stats,
            'filters' => [
                'search' => $request->user_id,
                'status' => $request->status,
                'dateFrom' => $request->dateFrom,
                'dateTo' => $request->dateTo,
            ],
        ]);
    }

    public function exportEnrollmentHistory(Request $request)
    {
        $query = UserTraining::with('user', 'module')
            ->orderBy('enrolled_at', 'desc');

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $enrollments = $query->get();

        $csv = "User Name,Email,Module,Status,Enrolled Date,Completed Date,Score,Certified\n";
        foreach ($enrollments as $enrollment) {
            $csv .= "\"{$enrollment->user?->name}\",\"{$enrollment->user?->email}\",\"{$enrollment->module?->title}\",\"{$enrollment->status}\",\"{$enrollment->enrolled_at?->toDateString()}\",\"{$enrollment->completed_at?->toDateString()}\",{$enrollment->final_score},\"" . ($enrollment->is_certified ? 'Yes' : 'No') . "\"\n";
        }

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="enrollment-history.csv"');
    }

    // Analytics - Top Performers
    public function getTopPerformers(Request $request)
    {
        $limit = $request->query('limit', 10);

        $topPerformers = User::select('users.id', 'users.name', 'users.email', 'users.department')
            ->withCount('completedModules')
            ->withSum('trainings', 'final_score')
            ->orderByRaw('COALESCE(trainings_sum_final_score, 0) DESC')
            ->limit($limit)
            ->get()
            ->map(function ($user) {
                $xpEarned = $user->trainings_sum_final_score ?? 0;
                $badge = $xpEarned >= 50000 ? 'PRO' : ($xpEarned >= 30000 ? 'ADVANCED' : 'MEMBER');

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'department' => $user->department ?? 'No Department',
                    'xp_earned' => $xpEarned,
                    'completed_modules' => $user->completed_modules_count ?? 0,
                    'badge' => $badge,
                ];
            });

        return response()->json($topPerformers);
    }
}
