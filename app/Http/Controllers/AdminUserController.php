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
            $query = User::select('id', 'name', 'email', 'role', 'status', 'phone', 'department', 'created_at', 'updated_at', 'last_login_at');

            // Search functionality
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
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

            // Pagination
            $users = $query->paginate(15);

            // Get statistics
            $stats = [
                'total_users' => User::count(),
                'active_users' => User::where('status', 'active')->count(),
                'inactive_users' => User::where('status', 'inactive')->count(),
                'admin_users' => User::where('role', 'admin')->count(),
                'employee_users' => User::where('role', 'user')->count(),
            ];

            return Inertia::render('Admin/UserManagement', [
                'users' => $users,
                'stats' => $stats,
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
    public function detail($id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized');
        }

        try {
            $targetUser = User::with(['trainings.module'])->findOrFail($id);

            // Get training statistics
            $trainings = $targetUser->trainings ?? collect([]);
            $completedCount = $trainings->where('status', 'completed')->count();
            $inProgressCount = $trainings->where('status', 'in_progress')->count();
            $certifiedCount = $trainings->where('is_certified', true)->count();

            // Calculate completion rate
            $completionRate = $trainings->count() > 0
                ? round(($completedCount / $trainings->count()) * 100, 2)
                : 0;

            // Get training details
            $trainingDetails = $trainings->map(fn($training) => [
                'id' => $training->id,
                'module_title' => $training->module?->title ?? 'N/A',
                'status' => $training->status,
                'enrolled_at' => $training->enrolled_at,
                'is_certified' => $training->is_certified,
            ])->toArray();

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
                    'total_trainings' => $trainings->count(),
                    'completed' => $completedCount,
                    'in_progress' => $inProgressCount,
                    'certified' => $certifiedCount,
                    'completion_rate' => $completionRate,
                ],
                'trainings' => $trainingDetails,
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
            ]);

            $newUser = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'status' => $validated['status'],
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

        try {
            $targetUser = User::findOrFail($id);

            // Prevent deleting own account
            if ($targetUser->id === $user->id) {
                return response()->json(['error' => 'Cannot delete your own account'], 400);
            }

            // Prevent deleting the last admin
            $adminCount = User::where('role', 'admin')->count();
            if ($targetUser->role === 'admin' && $adminCount <= 1) {
                return response()->json(['error' => 'Cannot delete the last admin user'], 400);
            }

            $userName = $targetUser->name;
            $targetUser->delete();

            // Log activity
            Log::info("User {$user->name} deleted user: {$userName}");

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Delete User Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error deleting user'], 500);
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
     * Bulk delete users
     */
    public function bulkDelete(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $validated = $request->validate([
                'user_ids' => 'required|array',
                'user_ids.*' => 'integer|exists:users,id',
            ]);

            // Prevent deleting own account
            if (in_array($user->id, $validated['user_ids'])) {
                return response()->json(['error' => 'Cannot delete your own account'], 400);
            }

            // Prevent deleting all admins
            $adminCount = User::where('role', 'admin')->count();
            $adminToDelete = User::whereIn('id', $validated['user_ids'])
                ->where('role', 'admin')
                ->count();

            if ($adminCount - $adminToDelete < 1) {
                return response()->json(['error' => 'Cannot delete all admin users'], 400);
            }

            $deletedUsers = User::whereIn('id', $validated['user_ids'])->pluck('name');
            User::whereIn('id', $validated['user_ids'])->delete();

            // Log activity
            Log::info("User {$user->name} bulk deleted users: " . $deletedUsers->implode(', '));

            return response()->json([
                'success' => true,
                'message' => 'Users deleted successfully',
                'deleted_count' => count($validated['user_ids'])
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
            
            // Generate temporary password
            $tempPassword = 'Temp' . rand(100000, 999999);
            $targetUser->password = Hash::make($tempPassword);
            $targetUser->save();

            return response()->json([
                'success' => true,
                'message' => 'Password reset successfully',
                'temp_password' => $tempPassword,
                'note' => 'Password: ' . $tempPassword . ' (User harus ubah di login pertama)'
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
     * Import users from CSV
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
            $imported = 0;
            $duplicates = 0;
            $errors = 0;
            $errorDetails = [];

            while (($row = fgetcsv($handle)) !== false) {
                try {
                    // Parse CSV row
                    $name = $row[0] ?? null;
                    $email = $row[1] ?? null;
                    $role = $row[2] ?? 'user';
                    $phone = $row[3] ?? null;
                    $department = $row[4] ?? null;

                    if (!$name || !$email) {
                        $errors++;
                        $errorDetails[] = "Row " . ($imported + $duplicates + $errors) . ": Missing name or email";
                        continue;
                    }

                    // Check for duplicates
                    $exists = User::where('email', $email)->first();
                    if ($exists) {
                        $duplicates++;
                        continue;
                    }

                    // Create user
                    $tempPassword = 'Temp' . rand(100000, 999999);
                    User::create([
                        'name' => $name,
                        'email' => $email,
                        'role' => in_array($role, ['admin', 'user']) ? $role : 'user',
                        'status' => 'active',
                        'phone' => $phone,
                        'department' => $department,
                        'password' => Hash::make($tempPassword),
                    ]);

                    $imported++;
                } catch (\Exception $e) {
                    $errors++;
                    $errorDetails[] = "Row " . ($imported + $duplicates + $errors) . ": " . $e->getMessage();
                }
            }

            fclose($handle);

            return response()->json([
                'success' => true,
                'imported' => $imported,
                'duplicates' => $duplicates,
                'errors' => $errors,
                'error_details' => $errorDetails,
                'message' => "Import completed: $imported imported, $duplicates duplicates skipped, $errors errors"
            ]);
        } catch (\Exception $e) {
            Log::error('Import Users Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error importing users',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
