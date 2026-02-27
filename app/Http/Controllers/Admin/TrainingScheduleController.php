<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TrainingSchedule;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class TrainingScheduleController extends Controller
{
    /**
     * Get all training schedules
     */
    public function index(Request $request)
    {
        $this->authorize('view-schedules');
        $schedules = TrainingSchedule::query()
            ->with('program')
            ->when($request->input('status'), function ($q, $status) {
                return $q->where('status', $status);
            })
            ->when($request->input('from_date'), function ($q, $date) {
                return $q->where('date', '>=', $date);
            })
            ->when($request->input('to_date'), function ($q, $date) {
                return $q->where('date', '<=', $date);
            })
            ->orderBy('date', 'asc')
            ->get();
            // Note: trainer_ids is automatically decoded by Model's $casts

        return response()->json([
            'data' => $schedules,
            'total' => $schedules->count(),
        ]);
    }

    /**
     * Store a new training schedule
     */
    public function store(Request $request)
    {
        $this->authorize('create-schedules');
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'date' => 'required|date',
                'start_time' => 'nullable|date_format:H:i',
                'end_time' => 'nullable|date_format:H:i',
                'location' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'program_id' => 'nullable|exists:modules,id',
                'type' => 'nullable|in:training,deadline,reminder,event',
                'capacity' => 'nullable|integer|min:0',
                'status' => 'nullable|in:scheduled,ongoing,completed,cancelled',
                'trainer_ids' => 'nullable|array',
                'trainer_ids.*' => 'nullable|exists:users,id',
            ]);

            // Convert trainer_ids array to JSON for storage
            if (isset($validated['trainer_ids'])) {
                $validated['trainer_ids'] = json_encode($validated['trainer_ids']);
            }

            $schedule = TrainingSchedule::create($validated);
            // Note: trainer_ids is automatically decoded by Model's $casts
            
            // Clear user calendar cache so updates appear immediately
            Cache::forget('training-schedules-all');

            return response()->json([
                'message' => 'Jadwal pelatihan berhasil dibuat',
                'data' => $schedule->load('program'),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error creating training schedule: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal membuat jadwal pelatihan',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a specific training schedule
     */
    public function show(TrainingSchedule $trainingSchedule)
    {
        // Note: trainer_ids is automatically decoded by Model's $casts
        return response()->json([
            'data' => $trainingSchedule->load('program'),
        ]);
    }

    /**
     * Update a training schedule
     */
    public function update(Request $request, TrainingSchedule $trainingSchedule)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'date' => 'required|date',
                'start_time' => 'nullable|date_format:H:i',
                'end_time' => 'nullable|date_format:H:i',
                'location' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'program_id' => 'nullable|exists:modules,id',
                'type' => 'nullable|in:training,deadline,reminder,event',
                'capacity' => 'nullable|integer|min:0',
                'enrolled' => 'nullable|integer|min:0',
                'status' => 'nullable|in:scheduled,ongoing,completed,cancelled',
                'trainer_ids' => 'nullable|array',
                'trainer_ids.*' => 'nullable|exists:users,id',
            ]);

            // Convert trainer_ids array to JSON for storage
            if (isset($validated['trainer_ids'])) {
                $validated['trainer_ids'] = json_encode($validated['trainer_ids']);
            }

            $trainingSchedule->update($validated);
            // Note: trainer_ids is automatically decoded by Model's $casts
            
            // Clear user calendar cache so updates appear immediately
            Cache::forget('training-schedules-all');

            return response()->json([
                'message' => 'Jadwal pelatihan berhasil diperbarui',
                'data' => $trainingSchedule->load('program'),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error updating schedule: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal memperbarui jadwal pelatihan',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a training schedule
     */
    public function destroy(TrainingSchedule $trainingSchedule)
    {
        try {
            $trainingSchedule->delete();
            
            // Clear user calendar cache so updates appear immediately
            Cache::forget('training-schedules-all');

            return response()->json([
                'message' => 'Jadwal pelatihan berhasil dihapus',
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error deleting schedule: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal menghapus jadwal pelatihan',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get upcoming schedules (next 30 days)
     */
    public function upcoming()
    {
        $schedules = TrainingSchedule::query()
            ->where('date', '>=', now())
            ->where('date', '<=', now()->addDays(30))
            ->where('status', '!=', 'cancelled')
            ->with('program')
            ->orderBy('date', 'asc')
            ->get();
            // Note: trainer_ids is automatically decoded by Model's $casts

        return response()->json([
            'data' => $schedules,
            'total' => $schedules->count(),
        ]);
    }

    /**
     * Get statistics for dashboard with date range filtering
     * Query parameters: dateFrom (Y-m-d), dateTo (Y-m-d), status (optional)
     */
    public function statistics(Request $request)
    {
        // Validate and parse date filters
        $dateFrom = $request->query('dateFrom') ? Carbon::createFromFormat('Y-m-d', $request->query('dateFrom'))->startOfDay() : now()->subDays(30);
        $dateTo = $request->query('dateTo') ? Carbon::createFromFormat('Y-m-d', $request->query('dateTo'))->endOfDay() : now();
        $statusFilter = $request->query('status');
        
        // Ensure dateFrom <= dateTo
        if ($dateFrom > $dateTo) {
            return response()->json(['error' => 'Invalid date range'], 422);
        }
        
        // Base query with date range filter
        $baseQuery = TrainingSchedule::whereBetween('date', [$dateFrom, $dateTo]);
        
        // Add status filter if provided
        if ($statusFilter && in_array($statusFilter, ['scheduled', 'ongoing', 'completed', 'cancelled'])) {
            $baseQuery = $baseQuery->where('status', $statusFilter);
        }
        
        // Build statistics response with caching (300s TTL for volatile data)
        $cacheKey = "training_stats_{$dateFrom->format('Y-m-d')}_{$dateTo->format('Y-m-d')}_{$statusFilter}";
        
        $stats = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($dateFrom, $dateTo, $statusFilter, $baseQuery) {
            $today = now()->toDateString();
            
            return [
                'total_scheduled' => (clone $baseQuery)->count(),
                'upcoming_7days' => (clone $baseQuery)
                    ->where('date', '>=', now())
                    ->where('date', '<=', now()->addDays(7))
                    ->where('status', '!=', 'cancelled')
                    ->count(),
                'today' => (clone $baseQuery)->where('date', $today)->count(),
                'by_status' => [
                    'scheduled' => (clone $baseQuery)->where('status', 'scheduled')->count(),
                    'ongoing' => (clone $baseQuery)->where('status', 'ongoing')->count(),
                    'completed' => (clone $baseQuery)->where('status', 'completed')->count(),
                    'cancelled' => (clone $baseQuery)->where('status', 'cancelled')->count(),
                ],
                'date_range' => [
                    'from' => $dateFrom->format('Y-m-d'),
                    'to' => $dateTo->format('Y-m-d')
                ]
            ];
        });
        
        return response()->json($stats);
    }

    /**
     * Get instructors (users) and departments for schedule form
     */
    public function getInstructors()
    {
        $users = \App\Models\User::select('id', 'name', 'email', 'department_id')
            ->with('department:id,name')
            ->orderBy('name', 'asc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'department' => $user->department?->name ?? 'No Department',
                    'avatar' => strtoupper(substr($user->name, 0, 2)),
                ];
            });

        $departments = \App\Models\Department::select('id', 'name')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'users' => $users,
            'departments' => $departments,
        ]);
    }

    /**
     * Diagnostic endpoint to check training schedule data
     */
    public function diagnostic()
    {
        try {
            $totalSchedules = TrainingSchedule::count();
            $activeSchedules = TrainingSchedule::where('status', 'active')->count();
            $completedSchedules = TrainingSchedule::where('status', 'completed')->count();
            $cancelledSchedules = TrainingSchedule::where('status', 'cancelled')->count();
            
            $schedulesWithoutInstructors = TrainingSchedule::whereNull('instructor_id')->count();
            $schedulesWithoutParticipants = TrainingSchedule::withCount('participants')
                ->having('participants_count', '=', 0)
                ->count();
            
            $recentSchedules = TrainingSchedule::with('program', 'participants')
                ->latest('created_at')
                ->limit(10)
                ->get();
            
            $upcomingSchedules = TrainingSchedule::where('start_date', '>', now())
                ->where('status', 'active')
                ->orderBy('start_date')
                ->limit(5)
                ->get();
            
            $modules = \App\Models\Module::where('approval_status', 'approved')
                ->where('is_active', true)
                ->count();

            return response()->json([
                'total_schedules' => $totalSchedules,
                'status_breakdown' => [
                    'active' => $activeSchedules,
                    'completed' => $completedSchedules,
                    'cancelled' => $cancelledSchedules,
                ],
                'diagnostics' => [
                    'missing_instructors' => $schedulesWithoutInstructors,
                    'empty_schedules' => $schedulesWithoutParticipants,
                ],
                'total_approved_modules' => $modules,
                'recent_schedules' => $recentSchedules,
                'upcoming_schedules' => $upcomingSchedules,
                'database_status' => 'OK',
                'timestamp' => now(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Diagnostic failed: ' . $e->getMessage(),
                'database_status' => 'ERROR'
            ], 500);
        }
    }
}
