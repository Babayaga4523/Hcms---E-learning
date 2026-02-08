<?php

namespace App\Http\Controllers\Admin;

use App\Models\TrainingSchedule;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as BaseController;

class TrainingScheduleController extends BaseController
{
    /**
     * Get all training schedules
     */
    public function index(Request $request)
    {
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
     * Get statistics for dashboard
     */
    public function statistics()
    {
        $today = now()->toDateString();
        
        return response()->json([
            'total_scheduled' => TrainingSchedule::count(),
            'upcoming_7days' => TrainingSchedule::where('date', '>=', now())
                ->where('date', '<=', now()->addDays(7))
                ->where('status', '!=', 'cancelled')
                ->count(),
            'today' => TrainingSchedule::where('date', $today)->count(),
            'by_status' => [
                'scheduled' => TrainingSchedule::where('status', 'scheduled')->count(),
                'ongoing' => TrainingSchedule::where('status', 'ongoing')->count(),
                'completed' => TrainingSchedule::where('status', 'completed')->count(),
                'cancelled' => TrainingSchedule::where('status', 'cancelled')->count(),
            ],
        ]);
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
        $totalSchedules = TrainingSchedule::count();
        $recentSchedules = TrainingSchedule::with('program')
            ->latest('created_at')
            ->limit(10)
            ->get();
            // Note: trainer_ids is automatically decoded by Model's $casts
        $modules = \App\Models\Module::where('approval_status', 'approved')
            ->where('is_active', true)
            ->count();

        return response()->json([
            'total_schedules' => $totalSchedules,
            'total_approved_modules' => $modules,
            'recent_schedules' => $recentSchedules,
            'database_status' => 'OK',
        ]);
    }
}
