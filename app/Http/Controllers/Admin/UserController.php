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
use Illuminate\Support\Facades\DB;
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

        // Return JSON for API consumers
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'data' => $activities->items(),
                'meta' => [
                    'total' => $activities->total(),
                    'per_page' => $activities->perPage(),
                    'current_page' => $activities->currentPage(),
                ],
                'stats' => $stats,
            ]);
        }

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

        // Use same calculation as DashboardMetricsController for consistency
        $topPerformers = User::where('role', 'user')
            ->leftJoin('user_trainings', 'users.id', '=', 'user_trainings.user_id')
            ->leftJoin('modules', 'user_trainings.module_id', '=', 'modules.id')
            ->selectRaw('
                users.id,
                users.name,
                users.email,
                users.department as dept,
                COUNT(DISTINCT user_trainings.module_id) as completed_trainings,
                SUM(CASE WHEN user_trainings.is_certified = true THEN 1 ELSE 0 END) as certifications,
                ROUND(AVG(user_trainings.final_score), 2) as avg_exam_score,
                ROUND(
                    SUM(CASE WHEN user_trainings.status = "completed" OR user_trainings.is_certified = true 
                             THEN COALESCE(modules.xp, 0) ELSE 0 END)
                ) as total_points
            ')
            ->groupBy('users.id', 'users.name', 'users.email', 'users.department')
            ->orderByDesc('total_points')
            ->limit($limit)
            ->get()
            ->map(function ($user) {
                $totalPoints = $user->total_points ?? 0;
                $badge = $totalPoints >= 500 ? 'PRO' : ($totalPoints >= 300 ? 'ADVANCED' : 'MEMBER');

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'department' => $user->dept ?? 'No Department',
                    'total_points' => $totalPoints,
                    'xp_earned' => $totalPoints, // Alias for backwards compatibility
                    'completed_modules' => $user->completed_trainings ?? 0,
                    'modules' => $user->completed_trainings ?? 0,
                    'certifications' => $user->certifications ?? 0,
                    'avg_exam_score' => $user->avg_exam_score ?? 0,
                    'badge' => $badge,
                ];
            });

        return response()->json($topPerformers);
    }

    /**
     * Get full leaderboard with all users
     */
    public function getLeaderboard(Request $request)
    {
        $limit = $request->query('limit', 50);
        $department = $request->query('department', 'all');

        $query = User::where('role', 'user');

        if ($department !== 'all') {
            $query->where('department', $department);
        }

        $leaderboard = $query
            ->leftJoin('user_trainings', 'users.id', '=', 'user_trainings.user_id')
            ->leftJoin('modules', 'user_trainings.module_id', '=', 'modules.id')
            ->selectRaw('
                users.id,
                users.name,
                users.email,
                users.nip,
                users.department,
                users.location,
                COUNT(DISTINCT user_trainings.module_id) as completed_modules,
                SUM(CASE WHEN user_trainings.is_certified = true THEN 1 ELSE 0 END) as certifications,
                ROUND(AVG(user_trainings.final_score), 2) as avg_score,
                ROUND(
                    SUM(CASE WHEN user_trainings.status = "completed" OR user_trainings.is_certified = true 
                             THEN COALESCE(modules.xp, 0) ELSE 0 END)
                ) as total_points
            ')
            ->groupBy('users.id', 'users.name', 'users.email', 'users.nip', 'users.department', 'users.location')
            ->orderByDesc('total_points')
            ->limit($limit)
            ->get()
            ->map(function ($user) {
                $totalPoints = $user->total_points ?? 0;
                $badge = $totalPoints >= 500 ? 'PRO' : ($totalPoints >= 300 ? 'ADVANCED' : 'MEMBER');

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'nip' => $user->nip ?? 'N/A',
                    'department' => $user->department ?? 'Unassigned',
                    'location' => $user->location ?? 'N/A',
                    'completed_modules' => $user->completed_modules ?? 0,
                    'certifications' => $user->certifications ?? 0,
                    'avg_score' => $user->avg_score ?? 0,
                    'total_points' => $totalPoints,
                    'badge' => $badge,
                ];
            });

        return response()->json([
            'leaderboard' => $leaderboard,
            'count' => $leaderboard->count(),
        ]);
    }

    /**
     * Get detailed user history - training completions, scores, and points breakdown
     */
    public function getUserHistory(Request $request, $userId)
    {
        $user = User::findOrFail($userId);

        // Get user's training history
        $trainings = DB::table('user_trainings')
            ->join('modules', 'user_trainings.module_id', '=', 'modules.id')
            ->where('user_trainings.user_id', $userId)
            ->select(
                'user_trainings.id',
                'modules.id as module_id',
                'modules.title',
                'user_trainings.enrolled_at',
                'user_trainings.completed_at',
                'user_trainings.status',
                'user_trainings.final_score',
                'user_trainings.is_certified',
                'user_trainings.created_at'
            )
            ->orderByDesc('user_trainings.completed_at')
            ->get()
            ->map(function ($training) {
                // Calculate points for this training
                $modulePoints = 20; // Base points for module completion
                $certPoints = $training->is_certified ? 25 : 0; // Certification bonus
                $scorePoints = $training->final_score ?? 0; // Score points

                return [
                    'id' => $training->id,
                    'module_id' => $training->module_id,
                    'module_title' => $training->title,
                    'status' => $training->status,
                    'final_score' => $training->final_score ?? 0,
                    'is_certified' => (bool)$training->is_certified,
                    'enrolled_date' => $training->enrolled_at ? \Carbon\Carbon::parse($training->enrolled_at)->format('Y-m-d H:i') : null,
                    'completed_date' => $training->completed_at ? \Carbon\Carbon::parse($training->completed_at)->format('Y-m-d H:i') : null,
                    'points_breakdown' => [
                        'module_completion' => $training->status === 'completed' ? $modulePoints : 0,
                        'certification_bonus' => $certPoints,
                        'score_points' => $scorePoints,
                        'total' => ($training->status === 'completed' ? $modulePoints : 0) + $certPoints + round($scorePoints),
                    ],
                ];
            });

        // Get exam attempts history
        $examAttempts = DB::table('exam_attempts')
            ->where('exam_attempts.user_id', $userId)
            ->select(
                'exam_attempts.id',
                'exam_attempts.score',
                'exam_attempts.created_at',
                'exam_attempts.updated_at'
            )
            ->orderByDesc('exam_attempts.created_at')
            ->get()
            ->map(function ($attempt) {
                return [
                    'id' => $attempt->id,
                    'type' => 'exam',
                    'score' => $attempt->score ?? 0,
                    'date' => \Carbon\Carbon::parse($attempt->created_at)->format('Y-m-d H:i'),
                    'points' => round($attempt->score ?? 0),
                ];
            });

        // Calculate total points breakdown
        $totalModulePoints = $trainings->sum(fn($t) => $t['points_breakdown']['module_completion']);
        $totalCertPoints = $trainings->sum(fn($t) => $t['points_breakdown']['certification_bonus']);
        $totalScorePoints = $trainings->sum(fn($t) => $t['points_breakdown']['score_points']);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'department' => $user->department ?? 'Unassigned',
                'nip' => $user->nip ?? 'N/A',
            ],
            'trainings' => $trainings,
            'exam_attempts' => $examAttempts,
            'points_summary' => [
                'module_completion_points' => $totalModulePoints,
                'certification_bonus_points' => $totalCertPoints,
                'score_points' => round($totalScorePoints),
                'total_points' => $totalModulePoints + $totalCertPoints + round($totalScorePoints),
            ],
            'stats' => [
                'total_modules_completed' => $trainings->where('status', 'completed')->count(),
                'total_certifications' => $trainings->where('is_certified', true)->count(),
                'avg_score' => round($trainings->avg('final_score'), 2),
            ],
        ]);
    }

    /**
     * Update User Information (NIP, Location, etc)
     */
    public function updateUserInfo(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'nip' => 'nullable|string|max:50|unique:users,nip,' . $id,
            'location' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'department' => 'nullable|string|max:100',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'User information updated successfully',
            'user' => $user,
        ]);
    }
}

