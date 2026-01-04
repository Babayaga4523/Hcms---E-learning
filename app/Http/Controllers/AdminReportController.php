<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Module;
use App\Exports\ComplianceReportExport;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use League\Csv\Writer;

class AdminReportController extends Controller
{
    /**
     * Display reports & compliance dashboard
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized');
        }

        try {
            // Get overall compliance statistics
            $totalUsers = User::count();
            $activeUsers = User::where('status', 'active')->count();
            $inactiveUsers = User::where('status', 'inactive')->count();

            // Get training statistics
            $totalTraining = Module::count();
            $activeTraining = Module::where('is_active', true)->count();
            $completedTraining = DB::table('user_trainings')->where('status', 'completed')->distinct('module_id')->count();

            // Compliance rate calculation
            $completedCount = DB::table('user_trainings')
                ->where('status', 'completed')
                ->count();
            $totalCount = DB::table('user_trainings')->count();
            $complianceRate = $totalCount > 0 ? round(($completedCount / $totalCount) * 100, 2) : 0;

            // Get training completion by user
            $trainingCompletion = DB::table('user_trainings')
                ->select('user_id', DB::raw('COUNT(*) as total'), DB::raw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed"))
                ->groupBy('user_id')
                ->get();

            // Get training completion details with pagination
            $query = DB::table('user_trainings as ut')
                ->join('users as u', 'ut.user_id', '=', 'u.id')
                ->join('modules as tp', 'ut.module_id', '=', 'tp.id')
                ->select(
                    'u.id',
                    'u.name',
                    'u.email',
                    'u.status',
                    'tp.title as training_title',
                    'ut.status as completion_status',
                    'ut.completed_at',
                    'ut.created_at',
                    'ut.updated_at'
                );

            // Apply filters
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('u.name', 'like', "%{$search}%")
                      ->orWhere('u.email', 'like', "%{$search}%")
                      ->orWhere('tp.title', 'like', "%{$search}%");
                });
            }

            if ($request->has('status') && $request->status && $request->status !== 'all') {
                $query->where('ut.status', $request->status);
            }

            if ($request->has('userStatus') && $request->userStatus && $request->userStatus !== 'all') {
                $query->where('u.status', $request->userStatus);
            }

            // Get user compliance statistics
            $userCompliance = DB::table('users as u')
                ->leftJoin(DB::raw("(SELECT user_id, COUNT(*) as total_trainings, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_trainings FROM user_trainings GROUP BY user_id) as ut"), 'u.id', '=', 'ut.user_id')
                ->select(
                    'u.id',
                    'u.name',
                    'u.nip',
                    'u.email',
                    'u.role',
                    'u.status',
                    'u.department',
                    'u.created_at',
                    DB::raw('COALESCE(ut.total_trainings, 0) as total_trainings'),
                    DB::raw('COALESCE(ut.completed_trainings, 0) as completed_trainings'),
                    DB::raw('CASE WHEN ut.total_trainings > 0 THEN ROUND((ut.completed_trainings / ut.total_trainings) * 100, 2) ELSE 0 END as compliance_rate')
                )
                ->orderBy('u.created_at', 'desc');

            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $userCompliance->where(function ($q) use ($search) {
                    $q->where('u.name', 'like', "%{$search}%")
                      ->orWhere('u.nip', 'like', "%{$search}%")
                      ->orWhere('u.email', 'like', "%{$search}%")
                      ->orWhere('u.department', 'like', "%{$search}%");
                });
            }

            if ($request->has('status') && $request->status && $request->status !== 'all') {
                $userCompliance->where('u.status', $request->status);
            }

            if ($request->has('department') && $request->department && $request->department !== 'all') {
                $userCompliance->where('u.department', $request->department);
            }

            $reportData = $userCompliance->paginate(15);

            // Top compliance users
            $topCompliance = $userCompliance->orderBy('compliance_rate', 'desc')->limit(5)->get();

            // Get learner progress with exam scores
            $learnerProgress = DB::table('users as u')
                ->leftJoin('user_trainings as ut', 'u.id', '=', 'ut.user_id')
                ->leftJoin('exam_attempts as ea', function($join) {
                    $join->on('u.id', '=', 'ea.user_id')
                         ->on('ut.module_id', '=', 'ea.module_id');
                })
                ->select(
                    'u.id',
                    'u.name',
                    'u.nip',
                    'u.department',
                    DB::raw('COUNT(DISTINCT ut.module_id) as modules_enrolled'),
                    DB::raw("COUNT(DISTINCT CASE WHEN ut.status = 'completed' THEN ut.module_id END) as modules_completed"),
                    DB::raw('COALESCE(ROUND(AVG(ea.score), 0), 0) as avg_score'),
                    DB::raw('MAX(ut.updated_at) as last_active'),
                    DB::raw("'active' as status")
                )
                ->groupBy('u.id', 'u.name', 'u.nip', 'u.department')
                ->orderBy('last_active', 'desc')
                ->limit(50)
                ->get();

            // Get question performance analysis
            $questionPerformance = DB::table('questions as q')
                ->leftJoin('user_exam_answers as uea', 'q.id', '=', 'uea.question_id')
                ->select(
                    'q.id',
                    'q.question_text',
                    DB::raw('COUNT(uea.id) as total_attempts'),
                    DB::raw('SUM(CASE WHEN uea.is_correct = 1 THEN 1 ELSE 0 END) as correct_count'),
                    DB::raw('SUM(CASE WHEN uea.is_correct = 0 THEN 1 ELSE 0 END) as incorrect_count'),
                    DB::raw('ROUND((SUM(CASE WHEN uea.is_correct = 1 THEN 1 ELSE 0 END) / COUNT(uea.id)) * 100, 0) as correct_percentage'),
                    DB::raw('ROUND((SUM(CASE WHEN uea.is_correct = 0 THEN 1 ELSE 0 END) / COUNT(uea.id)) * 100, 0) as incorrect_percentage')
                )
                ->groupBy('q.id', 'q.question_text')
                ->havingRaw('COUNT(uea.id) > 0')
                ->orderBy('incorrect_percentage', 'desc')
                ->limit(10)
                ->get();

            // Get weekly trend data (last 7 days)
            $sevenDaysAgo = Carbon::now()->subDays(7)->format('Y-m-d H:i:s');
            $trendData = DB::table('user_trainings')
                ->select(
                    DB::raw("CAST(updated_at as DATE) as day_date"),
                    DB::raw("COUNT(CASE WHEN status = 'completed' THEN 1 END) as completion"),
                    DB::raw('COALESCE(ROUND(AVG(final_score), 0), 0) as score')
                )
                ->where('updated_at', '>=', $sevenDaysAgo)
                ->groupBy(DB::raw('CAST(updated_at as DATE)'))
                ->orderBy(DB::raw('CAST(updated_at as DATE)'), 'asc')
                ->get();

            // Compliance status distribution
            $complianceDistribution = [
                ['name' => 'Compliant', 'value' => DB::table('user_trainings')->where('status', 'completed')->count()],
                ['name' => 'Pending', 'value' => DB::table('user_trainings')->where('status', 'in_progress')->count()],
                ['name' => 'Non-Compliant', 'value' => DB::table('user_trainings')->where('status', 'not_started')->count()],
            ];

            // Period comparison (last 4 weeks)
            $comparisonData = [];
            for ($i = 3; $i >= 0; $i--) {
                $weekStart = Carbon::now()->subWeeks($i)->startOfWeek();
                $weekEnd = Carbon::now()->subWeeks($i)->endOfWeek();
                $prevWeekStart = Carbon::now()->subWeeks($i + 4)->startOfWeek();
                $prevWeekEnd = Carbon::now()->subWeeks($i + 4)->endOfWeek();
                
                $comparisonData[] = [
                    'name' => 'Week ' . (4 - $i),
                    'current' => DB::table('user_trainings')
                        ->whereBetween('created_at', [$weekStart, $weekEnd])
                        ->count(),
                    'previous' => DB::table('user_trainings')
                        ->whereBetween('created_at', [$prevWeekStart, $prevWeekEnd])
                        ->count(),
                ];
            }

            // Get departments list for filter
            $departments = User::select('department')
                ->whereNotNull('department')
                ->distinct()
                ->pluck('department');

            // If no data exists, provide empty arrays instead of null
            if ($learnerProgress->isEmpty()) {
                Log::info('No learner progress data found');
            }
            if ($questionPerformance->isEmpty()) {
                Log::info('No question performance data found');
            }
            if ($trendData->isEmpty()) {
                Log::info('No trend data found - creating default data');
                // Create default trend data for last 7 days
                $trendData = collect();
                for ($i = 6; $i >= 0; $i--) {
                    $trendData->push([
                        'day_date' => Carbon::now()->subDays($i)->format('Y-m-d'),
                        'completion' => 0,
                        'score' => 0
                    ]);
                }
            }

            return Inertia::render('Admin/Reports/ReportsCompliance', [
                'stats' => [
                    'total_users' => $totalUsers,
                    'active_users' => $activeUsers,
                    'inactive_users' => $inactiveUsers,
                    'total_training' => $totalTraining,
                    'active_training' => $activeTraining,
                    'completed_training' => $completedTraining,
                    'compliance_rate' => $complianceRate,
                    'total_completed' => $completedCount,
                    'total_assigned' => $totalCount,
                    'avg_completion' => $complianceRate,
                    'avg_score' => round(DB::table('exam_attempts')->avg('score') ?? 0, 0),
                ],
                'reports' => $reportData,
                'topCompliance' => $topCompliance,
                'learnerProgress' => $learnerProgress->toArray(),
                'questionPerformance' => $questionPerformance->toArray(),
                'trendData' => $trendData->toArray(),
                'complianceDistribution' => $complianceDistribution,
                'comparisonData' => $comparisonData,
                'departments' => $departments->toArray(),
                'filters' => [
                    'search' => $request->search ?? '',
                    'status' => $request->status ?? 'all',
                    'userStatus' => $request->userStatus ?? 'all',
                    'department' => $request->department ?? 'all',
                ],
                'auth' => ['user' => (array) $user],
            ]);
        } catch (\Exception $e) {
            Log::error('Reports Error: ' . $e->getMessage());
            abort(500, 'Error loading reports');
        }
    }

    /**
     * Export reports to CSV
     */
    public function export(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized');
        }

