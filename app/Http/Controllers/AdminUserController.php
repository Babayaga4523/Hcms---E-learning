<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminUserController extends Controller
{
    /**
     * Display list of users with pagination and search
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized');
        }

        try {
            $query = User::select(
                'id', 'name', 'email', 'role', 'status', 'phone', 'department', 
                'nip', 'location', 'created_at', 'updated_at',
                DB::raw('COALESCE(updated_at, created_at) as last_login')
            );

            // Search functionality
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('nip', 'like', "%{$search}%")
                      ->orWhere('department', 'like', "%{$search}%")
                      ->orWhere('location', 'like', "%{$search}%");
            }

            // Filter by role
            if ($request->has('role') && $request->role && $request->role !== 'all') {
                $query->where('role', $request->role);
            }

            // Filter by status
            if ($request->has('status') && $request->status && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Date range filter
            if ($request->has('dateFrom') && $request->dateFrom) {
                $query->whereDate('created_at', '>=', $request->dateFrom);
            }
            if ($request->has('dateTo') && $request->dateTo) {
                $query->whereDate('created_at', '<=', $request->dateTo);
            }

            // Sort
            $sortBy = $request->get('sortBy', 'created_at');
            $sortOrder = $request->get('sortOrder', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Get ALL users without backend pagination (pagination handled on frontend)
            $users = $query->get();

            // Get statistics
            $stats = [
                'total_users' => User::count(),
                'active_users' => User::where('status', 'active')->count(),
                'inactive_users' => User::where('status', 'inactive')->count(),
                'admin_users' => User::where('role', 'admin')->count(),
                'employee_users' => User::where('role', 'user')->count(),
                'new_this_month' => User::where('created_at', '>=', now()->startOfMonth())->count(),
            ];

            return Inertia::render('Admin/UserManagementLight', [
                'users' => $users,
                'stats' => $stats,
                'departments' => collect($users)->pluck('department')->filter()->unique()->sort()->values()->map(fn($name) => ['id' => $name, 'name' => $name])->toArray(),
                'filters' => [
                    'search' => $request->search ?? '',
                    'role' => $request->role ?? 'all',
                    'status' => $request->status ?? 'all',
                    'dateFrom' => $request->dateFrom ?? '',
                    'dateTo' => $request->dateTo ?? '',
                    'sortBy' => $sortBy,
                    'sortOrder' => $sortOrder,
                ],
                'auth' => ['user' => (array) $user],
            ]);
        } catch (\Exception $e) {
            Log::error('User Management Error: ' . $e->getMessage());
            abort(500, 'Error loading users');
        }
    }

    /**
     * Show single user details
     */
    /**
     * Display user detail page
     */
    public function detail($id, ?Request $request = null)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized');
        }

        try {
            $targetUser = User::findOrFail($id);

            // Get training statistics using aggregates to avoid N+1 problem
            $trainingStats = DB::table('user_trainings')
                ->where('user_id', $id)
                ->select(
                    DB::raw('COUNT(*) as total_trainings'),
                    DB::raw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count"),
                    DB::raw("SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count"),
                    DB::raw("SUM(CASE WHEN is_certified = 1 THEN 1 ELSE 0 END) as certified_count")
                )
                ->first();

            $completedCount = $trainingStats->completed_count ?? 0;
            $inProgressCount = $trainingStats->in_progress_count ?? 0;
            $certifiedCount = $trainingStats->certified_count ?? 0;
            $totalTrainings = $trainingStats->total_trainings ?? 0;

            // Calculate completion rate
            $completionRate = $totalTrainings > 0
                ? round(($completedCount / $totalTrainings) * 100, 2)
                : 0;

            // Get paginated training details (10 per page by default)
            $perPage = $request?->input('per_page', 10) ?? 10;
            if ($perPage > 100) $perPage = 100; // Max 100 per page
            
            $trainingsPaginated = DB::table('user_trainings as ut')
                ->join('modules as m', 'ut.module_id', '=', 'm.id')
                ->where('ut.user_id', $id)
                ->select(
                    'ut.id',
                    'ut.module_id',
                    'm.title as module_title',
                    'ut.status',
                    'ut.enrolled_at',
                    'ut.is_certified',
                    'ut.final_score',
                    'ut.completed_at'
                )
                ->orderBy('ut.enrolled_at', 'desc')
                ->paginate($perPage);

            // Transform to array format
            $trainingDetails = $trainingsPaginated->map(fn($training) => [
                'id' => $training->id,
                'module_title' => $training->module_title ?? 'N/A',
                'status' => $training->status,
                'enrolled_at' => $training->enrolled_at,
                'is_certified' => $training->is_certified,
                'final_score' => $training->final_score,
                'completed_at' => $training->completed_at,
            ]);

            return Inertia::render('Admin/UserDetail', [
                'user' => [
                    'id' => $targetUser->id,
                    'name' => $targetUser->name,
                    'email' => $targetUser->email,
                    'nip' => $targetUser->nip ?? null,
                    'phone' => $targetUser->phone ?? null,
                    'role' => $targetUser->role,
                    'status' => $targetUser->status,
                    'department' => $targetUser->department ?? null,
                    'last_login_at' => $targetUser->last_login_at,
                    'created_at' => $targetUser->created_at,
                    'updated_at' => $targetUser->updated_at,
                ],
                'statistics' => [
                    'total_trainings' => $totalTrainings,
                    'completed' => $completedCount,
                    'in_progress' => $inProgressCount,
                    'certified' => $certifiedCount,
                    'completion_rate' => $completionRate,
                ],
                'trainings' => $trainingDetails,
                'pagination' => [
                    'total' => $trainingsPaginated->total(),
                    'per_page' => $trainingsPaginated->perPage(),
                    'current_page' => $trainingsPaginated->currentPage(),
                    'last_page' => $trainingsPaginated->lastPage(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('User Detail Page Error: ' . $e->getMessage());
            abort(404, 'User not found');
        }
    }

    public function show($id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized');
        }

        try {
            $targetUser = User::findOrFail($id);

            return response()->json([
                'data' => [
                    'id' => $targetUser->id,
                    'name' => $targetUser->name,
                    'email' => $targetUser->email,
                    'nip' => $targetUser->nip ?? null,
                    'phone' => $targetUser->phone ?? null,
                    'role' => $targetUser->role,
                    'status' => $targetUser->status,
                    'department' => $targetUser->department ?? null,
                    'last_login_at' => $targetUser->last_login_at,
                    'created_at' => $targetUser->created_at,
                    'updated_at' => $targetUser->updated_at,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('User Detail Error: ' . $e->getMessage());
            return response()->json(['error' => 'User not found'], 404);
        }
    }

    /**
     * Store new user
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8',
                'role' => 'required|in:admin,user',
                'status' => 'required|in:active,inactive',
                'nip' => 'nullable|string|max:255',
                'location' => 'nullable|string|max:255',
                'department' => 'nullable|string|max:255',
            ]);

            $newUser = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'status' => $validated['status'],
                'nip' => $validated['nip'] ?? null,
                'location' => $validated['location'] ?? null,
                'department' => $validated['department'] ?? null,
            ]);

            // Log activity
            Log::info("User {$user->name} created new user: {$newUser->name}");

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'user' => [
                    'id' => $newUser->id,
                    'name' => $newUser->name,
                    'email' => $newUser->email,
                    'role' => $newUser->role,
                    'status' => $newUser->status,
                    'nip' => $newUser->nip,
                    'location' => $newUser->location,
                    'department' => $newUser->department,
                    'created_at' => $newUser->created_at,
                ]
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Create User Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error creating user'], 500);
        }
    }

    /**
     * Update user information
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $targetUser = User::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email,' . $id,
                'role' => 'required|in:admin,user',
                'status' => 'required|in:active,inactive',
                'password' => 'nullable|string|min:8',
            ]);

            $oldData = $targetUser->only(['name', 'email', 'role', 'status']);

            $targetUser->name = $validated['name'];
            $targetUser->email = $validated['email'];
            $targetUser->role = $validated['role'];
            $targetUser->status = $validated['status'];

            if (!empty($validated['password'])) {
                $targetUser->password = Hash::make($validated['password']);
            }

            $targetUser->save();

            // Log activity
            Log::info("User {$user->name} updated user {$targetUser->name}: " . json_encode($oldData));

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'user' => [
                    'id' => $targetUser->id,
                    'name' => $targetUser->name,
                    'email' => $targetUser->email,
                    'role' => $targetUser->role,
                    'status' => $targetUser->status,
                    'updated_at' => $targetUser->updated_at,
                ]
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Update User Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error updating user'], 500);
        }
    }

    /**
     * Delete user
     */
    public function destroy($id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        DB::beginTransaction();
        try {
            $targetUser = User::findOrFail($id);

            // Prevent deleting own account
            if ($targetUser->id === $user->id) {
                DB::rollBack();
                return response()->json(['error' => 'Cannot delete your own account'], 400);
            }

            // Prevent deleting the last admin
            $adminCount = User::where('role', 'admin')->count();
            if ($targetUser->role === 'admin' && $adminCount <= 1) {
                DB::rollBack();
                return response()->json(['error' => 'Cannot delete the last admin user'], 400);
            }

            $userName = $targetUser->name;
            $targetUserData = $targetUser->toArray();
            $targetUser->delete();

            // Create audit log
            if (class_exists(\App\Models\AuditLog::class)) {
                \App\Models\AuditLog::create([
                    'event' => 'user_deleted',
                    'user_id' => $user->id,
                    'auditable_type' => User::class,
                    'auditable_id' => $id,
                    'old_values' => $targetUserData,
                    'new_values' => [],
                    'changes' => json_encode(['status' => 'deleted']),
                ]);
            }

            // Log activity
            Log::info("User {$user->name} deleted user: {$userName}");

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Delete User Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error deleting user: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update individual user status (activate/deactivate)
     */
    public function updateStatus(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $targetUser = User::findOrFail($id);

            $validated = $request->validate([
                'status' => 'required|in:active,inactive',
            ]);

            // Prevent deactivating own account
            if ($targetUser->id === $user->id && $validated['status'] === 'inactive') {
                return response()->json(['error' => 'Cannot deactivate your own account'], 400);
            }

            $oldStatus = $targetUser->status;
            $targetUser->update(['status' => $validated['status']]);

            // Create audit log
            if (class_exists(\App\Models\AuditLog::class)) {
                \App\Models\AuditLog::create([
                    'event' => 'user_status_updated',
                    'user_id' => $user->id,
                    'auditable_type' => User::class,
                    'auditable_id' => $id,
                    'old_values' => ['status' => $oldStatus],
                    'new_values' => ['status' => $validated['status']],
                    'changes' => json_encode(['status' => "{$oldStatus} -> {$validated['status']}"]),
                ]);
            }

            // Log activity
            Log::info("User {$user->name} updated user {$targetUser->name} status from {$oldStatus} to {$validated['status']}");

            return response()->json([
                'success' => true,
                'message' => 'User status updated successfully',
                'new_status' => $validated['status']
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Update User Status Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error updating user status'], 500);
        }
    }

    /**
     * Bulk update user status
     */
    public function bulkUpdateStatus(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $validated = $request->validate([
                'user_ids' => 'required|array',
                'user_ids.*' => 'integer|exists:users,id',
                'status' => 'required|in:active,inactive',
            ]);

            // Prevent updating own status to inactive
            if (in_array($user->id, $validated['user_ids']) && $validated['status'] === 'inactive') {
                return response()->json(['error' => 'Cannot deactivate your own account'], 400);
            }

            User::whereIn('id', $validated['user_ids'])->update([
                'status' => $validated['status']
            ]);

            // Log activity
            Log::info("User {$user->name} bulk updated status to {$validated['status']} for users: " . implode(', ', $validated['user_ids']));

            return response()->json([
                'success' => true,
                'message' => 'Users updated successfully',
                'updated_count' => count($validated['user_ids'])
            ]);
        } catch (\Exception $e) {
            Log::error('Bulk Update Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error updating users'], 500);
        }
    }

    /**
     * Bulk delete users with enhanced validation and audit logging
     */
    public function bulkDelete(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $validated = $request->validate([
                'user_ids' => 'required|array|min:1|max:100',
                'user_ids.*' => 'integer|exists:users,id',
            ]);

            $userIdsToDelete = collect($validated['user_ids'])->unique()->values()->toArray();

            // Validation 1: Prevent deleting own account
            if (in_array($user->id, $userIdsToDelete)) {
                return response()->json(['error' => 'Cannot delete your own account'], 400);
            }

            // Validation 2: Prevent deleting all admins (must keep minimum 2)
            $totalAdmins = User::where('role', 'admin')->count();
            $adminsToDelete = User::whereIn('id', $userIdsToDelete)
                ->where('role', 'admin')
                ->count();
            $adminsRemaining = $totalAdmins - $adminsToDelete;

            if ($adminsRemaining < 2) {
                return response()->json([
                    'error' => 'System requires minimum 2 admin users. Cannot proceed.',
                    'current_admins' => $totalAdmins,
                    'admins_to_delete' => $adminsToDelete,
                    'admins_remaining' => $adminsRemaining
                ], 400);
            }

            // Validation 3: Get users to verify they exist
            $usersToDelete = User::whereIn('id', $userIdsToDelete)->get();

            if ($usersToDelete->count() !== count($userIdsToDelete)) {
                return response()->json(['error' => 'One or more users not found'], 404);
            }

            // Validation 4: Prevent bulk deleting all superadmins
            $superadmins = $usersToDelete->where('role', 'admin')->count();
            if ($superadmins === $totalAdmins) {
                return response()->json(['error' => 'Cannot delete all administrators in bulk operation'], 400);
            }

            $deletedNames = $usersToDelete->pluck('name')->toArray();
            $deletedEmails = $usersToDelete->pluck('email')->toArray();

            // Execute deletion in transaction
            DB::beginTransaction();
            try {
                User::whereIn('id', $userIdsToDelete)->delete();
                
                // Audit log each deletion
                foreach ($usersToDelete as $deletedUser) {
                    \App\Models\AuditLog::create([
                        'event' => 'deleted',
                        'user_id' => $user->id,
                        'auditable_type' => User::class,
                        'auditable_id' => $deletedUser->id,
                        'old_values' => $deletedUser->toArray(),
                        'new_values' => [],
                    ]);
                }
                
                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Bulk Delete Transaction Error: ' . $e->getMessage());
                return response()->json(['error' => 'Deletion failed and rolled back'], 500);
            }

            // Comprehensive audit log
            Log::warning("ADMIN ACTION: User {$user->name} (ID: {$user->id}) bulk deleted " . count($deletedNames) . " users: " . implode(', ', $deletedNames));

            return response()->json([
                'success' => true,
                'message' => 'Users deleted successfully',
                'deleted_count' => count($usersToDelete),
                'deleted_users' => $deletedNames,
                'admins_remaining' => $adminsRemaining
            ]);
        } catch (\Exception $e) {
            Log::error('Bulk Delete Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error deleting users'], 500);
        }
    }

    /**
     * Export users to CSV with streaming for better performance
     */
    public function export(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized');
        }

        try {
            // Increase execution time for export
            set_time_limit(120);

            $query = User::select('name', 'email', 'role', 'status', 'created_at');

            // Apply same filters as index
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($request->has('role') && $request->role && $request->role !== 'all') {
                $query->where('role', $request->role);
            }

            if ($request->has('status') && $request->status && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Sort by created_at descending
            $query->orderBy('created_at', 'desc');

            $filename = 'users_' . date('Y-m-d_His') . '.csv';

            // Create streaming response
            return response()->stream(function () use ($query) {
                $handle = fopen('php://output', 'w');

                // Add headers
                fputcsv($handle, ['Name', 'Email', 'Role', 'Status', 'Created At']);

                // Stream data in chunks to avoid memory issues
                $chunkSize = 500;
                $query->lazy($chunkSize)->each(function ($u) use ($handle) {
                    fputcsv($handle, [
                        $u->name,
                        $u->email,
                        $u->role === 'admin' ? 'Admin' : 'Employee',
                        $u->status === 'active' ? 'Aktif' : 'Nonaktif',
                        $u->created_at->format('Y-m-d H:i:s')
                    ]);
                });

                fclose($handle);
            }, 200, [
                'Content-Type' => 'text/csv; charset=utf-8',
                'Content-Disposition' => "attachment; filename=\"$filename\"",
                'Pragma' => 'no-cache',
                'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                'Expires' => '0',
            ]);
        } catch (\Exception $e) {
            Log::error('Export Users Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error exporting users',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset user password
     */
    public function resetPassword($id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized');
        }

        try {
            $targetUser = User::findOrFail($id);
            
            // Verify target user exists and is not admin trying to reset another admin
            if ($targetUser->role === 'admin' && $targetUser->id !== $user->id) {
                return response()->json(['error' => 'Cannot reset password for other admins'], 403);
            }
            
            // Generate temporary password
            $tempPassword = 'Temp' . rand(100000, 999999);
            $targetUser->password = Hash::make($tempPassword);
            $targetUser->force_password_change = true;
            $targetUser->save();
            
            // Send password via email (never return in API response)
            \Mail::send('emails.password-reset', ['user' => $targetUser, 'password' => $tempPassword], function ($message) use ($targetUser) {
                $message->to($targetUser->email)->subject('Your Password Has Been Reset');
            });
            
            // Audit log password reset
            \App\Models\AuditLog::create([
                'event' => 'password_reset',
                'user_id' => $user->id,
                'auditable_type' => User::class,
                'auditable_id' => $targetUser->id,
                'old_values' => [],
                'new_values' => ['password_reset' => true, 'force_change' => true],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password reset successfully. Email sent to user.',
                'note' => 'Temporary password sent via email. User must change on first login.'
            ]);
        } catch (\Exception $e) {
            Log::error('Reset Password Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error resetting password',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import users from CSV with transaction wrapping for data integrity
     */
    public function import(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized');
        }

        try {
            $request->validate([
                'file' => 'required|file|mimes:csv,txt',
            ]);

            $file = $request->file('file');
            $handle = fopen($file->getPathname(), 'r');
            
            $headers = fgetcsv($handle);
            $rowsToImport = [];
            $duplicates = 0;
            $errors = 0;
            $errorDetails = [];
            $rowNumber = 1;

            // VALIDATION PHASE: Parse and validate ALL rows BEFORE transaction
            while (($row = fgetcsv($handle)) !== false) {
                $rowNumber++;
                
                // Parse CSV row - name, email, role, phone, department, nip, location
                $name = $row[0] ?? null;
                $email = $row[1] ?? null;
                $role = $row[2] ?? 'user';
                $phone = $row[3] ?? null;
                $department = $row[4] ?? null;
                $nip = $row[5] ?? null;
                $location = $row[6] ?? null;

                if (!$name || !$email) {
                    $errors++;
                    $errorDetails[] = "Row $rowNumber: Missing name or email";
                    continue;
                }

                // Validate email format
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $errors++;
                    $errorDetails[] = "Row $rowNumber: Invalid email format";
                    continue;
                }

                // Check for duplicates in CSV
                if (collect($rowsToImport)->pluck('email')->contains($email)) {
                    $duplicates++;
                    $errorDetails[] = "Row $rowNumber: Duplicate email in CSV";
                    continue;
                }

                // Check for duplicates in database
                if (User::where('email', $email)->exists()) {
                    $duplicates++;
                    $errorDetails[] = "Row $rowNumber: Email already exists in database";
                    continue;
                }

                // Validate role
                if (!in_array($role, ['admin', 'user'])) {
                    $errors++;
                    $errorDetails[] = "Row $rowNumber: Invalid role '$role'";
                    continue;
                }

                // If validation passes, queue for import
                $rowsToImport[] = [
                    'name' => $name,
                    'email' => $email,
                    'role' => $role,
                    'phone' => $phone,
                    'department' => $department,
                    'nip' => $nip,
                    'location' => $location,
                    'row' => $rowNumber,
                ];
            }

            fclose($handle);

            // Return error if validation failed
            if ($errors > 0 || empty($rowsToImport)) {
                return response()->json([
                    'success' => false,
                    'imported' => 0,
                    'duplicates' => $duplicates,
                    'errors' => $errors,
                    'error_details' => $errorDetails,
                    'message' => "Import aborted: Validation failed. Fix errors and retry."
                ], 422);
            }

            // IMPORT PHASE: Begin transaction only after ALL validation passes
            $imported = 0;
            try {
                DB::beginTransaction();

                foreach ($rowsToImport as $rowData) {
                    $tempPassword = 'Temp' . rand(100000, 999999);
                    User::create([
                        'name' => $rowData['name'],
                        'email' => $rowData['email'],
                        'role' => $rowData['role'],
                        'status' => 'active',
                        'phone' => $rowData['phone'],
                        'department' => $rowData['department'],
                        'nip' => $rowData['nip'],
                        'location' => $rowData['location'],
                        'password' => Hash::make($tempPassword),
                        'force_password_change' => true,
                    ]);
                    $imported++;
                }

                DB::commit();
                
                // Audit log successful import
                \App\Models\AuditLog::create([
                    'event' => 'users_imported',
                    'user_id' => $user->id,
                    'auditable_type' => 'User',
                    'auditable_id' => 0,
                    'new_values' => ['imported_count' => $imported],
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('CSV Import Transaction Error: ' . $e->getMessage());
                return response()->json([
                    'success' => false,
                    'message' => 'Import failed and rolled back. ' . $e->getMessage(),
                    'error_details' => [$e->getMessage()]
                ], 500);
            }

            return response()->json([
                'success' => true,
                'imported' => $imported,
                'duplicates' => $duplicates,
                'errors' => $errors,
                'error_details' => $errorDetails,
                'message' => "Import completed successfully: $imported users imported, $duplicates duplicates skipped"
            ]);
        } catch (\Exception $e) {
            Log::error('Import Users Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error importing users',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user statistics (API endpoint)
     */
    public function getStats()
    {
        try {
            $stats = [
                'total_users' => User::count(),
                'active_users' => User::where('status', 'active')->count(),
                'inactive_users' => User::where('status', 'inactive')->count(),
                'admin_users' => User::where('role', 'admin')->count(),
                'new_this_month' => User::where('created_at', '>=', now()->startOfMonth())->count(),
            ];

            return response()->json($stats);
        } catch (\Exception $e) {
            Log::error('Get User Stats Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to get statistics'], 500);
        }
    }

    /**
     * Get user program history (API endpoint)
     */
    public function getProgramHistory($userId)
    {
        try {
            $user = User::findOrFail($userId);

            $history = DB::table('user_trainings as ut')
                ->join('training_programs as tp', 'ut.training_program_id', '=', 'tp.id')
                ->leftJoin('user_exam_answers as uea', 'ut.user_id', '=', 'uea.user_id')
                ->where('ut.user_id', $userId)
                ->where('ut.status', 'completed')
                ->select(
                    'tp.id',
                    'tp.name',
                    'ut.final_score as score',
                    DB::raw('100 as max_score'),
                    DB::raw('COALESCE(TIMESTAMPDIFF(MINUTE, ut.created_at, ut.updated_at), 0) as time_spent'),
                    'ut.completed_at',
                    DB::raw('COALESCE(SUM(CASE WHEN uea.is_correct = 1 THEN 1 ELSE 0 END), 0) as correct'),
                    DB::raw('COALESCE(SUM(CASE WHEN uea.is_correct = 0 THEN 1 ELSE 0 END), 0) as incorrect'),
                    DB::raw('COALESCE(COUNT(DISTINCT uea.id), 0) as total_questions')
                )
                ->groupBy('ut.id', 'tp.id', 'tp.name', 'ut.final_score', 'ut.completed_at', 'ut.created_at', 'ut.updated_at')
                ->orderBy('ut.completed_at', 'desc')
                ->get();

            return response()->json($history);
        } catch (\Exception $e) {
            Log::error('Get Program History Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to get program history'], 500);
        }
    }

    /**
     * Get enrollment history with detailed statistics
     */
    public function getEnrollmentHistory(Request $request)
    {
        try {
            $query = DB::table('user_trainings as ut')
                ->join('users as u', 'u.id', '=', 'ut.user_id')
                ->join('modules as m', 'm.id', '=', 'ut.module_id')
                ->select(
                    'ut.id',
                    'ut.user_id',
                    'u.name as user_name',
                    'u.email as user_email',
                    'm.id as module_id',
                    'm.title as module_title',
                    'ut.status',
                    'ut.final_score',
                    'ut.is_certified',
                    'ut.enrolled_at',
                    'ut.completed_at',
                    'ut.created_at'
                );

            // Filter by user name/email
            if ($request->has('searchUser') && $request->searchUser) {
                $search = $request->searchUser;
                $query->where(function ($q) use ($search) {
                    $q->where('u.name', 'like', "%{$search}%")
                      ->orWhere('u.email', 'like', "%{$search}%");
                });
            }

            // Filter by status
            if ($request->has('filterStatus') && $request->filterStatus && $request->filterStatus !== 'all') {
                $query->where('ut.status', $request->filterStatus);
            }

            // Date range filter
            if ($request->has('dateFrom') && $request->dateFrom) {
                $query->whereDate('ut.enrolled_at', '>=', $request->dateFrom);
            }
            if ($request->has('dateTo') && $request->dateTo) {
                $query->whereDate('ut.enrolled_at', '<=', $request->dateTo);
            }

            // Sort by enrolled date descending by default
            $query->orderBy('ut.enrolled_at', 'desc');

            // Get paginated results
            $perPage = $request->get('perPage', 20);
            $enrollments = $query->paginate($perPage);

            // Calculate statistics
            $allStats = DB::table('user_trainings')->select(
                DB::raw('COUNT(*) as total_enrollments'),
                DB::raw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed"),
                DB::raw("SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress"),
                DB::raw("SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed"),
                DB::raw("SUM(CASE WHEN status = 'enrolled' THEN 1 ELSE 0 END) as enrolled"),
                DB::raw("COUNT(DISTINCT CASE WHEN is_certified = 1 THEN user_id END) as certified_users"),
                DB::raw('AVG(CASE WHEN final_score IS NOT NULL THEN final_score ELSE NULL END) as avg_score')
            )->first();

            $stats = [
                'total_enrollments' => $allStats->total_enrollments ?? 0,
                'completed' => $allStats->completed ?? 0,
                'in_progress' => $allStats->in_progress ?? 0,
                'failed' => $allStats->failed ?? 0,
                'enrolled' => $allStats->enrolled ?? 0,
                'completion_rate' => $allStats->total_enrollments > 0 ? round(($allStats->completed / $allStats->total_enrollments) * 100, 1) : 0,
                'certified_users' => $allStats->certified_users ?? 0,
                'avg_score' => $allStats->avg_score ? round($allStats->avg_score, 2) : 0
            ];

            return response()->json([
                'enrollments' => $enrollments->items(),
                'stats' => $stats,
                'pagination' => [
                    'current_page' => $enrollments->currentPage(),
                    'total' => $enrollments->total(),
                    'per_page' => $enrollments->perPage(),
                    'last_page' => $enrollments->lastPage()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get Enrollment History Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to get enrollment history'], 500);
        }
    }
}
