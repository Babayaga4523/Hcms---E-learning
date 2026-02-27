<?php

namespace App\Http\Controllers\Api;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Arr;
use Carbon\Carbon;

/**
 * Audit API Controller
 * Provides system change log and user activity audit trail
 */
class AuditController
{
    /**
     * Get audit changes log
     * GET /api/admin/audit/changes
     */
    public function changes(Request $request)
    {
        try {
            $validated = $request->validate([
                'user_id' => 'sometimes|integer',
                'action' => 'sometimes|string|max:50',
                'model_type' => 'sometimes|string|max:100',
                'start_date' => 'sometimes|date',
                'end_date' => 'sometimes|date|after_or_equal:start_date',
                'per_page' => 'sometimes|integer|min:10|max:100',
            ]);

            $perPage = min($validated['per_page'] ?? 50, 100);

            $query = AuditLog::with(['user:id,name,email', 'causer:id,name,email']);

            // Apply filters
            if (!empty($validated['user_id'])) {
                $query->where('user_id', $validated['user_id']);
            }

            if (!empty($validated['action'])) {
                $query->where('event', $validated['action']);
            }

            if (!empty($validated['model_type'])) {
                $query->where('auditable_type', $validated['model_type']);
            }

            if (!empty($validated['start_date'])) {
                $query->where('created_at', '>=', Carbon::parse($validated['start_date'])->startOfDay());
            }

            if (!empty($validated['end_date'])) {
                $query->where('created_at', '<=', Carbon::parse($validated['end_date'])->endOfDay());
            }

            $changes = $query->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => $changes->items(),
                'pagination' => [
                    'total' => $changes->total(),
                    'per_page' => $changes->perPage(),
                    'current_page' => $changes->currentPage(),
                    'last_page' => $changes->lastPage(),
                ],
                'timestamp' => now(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch audit changes',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get user activity log with per_page limit
     * GET /api/admin/audit/user-activity/{userId}
     */
    public function userActivity($userId, Request $request)
    {
        try {
            $validated = $request->validate([
                'per_page' => 'sometimes|integer|min:10|max:100',
            ]);

            $user = User::findOrFail($userId);
            $perPage = min($validated['per_page'] ?? 50, 100);

            $activity = AuditLog::where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'data' => $activity->items(),
                'pagination' => [
                    'total' => $activity->total(),
                    'per_page' => $activity->perPage(),
                    'current_page' => $activity->currentPage(),
                    'last_page' => $activity->lastPage(),
                ],
                'timestamp' => now(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch user activity',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get audit statistics
     * GET /api/admin/audit/statistics
     */
    public function statistics(Request $request)
    {
        try {
            $startDate = $request->input('start_date', now()->subMonth());
            $endDate = $request->input('end_date', now());

            $stats = [
                'total_changes' => $this->getTotalChanges($startDate, $endDate),
                'changes_by_event' => $this->getChangesByEvent($startDate, $endDate),
                'changes_by_model' => $this->getChangesByModel($startDate, $endDate),
                'top_users' => $this->getTopUsers($startDate, $endDate),
                'daily_activity' => $this->getDailyActivity($startDate, $endDate),
                'change_summary' => $this->getChangeSummary($startDate, $endDate),
            ];

            return response()->json([
                'status' => 'success',
                'data' => $stats,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'timestamp' => now(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch audit statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get total changes in period
     */
    private function getTotalChanges($startDate, $endDate)
    {
        return AuditLog::whereBetween('created_at', [
            Carbon::parse($startDate)->startOfDay(),
            Carbon::parse($endDate)->endOfDay(),
        ])->count();
    }

    /**
     * Get changes grouped by event type
     */
    private function getChangesByEvent($startDate, $endDate)
    {
        return AuditLog::select('event', DB::raw('count(*) as count'))
            ->whereBetween('created_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ])
            ->groupBy('event')
            ->get()
            ->map(function ($item) {
                return [
                    'event' => $item->event,
                    'count' => $item->count,
                ];
            });
    }

    /**
     * Get changes grouped by model type
     */
    private function getChangesByModel($startDate, $endDate)
    {
        return AuditLog::select('auditable_type', DB::raw('count(*) as count'))
            ->whereBetween('created_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ])
            ->groupBy('auditable_type')
            ->get()
            ->map(function ($item) {
                return [
                    'model_type' => class_basename($item->auditable_type),
                    'count' => $item->count,
                ];
            });
    }

    /**
     * Get top users by changes made
     */
    private function getTopUsers($startDate, $endDate, $limit = 10)
    {
        return AuditLog::select('user_id')
            ->selectRaw('count(*) as changes_count')
            ->with('user:id,name,email')
            ->whereBetween('created_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ])
            ->groupBy('user_id')
            ->orderByDesc('changes_count')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'user_id' => $item->user_id,
                    'user_name' => $item->user?->name ?? 'Unknown',
                    'user_email' => $item->user?->email ?? 'Unknown',
                    'changes_count' => $item->changes_count,
                ];
            });
    }

    /**
     * Get daily activity trend
     */
    private function getDailyActivity($startDate, $endDate)
    {
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        $activities = AuditLog::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        return $activities->map(function ($item) {
            return [
                'date' => $item->date,
                'count' => $item->count,
            ];
        });
    }

    /**
     * Get change summary
     */
    private function getChangeSummary($startDate, $endDate)
    {
        $events = AuditLog::select('event', DB::raw('count(*) as count'))
            ->whereBetween('created_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ])
            ->groupBy('event')
            ->pluck('count', 'event')
            ->toArray();

        return [
            'created_count' => $events['created'] ?? 0,
            'updated_count' => $events['updated'] ?? 0,
            'deleted_count' => $events['deleted'] ?? 0,
            'other_count' => array_sum($events) - (($events['created'] ?? 0) + ($events['updated'] ?? 0) + ($events['deleted'] ?? 0)),
        ];
    }

    /**
     * Export audit log with proper CSV escaping
     * GET /api/admin/audit/export
     */
    public function export(Request $request)
    {
        try {
            $validated = $request->validate([
                'format' => 'sometimes|in:csv,json',
                'per_page' => 'sometimes|integer|min:10|max:10000',
                'user_id' => 'sometimes|integer',
                'action' => 'sometimes|string|max:50',
                'model_type' => 'sometimes|string|max:100',
                'start_date' => 'sometimes|date',
                'end_date' => 'sometimes|date|after_or_equal:start_date',
            ]);

            $format = $validated['format'] ?? 'csv';
            $perPage = $validated['per_page'] ?? 1000;
            $filters = Arr::only($validated, ['user_id', 'action', 'model_type', 'start_date', 'end_date']);

            $query = AuditLog::with(['user:id,name,email', 'causer:id,name,email']);

            // Apply filters
            if (!empty($filters['user_id'])) {
                $query->where('user_id', $filters['user_id']);
            }

            if (!empty($filters['action'])) {
                $query->where('event', $filters['action']);
            }

            if (!empty($filters['model_type'])) {
                $query->where('auditable_type', $filters['model_type']);
            }

            if (!empty($filters['start_date'])) {
                $query->where('created_at', '>=', Carbon::parse($filters['start_date'])->startOfDay());
            }

            if (!empty($filters['end_date'])) {
                $query->where('created_at', '<=', Carbon::parse($filters['end_date'])->endOfDay());
            }

            $data = $query->orderBy('created_at', 'desc')->limit($perPage)->get();

            if ($format === 'json') {
                return response()->json([
                    'status' => 'success',
                    'format' => 'json',
                    'data' => $data,
                ]);
            }

            // CSV format with proper escaping
            $csv = $this->generateCSV($data);

            return response($csv, 200, [
                'Content-Type' => 'text/csv; charset=utf-8',
                'Content-Disposition' => 'attachment; filename="audit-log-' . now()->format('Y-m-d-His') . '.csv"',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to export audit log',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate properly escaped CSV from audit logs
     */
    private function generateCSV($data)
    {
        $csv = "ID,Event,Model Type,User ID,User Name,Changes,Created At\n";
        
        foreach ($data as $log) {
            $row = [
                $log->id,
                $log->event,
                $log->auditable_type,
                $log->user_id,
                $log->user?->name ?? '',
                json_encode($log->new_values ?? []),
                $log->created_at,
            ];
            
            // Properly escape CSV fields
            $csv .= implode(',', array_map(function ($field) {
                return '"' . str_replace('"', '""', $field) . '"';
            }, $row)) . "\n";
        }

        return $csv;
    }
}