        try {
            set_time_limit(120);

            $query = DB::table('users as u')
                ->leftJoin(DB::raw("(SELECT user_id, COUNT(*) as total_trainings, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_trainings FROM user_trainings GROUP BY user_id) as ut"), 'u.id', '=', 'ut.user_id')
                ->select(
                    'u.name',
                    'u.email',
                    'u.role',
                    'u.status',
                    'u.created_at',
                    DB::raw('COALESCE(ut.total_trainings, 0) as total_trainings'),
                    DB::raw('COALESCE(ut.completed_trainings, 0) as completed_trainings'),
                    DB::raw('CASE WHEN ut.total_trainings > 0 THEN ROUND((ut.completed_trainings / ut.total_trainings) * 100, 2) ELSE 0 END as compliance_rate')
                );

            // Apply filters
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('u.name', 'like', "%{$search}%")
                      ->orWhere('u.email', 'like', "%{$search}%");
                });
            }

            if ($request->has('status') && $request->status && $request->status !== 'all') {
                $query->where('u.status', $request->status);
            }

            $filename = 'compliance_report_' . date('Y-m-d_His') . '.csv';

            return response()->stream(function () use ($query) {
                $handle = fopen('php://output', 'w');

                fputcsv($handle, ['Name', 'Email', 'Role', 'Status', 'Total Trainings', 'Completed', 'Compliance Rate (%)', 'Created At']);

                $chunkSize = 500;
                $query->lazy($chunkSize)->each(function ($record) use ($handle) {
                    fputcsv($handle, [
                        $record->name,
                        $record->email,
                        $record->role === 'admin' ? 'Admin' : 'Employee',
                        $record->status === 'active' ? 'Aktif' : 'Nonaktif',
                        $record->total_trainings,
                        $record->completed_trainings,
                        $record->compliance_rate,
                        $record->created_at,
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
            Log::error('Export Report Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error exporting report',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get compliance details by user
     */
    public function getUserCompliance($userId)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized');
        }

        try {
            $targetUser = User::findOrFail($userId);

            $trainings = DB::table('user_trainings as ut')
                ->join('modules as tp', 'ut.module_id', '=', 'tp.id')
                ->where('ut.user_id', $userId)
                ->select(
                    'tp.id',
                    'tp.title',
                    'ut.status',
                    'ut.completed_at',
                    'ut.created_at',
                    'tp.created_at as training_created_at'
                )
                ->orderBy('ut.created_at', 'desc')
                ->get();

            return response()->json([
                'user' => $targetUser,
                'trainings' => $trainings,
                'compliance_rate' => $trainings->count() > 0 ? 
                    round(($trainings->where('status', 'completed')->count() / $trainings->count()) * 100, 2) : 0
            ]);
        } catch (\Exception $e) {
            Log::error('Get User Compliance Error: ' . $e->getMessage());
            return response()->json(['error' => 'User not found'], 404);
        }
    }

    /**
     * Export report in specified format (PDF, Excel, CSV)
     */
    public function exportReport(Request $request)
    {
        try {
            $format = $request->input('format', 'pdf');
            
            // Validate format
            if (!in_array($format, ['pdf', 'excel', 'csv'])) {
                return response()->json(['error' => 'Invalid format. Use: pdf, excel, or csv'], 400);
            }

            // Get compliance data
            $totalUsers = User::count();
            $activeUsers = User::where('status', 'active')->count();
            $totalTraining = Module::count();
            $completedCount = DB::table('user_trainings')
                ->where('status', 'completed')
                ->count();
            $totalCount = DB::table('user_trainings')->count();
            $complianceRate = $totalCount > 0 ? round(($completedCount / $totalCount) * 100, 2) : 0;

            // Get detailed training data
            $trainingDetails = DB::table('user_trainings as ut')
                ->join('modules as m', 'ut.module_id', '=', 'm.id')
                ->select('m.title', 'ut.status', 'ut.completed_at', 'ut.created_at')
                ->orderBy('ut.created_at', 'desc')
                ->get();

            // Prepare data array for export
            $reportData = [
                ['COMPLIANCE REPORT'],
                ['Generated on', now()->format('Y-m-d H:i:s')],
                [],
                ['SUMMARY STATISTICS'],
                ['Total Users', $totalUsers],
                ['Active Users', $activeUsers],
                ['Total Training Programs', $totalTraining],
                ['Completed Training', $completedCount],
                ['Total Training Records', $totalCount],
                ['Compliance Rate (%)', $complianceRate],
                [],
                ['TRAINING DETAILS'],
                ['Module Title', 'Status', 'Completed At', 'Created At'],
            ];

            // Get user compliance data for professional reports
            $userComplianceData = DB::table('users as u')
                ->leftJoin(DB::raw("(SELECT user_id, COUNT(*) as total_trainings, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_trainings FROM user_trainings GROUP BY user_id) as ut"), 'u.id', '=', 'ut.user_id')
                ->select(
                    'u.id',
                    'u.name',
                    'u.email',
                    'u.role',
                    'u.status',
                    'u.created_at',
                    DB::raw('COALESCE(ut.total_trainings, 0) as total_trainings'),
                    DB::raw('COALESCE(ut.completed_trainings, 0) as completed_trainings'),
                    DB::raw('CASE WHEN ut.total_trainings > 0 THEN ROUND((ut.completed_trainings / ut.total_trainings) * 100, 2) ELSE 0 END as compliance_rate')
                )
                ->where('u.role', '!=', 'admin')
                ->orderBy('u.created_at', 'desc')
                ->get()
                ->map(function($item) {
                    return [
                        'id' => $item->id,
                        'name' => $item->name,
                        'email' => $item->email,
                        'role' => $item->role,
                        'status' => $item->status,
                        'total_trainings' => $item->total_trainings,
                        'completed_trainings' => $item->completed_trainings,
                        'compliance_rate' => $item->compliance_rate,
                        'created_at' => \Carbon\Carbon::parse($item->created_at)->format('Y-m-d H:i'),
                    ];
                })
                ->toArray();

            $filename = 'Compliance_Report_' . date('Y-m-d_His');

            // Export based on format
            if ($format === 'csv') {
                return $this->exportCSV($userComplianceData, $filename);
            } elseif ($format === 'excel') {
                return $this->exportExcel($userComplianceData, $filename);
            } elseif ($format === 'pdf') {
                return $this->exportPDF($userComplianceData, $filename);
            }

            return response()->json(['error' => 'Invalid format'], 400);
        } catch (\Exception $e) {
            Log::error('Export Report Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to export report: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Export data as CSV with Professional Format
     */
    /**
     * Export data as CSV with Professional Format
     */
    private function exportCSV($data, $filename)
    {
        $filename = $filename . '.csv';
        $headers = [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        $callback = function () use ($data) {
            $file = fopen('php://output', 'w');
            
            // Write BOM for UTF-8
            fwrite($file, chr(0xEF) . chr(0xBB) . chr(0xBF));
            
            // ===== HEADER SECTION =====
            fputcsv($file, ['COMPLIANCE & TRAINING REPORT']);
            fputcsv($file, []);
            fputcsv($file, ['Organization:', config('app.name', 'HCMS E-Learning')]);
            fputcsv($file, ['Report Type:', 'Compliance & Training Data']);
            fputcsv($file, ['Generated Date:', now()->format('Y-m-d H:i:s')]);
            fputcsv($file, ['Report Period:', 'Current']);
            fputcsv($file, []);
            
            // ===== SUMMARY SECTION =====
            $totalUsers = count($data);
            $activeUsers = collect($data)->where('status', 'active')->count();
            $completedTraining = array_sum(array_column($data, 'completed_trainings'));
            $totalTraining = array_sum(array_column($data, 'total_trainings'));
            $avgCompliance = $totalUsers > 0 ? array_sum(array_column($data, 'compliance_rate')) / $totalUsers : 0;
            
            fputcsv($file, ['SUMMARY STATISTICS']);
            fputcsv($file, ['Total Users:', $totalUsers]);
            fputcsv($file, ['Active Users:', $activeUsers]);
            fputcsv($file, ['Total Training Records:', $totalTraining]);
            fputcsv($file, ['Completed Training:', $completedTraining]);
            fputcsv($file, ['Average Compliance Rate (%):', round($avgCompliance, 2)]);
            fputcsv($file, []);
            
            // ===== COMPLIANCE LEVEL BREAKDOWN =====
            $highCompliance = collect($data)->where('compliance_rate', '>=', 80)->count();
            $mediumCompliance = collect($data)->whereBetween('compliance_rate', [60, 79.99])->count();
            $lowCompliance = collect($data)->where('compliance_rate', '<', 60)->count();
            
            fputcsv($file, ['COMPLIANCE LEVEL BREAKDOWN']);
            fputcsv($file, ['High (>=80%):', $highCompliance]);
            fputcsv($file, ['Medium (60-79%):', $mediumCompliance]);
            fputcsv($file, ['Low (<60%):', $lowCompliance]);
            fputcsv($file, []);
            fputcsv($file, []);
            
            // ===== DETAILED DATA TABLE =====
            fputcsv($file, ['DETAILED COMPLIANCE DATA']);
            fputcsv($file, []);
            
            // Table header with separator
            fputcsv($file, [
                'No',
                'Name',
                'Email',
                'Role',
                'Status',
                'Total Training',
                'Completed',
                'Compliance %',
                'Compliance Level',
                'Created At'
            ]);
            
            // Table data
            foreach ($data as $index => $row) {
                $complianceRate = $row['compliance_rate'] ?? 0;
                $complianceLevel = $complianceRate >= 80 ? 'HIGH' : ($complianceRate >= 60 ? 'MEDIUM' : 'LOW');
                
                fputcsv($file, [
                    $index + 1,
                    $row['name'] ?? '-',
                    $row['email'] ?? '-',
                    ucfirst($row['role'] ?? '-'),
                    ucfirst($row['status'] ?? '-'),
                    $row['total_trainings'] ?? 0,
                    $row['completed_trainings'] ?? 0,
                    round($complianceRate, 2),
                    $complianceLevel,
                    $row['created_at'] ?? '-',
                ]);
            }
            
            // ===== FOOTER SECTION =====
            fputcsv($file, []);
            fputcsv($file, []);
            fputcsv($file, ['NOTES & INFORMATION']);
            fputcsv($file, ['This is an automatically generated report from HCMS E-Learning System']);
            fputcsv($file, ['Compliance % = (Completed Training / Total Training) * 100']);
            fputcsv($file, ['Report Status: OFFICIAL']);
            fputcsv($file, ['']);
            fputcsv($file, ['Legend:']);
            fputcsv($file, ['HIGH (>=80%): User has completed 80% or more of assigned training']);
            fputcsv($file, ['MEDIUM (60-79%): User has completed 60-79% of assigned training']);
            fputcsv($file, ['LOW (<60%): User has completed less than 60% of assigned training']);
            fputcsv($file, []);
            fputcsv($file, ['Copyright © ' . date('Y') . ' ' . config('app.name', 'HCMS E-Learning') . '. All Rights Reserved.']);
            fputcsv($file, ['This document is confidential and intended for authorized recipients only.']);
            
            fclose($file);
        };

        return response()->streamDownload($callback, $filename, $headers);
    }

    /**
     * Export data as Excel with Professional Format (BNI Style)
     */
    private function exportExcel($data, $filename)
    {
        $filename = $filename . '.xlsx';
        return Excel::download(new ComplianceReportExport($data, 'Compliance & Training Report'), $filename);
    }

    /**
     * Export data as PDF with Professional Format (BNI Style)
     */
    private function exportPDF($data, $filename)
    {
        $filename = $filename . '.pdf';
        
        try {
            // Generate HTML with professional BNI Finance styling
            $html = view('exports.compliance-data-pdf', [
                'data' => $data,
                'generatedAt' => now()->format('Y-m-d H:i:s'),
                'company' => config('app.name', 'HCMS E-Learning'),
            ])->render();

            // Generate PDF using DomPDF
            $pdf = Pdf::loadHTML($html)
                ->setPaper('a4', 'portrait')
                ->setOption('margin-top', 5)
                ->setOption('margin-right', 5)
                ->setOption('margin-bottom', 5)
                ->setOption('margin-left', 5)
                ->setOption('isHtml5ParserEnabled', true);

            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('PDF Generation Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate PDF: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Download specific report
     */
    public function downloadReport($reportId, Request $request)
    {
        try {
            // Get report data based on ID
            $reports = [
                1 => ['title' => 'Q4 Compliance Report', 'type' => 'Compliance', 'date' => '2025-12-20'],
                2 => ['title' => 'Monthly Audit - Dec', 'type' => 'Audit', 'date' => '2025-12-18'],
                3 => ['title' => 'Learner Performance Summary', 'type' => 'Performance', 'date' => '2025-12-15'],
                4 => ['title' => 'Training Effectiveness', 'type' => 'Training', 'date' => '2025-12-10'],
                5 => ['title' => 'Risk Assessment', 'type' => 'Compliance', 'date' => '2025-12-08'],
            ];

            if (!isset($reports[$reportId])) {
                abort(404, 'Report not found');
            }

            $report = $reports[$reportId];
            $filename = str_replace(' ', '_', strtolower($report['title'])) . '_' . date('Y-m-d_His') . '.pdf';

            // Generate HTML content for PDF with Professional BNI Style
            $html = view('exports.single-report', [
                'report' => $report,
                'generatedAt' => now()->format('Y-m-d H:i:s'),
                'company' => config('app.name', 'HCMS E-Learning'),
            ])->render();

            // Generate PDF using DomPDF
            try {
                $pdf = Pdf::loadHTML($html)
                    ->setPaper('a4', 'portrait')
                    ->setOption('margin-top', 5)
                    ->setOption('margin-right', 5)
                    ->setOption('margin-bottom', 5)
                    ->setOption('margin-left', 5)
                    ->setOption('isHtml5ParserEnabled', true);

                return $pdf->download($filename);
            } catch (\Exception $e) {
                Log::error('PDF Generation Error: ' . $e->getMessage());
                // Fallback: return HTML as attachment
                return response($html, 200, [
                    'Content-Type' => 'text/html; charset=utf-8',
                    'Content-Disposition' => "attachment; filename=\"{$filename}.html\"",
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Download Report Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to download report: ' . $e->getMessage()], 500);
        }
    }
}
