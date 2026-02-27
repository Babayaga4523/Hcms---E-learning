<?php

namespace App\Http\Controllers\Api;

use App\Models\Enrollment;
use App\Models\ModuleAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Enrollment Conflict API Controller
 * Identifies schedule conflicts, duplicate enrollments, and enrollment issues
 */
class EnrollmentConflictController
{
    /**
     * Get enrollment conflicts with request validation
     * GET /api/admin/enrollments/conflicts
     */
    public function conflicts(Request $request)
    {
        try {
            $validated = $request->validate([
                'days_overdue' => 'sometimes|integer|min:1|max:365',
                'limit' => 'sometimes|integer|min:10|max:200',
            ]);

            $daysOverdue = $validated['days_overdue'] ?? 7;
            $limit = $validated['limit'] ?? 50;

            $conflicts = [
                'duplicate_enrollments' => $this->getDuplicateEnrollments($limit),
                'overdue_enrollments' => $this->getOverdueEnrollments($daysOverdue, $limit),
                'conflicting_assignments' => $this->getConflictingAssignments($limit),
                'summary' => $this->getConflictSummary(),
            ];

            return response()->json([
                'status' => 'success',
                'data' => $conflicts,
                'timestamp' => now(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch enrollment conflicts',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get duplicate enrollments (same user in same program)
     */
    private function getDuplicateEnrollments($limit = 50)
    {
        return Enrollment::select('user_id', 'module_id', DB::raw('count(*) as count'))
            ->groupBy('user_id', 'module_id')
            ->havingRaw('count(*) > 1')
            ->with(['user:id,name,email', 'module:id,title'])
            ->limit($limit)
            ->get()
            ->map(function ($conflict) {
                return [
                    'user_id' => $conflict->user_id,
                    'user_name' => $conflict->user->name ?? 'Unknown',
                    'user_email' => $conflict->user->email ?? '',
                    'module_id' => $conflict->module_id,
                    'module_title' => $conflict->module->title ?? 'Unknown',
                    'duplicate_count' => $conflict->count,
                    'conflict_type' => 'duplicate_enrollment',
                    'severity' => 'high',
                ];
            })
            ->values();
    }

    /**
     * Get schedule conflicts using actual module start/end dates
     * Detects overlapping module assignments for same user
     */
    private function getScheduleConflicts($limit = 50)
    {
        // Use database-native overlap detection based on module schedules
        $conflicts = DB::table('enrollments as e1')
            ->select('e1.user_id', 
                DB::raw('u.name as user_name'),
                DB::raw('u.email as user_email'),
                DB::raw('e1.id as enrollment_1'),
                DB::raw('e2.id as enrollment_2'),
                DB::raw('m1.title as module_1'),
                DB::raw('m2.title as module_2'),
                DB::raw('m1.start_date as module_1_start'),
                DB::raw('m1.end_date as module_1_end'),
                DB::raw('m2.start_date as module_2_start'),
                DB::raw('m2.end_date as module_2_end'),
                DB::raw('"schedule_overlap" as conflict_type'),
                DB::raw('"medium" as severity')
            )
            ->join('enrollments as e2', function ($join) {
                $join->on('e1.user_id', '=', 'e2.user_id')
                    ->whereRaw('e1.id < e2.id'); // Prevent duplicates
            })
            ->join('modules as m1', 'e1.module_id', '=', 'm1.id')
            ->join('modules as m2', 'e2.module_id', '=', 'm2.id')
            ->leftJoin('users as u', 'e1.user_id', '=', 'u.id')
            ->where('e1.status', 'active')
            ->where('e2.status', 'active')
            // Check for actual schedule overlap
            ->whereRaw('m1.start_date IS NOT NULL AND m2.start_date IS NOT NULL')
            ->whereRaw('(m1.start_date <= COALESCE(m2.end_date, m2.start_date) AND COALESCE(m1.end_date, m1.start_date) >= m2.start_date)')
            ->limit($limit)
            ->get();

        return $conflicts->map(function ($conflict) {
            return [
                'user_id' => $conflict->user_id,
                'user_name' => $conflict->user_name ?? 'Unknown',
                'user_email' => $conflict->user_email ?? '',
                'enrollment_1' => [
                    'id' => $conflict->enrollment_1,
                    'module' => $conflict->module_1 ?? 'Unknown',
                    'start_date' => $conflict->module_1_start,
                    'end_date' => $conflict->module_1_end,
                ],
                'enrollment_2' => [
                    'id' => $conflict->enrollment_2,
                    'module' => $conflict->module_2 ?? 'Unknown',
                    'start_date' => $conflict->module_2_start,
                    'end_date' => $conflict->module_2_end,
                ],
                'conflict_type' => 'schedule_overlap',
                'severity' => 'medium',
            ];
        })->values();
    }

    /**
     * Get overdue enrollments (past due_date)
     */
    private function getOverdueEnrollments($daysOverdue = 7, $limit = 50)
    {
        $overdueDate = now()->subDays($daysOverdue);
        
        return ModuleAssignment::where('due_date', '<', $overdueDate)
            ->where('status', '!=', 'completed')
            ->with(['user:id,name,email', 'module:id,title'])
            ->orderBy('due_date', 'asc')
            ->limit($limit)
            ->get()
            ->map(function ($assignment) {
                $daysOverdue = now()->diffInDays($assignment->due_date, false);

                return [
                    'assignment_id' => $assignment->id,
                    'user_id' => $assignment->user_id,
                    'user_name' => $assignment->user->name ?? 'Unknown',
                    'user_email' => $assignment->user->email ?? '',
                    'module_id' => $assignment->module_id,
                    'module_title' => $assignment->module->title ?? 'Unknown',
                    'due_date' => $assignment->due_date->format('Y-m-d'),
                    'days_overdue' => $daysOverdue,
                    'status' => $assignment->status,
                    'conflict_type' => 'overdue_enrollment',
                    'severity' => $daysOverdue > 30 ? 'high' : ($daysOverdue > 14 ? 'medium' : 'low'),
                ];
            });
    }

    /**
     * Get conflicting module assignments (overlapping assignments to same user)
     */
    private function getConflictingAssignments($limit = 50)
    {
        return ModuleAssignment::select('user_id', DB::raw('count(*) as active_assignments'))
            ->where('status', 'active')
            ->groupBy('user_id')
            ->havingRaw('count(*) > 5')
            ->with(['user:id,name,email'])
            ->limit($limit)
            ->get()
            ->map(function ($conflict) {
                $assignments = ModuleAssignment::where('user_id', $conflict->user_id)
                    ->where('status', 'active')
                    ->with('module:id,title')
                    ->get();

                return [
                    'user_id' => $conflict->user_id,
                    'user_name' => $conflict->user->name ?? 'Unknown',
                    'active_assignments' => $conflict->active_assignments,
                    'modules' => $assignments->map(function ($a) {
                        return [
                            'id' => $a->module_id,
                            'title' => $a->module->title ?? 'Unknown',
                            'due_date' => $a->due_date?->format('Y-m-d'),
                        ];
                    })->values(),
                    'conflict_type' => 'too_many_assignments',
                    'severity' => 'medium',
                ];
            })
            ->values();
    }

    /**
     * Get conflict summary statistics
     */
    private function getConflictSummary()
    {
        return [
            'total_duplicate_enrollments' => Enrollment::select('user_id', 'module_id')
                ->groupBy('user_id', 'module_id')
                ->havingRaw('count(*) > 1')
                ->count(),
            'users_with_conflicts' => Enrollment::select('user_id')
                ->groupBy('user_id')
                ->havingRaw('count(*) > 1')
                ->count(),
            'overdue_assignments' => ModuleAssignment::where('due_date', '<', now())
                ->where('status', '!=', 'completed')
                ->count(),
            'users_overloaded' => ModuleAssignment::select('user_id')
                ->where('status', 'active')
                ->groupBy('user_id')
                ->havingRaw('count(*) > 5')
                ->count(),
        ];
    }
}
