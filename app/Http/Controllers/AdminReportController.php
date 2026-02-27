<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Module;
use App\Exports\ComplianceReportExport;
use App\Exports\ComprehensiveExport;
use App\Exports\SimpleComplianceExport;
use App\Exports\EnhancedComprehensiveExport;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;

class AdminReportController extends Controller
{
    /**
     * Display reports & compliance dashboard
     * COMPREHENSIVE E-LEARNING DATA COLLECTION dengan perfect logic
     */
    public function index(Request $request)
    {
        $this->authorizeAdmin();

        try {
            // ===== 1. COLLECT ALL STATISTICS =====
            $stats = Cache::remember('admin_dashboard_stats', 600, function () {
                // User Statistics
                $totalUsers = User::count();
                $activeUsers = User::where('status', 'active')->count();
                $inactiveUsers = User::where('status', 'inactive')->count();
                
                // Module/Program Statistics
                $totalModules = Module::count();
                $activeModules = Module::where('is_active', true)->count();
                
                // Training Assignment & Completion
                $totalAssignments = DB::table('user_trainings')->count();
                $completedAssignments = DB::table('user_trainings')->where('status', 'completed')->count();
                $inProgressAssignments = DB::table('user_trainings')->where('status', 'in_progress')->count();
                
                // Exam & Assessment Data
                $totalExamAttempts = DB::table('exam_attempts')->count();
                $avgExamScore = round(DB::table('exam_attempts')->avg('score') ?? 0, 1);
                $avgModuleCompletion = $totalAssignments > 0 
                    ? round(($completedAssignments / $totalAssignments) * 100, 2) 
                    : 0;
                
                // Department Distribution
                $totalDepartments = User::distinct('department')->count();
                
                return [
                    // User Data
                    'total_users'           => $totalUsers,
                    'active_users'          => $activeUsers,
                    'inactive_users'        => $inactiveUsers,
                    
                    // Module/Program Data
                    'total_modules'         => $totalModules,
                    'active_modules'        => $activeModules,
                    
                    // Training Data
                    'total_assignments'     => $totalAssignments,
                    'completed_assignments' => $completedAssignments,
                    'in_progress_assignments' => $inProgressAssignments,
                    'pending_assignments'   => $totalAssignments - $completedAssignments - $inProgressAssignments,
                    
                    // Assessment Data
                    'total_exam_attempts'   => $totalExamAttempts,
                    'avg_exam_score'        => $avgExamScore,
                    
                    // Metrics
                    'compliance_rate'       => $avgModuleCompletion,
                    'avg_completion'        => $avgModuleCompletion,
                    'total_departments'     => $totalDepartments,
                ];
            });

            // ===== 2. USER DATA BREAKDOWN =====
            // OPTIMIZED: Single query with raw aggregates instead of separate queries
            $userStats = DB::table('users')
                ->where('role', '!=', 'admin')
                ->select(
                    DB::raw('COUNT(*) as total_non_admins'),
                    DB::raw("SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count"),
                    DB::raw("SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_count")
                )
                ->first();

            $usersByDepartment = DB::table('users')
                ->where('role', '!=', 'admin')
                ->select('department', DB::raw('COUNT(*) as count'))
                ->groupByRaw('department')
                ->orderBy('count', 'desc')
                ->get()
                ->map(function($item) {
                    return [
                        'name' => $item->department ?? 'Unknown',
                        'value' => $item->count
                    ];
                });

            $usersByStatus = [
                ['name' => 'Active', 'value' => $userStats->active_count ?? 0],
                ['name' => 'Inactive', 'value' => $userStats->inactive_count ?? 0],
            ];

            // ===== 3. MODULE/PROGRAM DATA BREAKDOWN =====
            // OPTIMIZED: Remove unnecessary join - use select with aggregates
            $moduleStats = DB::table('user_trainings as ut')
                ->select(
                    DB::raw('ut.module_id'),
                    DB::raw('(SELECT title FROM modules WHERE id = ut.module_id LIMIT 1) as title'),
                    DB::raw('COUNT(ut.id) as total_enrolled'),
                    DB::raw("SUM(CASE WHEN ut.status = 'completed' THEN 1 ELSE 0 END) as completed"),
                    DB::raw("SUM(CASE WHEN ut.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress"),
                    DB::raw("SUM(CASE WHEN ut.status = 'pending' THEN 1 ELSE 0 END) as pending"),
                    DB::raw("ROUND((SUM(CASE WHEN ut.status = 'completed' THEN 1 ELSE 0 END) / COUNT(ut.id)) * 100, 2) as completion_rate")
                )
                ->groupByRaw('ut.module_id')
                ->orderBy('total_enrolled', 'desc')
                ->limit(config('admin.reports.top_modules_limit', 20))
                ->get();

            // ===== 4. LEARNER PROGRESS DATA =====
            $learnerProgress = $this->getLearnerProgress();

            // ===== 5. ASSESSMENT & SCORE DATA =====
            $examPerformance = DB::table('exam_attempts as ea')
                ->join('users as u', 'ea.user_id', '=', 'u.id')
                ->select(
                    'u.id', 'u.name',
                    DB::raw('COUNT(ea.id) as total_attempts'),
                    DB::raw('ROUND(AVG(ea.score), 2) as avg_score'),
                    DB::raw('MAX(ea.score) as highest_score'),
                    DB::raw('MIN(ea.score) as lowest_score')
                )
                ->groupBy('u.id', 'u.name')
                ->orderBy('avg_score', 'desc')
                ->limit(20)
                ->get();

            // ===== 6. QUESTION PERFORMANCE DATA =====
            $questionAnalysis = $this->getQuestionAnalysis();

            // ===== 7. TREND DATA (Weekly/Daily) =====
            $trendData = $this->getWeeklyTrend();

            // ===== 8. COMPLIANCE DISTRIBUTION =====
            $complianceDistribution = $this->getComplianceDistribution();

            // ===== 9. TOP PERFORMERS & STRUGGLERS =====
            $topPerformers = $this->getTopComplianceUsers();
            
            // OPTIMIZED: Use aggregate functions instead of left join + filtering
            $strugglers = DB::table('users as u')
                ->select(
                    'u.id', 'u.name', 'u.department',
                    DB::raw('COUNT(ut.id) as total_modules'),
                    DB::raw("SUM(CASE WHEN ut.status = 'completed' THEN 1 ELSE 0 END) as completed"),
                    DB::raw("CASE WHEN COUNT(ut.id) > 0 THEN ROUND((SUM(CASE WHEN ut.status = 'completed' THEN 1 ELSE 0 END) / COUNT(ut.id)) * 100, 2) ELSE 0 END as completion_rate")
                )
                ->leftJoinSub(
                    DB::table('user_trainings'),
                    'ut',
                    function($join) {
                        $join->on('u.id', '=', 'ut.user_id');
                    }
                )
                ->where('u.role', '!=', 'admin')
                ->groupByRaw('u.id, u.name, u.department')
                ->orderBy('completion_rate', 'asc')
                ->limit(config('admin.reports.low_performers_limit', 10))
                ->get();

            // ===== 10. ENGAGEMENT METRICS =====
            $lastWeekEnrollments = DB::table('user_trainings')
                ->where('created_at', '>=', Carbon::now()->subDays(7))
                ->count();
            
            $lastWeekCompletions = DB::table('user_trainings')
                ->where('status', 'completed')
                ->where('completed_at', '>=', Carbon::now()->subDays(7))
                ->count();

            // Report Query for main compliance table
            $reportQuery = $this->buildComplianceQuery($request);
            $reportData = $reportQuery->paginate(15)->withQueryString();

            // GET DEPARTMENTS (Cached 1 jam karena jarang berubah)
            $departments = Cache::remember('list_departments', 3600, function () {
                return User::select('department')->whereNotNull('department')->distinct()->pluck('department');
            });

            // ===== RETURN COMPREHENSIVE DATA TO FRONTEND =====
            return Inertia::render('Admin/Reports/ReportsCompliance', [
                // Core Statistics
                'stats' => $stats,
                
                // User Analytics
                'usersByDepartment' => $usersByDepartment,
                'usersByStatus' => $usersByStatus,
                
                // Module/Program Analytics
                'moduleStats' => $moduleStats,
                
                // Learner Data
                'learnerProgress' => $learnerProgress,
                'reportData' => $reportData,
                
                // Assessment & Score Data
                'examPerformance' => $examPerformance,
                
                // Question/Item Analysis
                'questionPerformance' => $questionAnalysis,
                
                // Trend Data
                'trendData' => $trendData,
                
                // Compliance Metrics
                'complianceDistribution' => $complianceDistribution,
                'topPerformers' => $topPerformers,
                'strugglers' => $strugglers,
                
                // Engagement Metrics
                'lastWeekEnrollments' => $lastWeekEnrollments,
                'lastWeekCompletions' => $lastWeekCompletions,
                
                // Supporting Data
                'departments' => $departments,
                'filters' => $request->only(['search', 'status', 'department']),
            ]);

        } catch (\Exception $e) {
            Log::error('Reports Dashboard Error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Gagal memuat data laporan.');
        }
    }

    /**
     * Centralized Query Builder untuk Laporan Kepatuhan
     * DRY PRINCIPLE: Digunakan oleh Index (View) dan Export (Excel/CSV)
     */
    private function buildComplianceQuery(Request $request)
    {
        $query = DB::table('users as u')
            ->leftJoin('user_trainings as ut', 'u.id', '=', 'ut.user_id')
            ->select(
                'u.id', 'u.name', 'u.nip', 'u.email', 'u.role', 'u.status', 'u.department', 'u.created_at',
                DB::raw('COUNT(ut.id) as total_trainings'),
                DB::raw("SUM(CASE WHEN ut.status = 'completed' THEN 1 ELSE 0 END) as completed_trainings"),
                DB::raw("CASE WHEN COUNT(ut.id) > 0 THEN ROUND((SUM(CASE WHEN ut.status = 'completed' THEN 1 ELSE 0 END) / COUNT(ut.id)) * 100, 2) ELSE 0 END as compliance_rate")
            )
            ->where('u.role', '!=', 'admin') // Exclude admin dari laporan kepatuhan
            ->groupBy('u.id', 'u.name', 'u.nip', 'u.email', 'u.role', 'u.status', 'u.department', 'u.created_at');

        // Apply Filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('u.name', 'like', "%{$search}%")
                  ->orWhere('u.nip', 'like', "%{$search}%")
                  ->orWhere('u.email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('u.status', $request->status);
        }

        if ($request->filled('department') && $request->department !== 'all') {
            $query->where('u.department', $request->department);
        }

        return $query->orderBy('compliance_rate', 'desc'); // Prioritaskan yang rajin atau malas (sesuai kebutuhan)
    }

    /**
     * API Endpoint: Get Reports Summary (Real-Time Aggregation)
     * Menggantikan hardcoded array dengan data asli.
     */
    public function getReportsApi(Request $request)
    {
        // Agregasi Status Laporan Berdasarkan Training
        $byStatus = DB::table('user_trainings')
            ->select('status as name', DB::raw('count(*) as value'))
            ->groupBy('status')
            ->get();

        // Simulasi "Daftar Laporan yang Tersedia" (Bisa dikembangkan menjadi tabel 'generated_reports' di DB)
        $reports = [
            [
                'id' => 'compliance_q' . Carbon::now()->quarter, 
                'title' => 'Laporan Kepatuhan Q' . Carbon::now()->quarter . ' ' . Carbon::now()->year, 
                'type' => 'Compliance', 
                'date' => now()->format('Y-m-d'), 
                'status' => 'Ready'
            ],
            [
                'id' => 'training_effectiveness', 
                'title' => 'Efektivitas Pelatihan Bulanan', 
                'type' => 'Analytics', 
                'date' => now()->startOfMonth()->format('Y-m-d'), 
                'status' => 'Ready'
            ],
        ];

        return response()->json([
            'reports' => $reports,
            'byStatus' => $byStatus,
            'stats' => [
                'total_completed' => DB::table('user_trainings')->where('status', 'completed')->count(),
                'avg_score' => round(DB::table('exam_attempts')->avg('score') ?? 0, 1)
            ]
        ]);
    }

    /**
     * Export Handling (Excel, CSV, PDF)
     * ENHANCED: Multiple sheets with professional styling
     * Optimized untuk efficiency tanpa memory issues
     */
    public function export(Request $request)
    {
        $this->authorizeAdmin();
        set_time_limit(300); // 5 Menit max execution

        $format = $request->input('format', 'csv');
        $filename = 'Laporan_Compliance_' . date('Y-m-d_H-i');

        // Gunakan Query Builder yang sama dengan index agar hasil konsisten
        $query = $this->buildComplianceQuery($request);

        if ($format === 'csv') {
            return $this->streamCsv($query, $filename);
        }

        // Untuk Excel - gunakan enhanced comprehensive export dengan multiple sheets
        if ($format === 'excel') {
            try {
                // Sheet 1: Main Compliance Data (SEMUA rows tanpa limit)
                $complianceData = $query->get();

                // Sheet 2: User Statistics (LENGKAP) - Cache queries to avoid duplication
                $totalUsers = User::count();
                $activeUsers = User::where('status', 'active')->count();
                $inactiveUsers = User::where('status', 'inactive')->count();
                
                // Cache training stats queries
                $totalTrainings = DB::table('user_trainings')->count();
                $completedTrainings = DB::table('user_trainings')->where('status', 'completed')->count();
                $inProgressTrainings = DB::table('user_trainings')->where('status', 'in_progress')->count();
                $pendingTrainings = DB::table('user_trainings')->where('status', 'pending')->count();
                
                $userStats = collect([
                    ['category' => 'Total Users', 'status' => 'Registered', 'count' => $totalUsers, 'percentage' => 100],
                    ['category' => 'User Status', 'status' => 'Active', 'count' => $activeUsers, 'percentage' => $totalUsers > 0 ? round(($activeUsers / $totalUsers * 100), 2) : 0],
                    ['category' => 'User Status', 'status' => 'Inactive', 'count' => $inactiveUsers, 'percentage' => $totalUsers > 0 ? round(($inactiveUsers / $totalUsers * 100), 2) : 0],
                    ['category' => 'Training Status', 'status' => 'Completed', 'count' => $completedTrainings, 'percentage' => $totalTrainings > 0 ? round(($completedTrainings / $totalTrainings * 100), 2) : 0],
                    ['category' => 'Training Status', 'status' => 'In Progress', 'count' => $inProgressTrainings, 'percentage' => $totalTrainings > 0 ? round(($inProgressTrainings / $totalTrainings * 100), 2) : 0],
                    ['category' => 'Training Status', 'status' => 'Pending', 'count' => $pendingTrainings, 'percentage' => $totalTrainings > 0 ? round(($pendingTrainings / $totalTrainings * 100), 2) : 0],
                ]);

                // Sheet 3: Module/Program Performance (SEMUA modules)
                $moduleStats = DB::table('user_trainings as ut')
                    ->join('modules as m', 'ut.module_id', '=', 'm.id')
                    ->select(
                        'm.id', 'm.title',
                        DB::raw('COUNT(ut.id) as total_enrolled'),
                        DB::raw("SUM(CASE WHEN ut.status = 'completed' THEN 1 ELSE 0 END) as completed"),
                        DB::raw("SUM(CASE WHEN ut.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress"),
                        DB::raw("SUM(CASE WHEN ut.status = 'pending' THEN 1 ELSE 0 END) as pending")
                    )
                    ->groupBy('m.id', 'm.title')
                    ->orderBy('total_enrolled', 'desc')
                    ->get();

                // Sheet 4: Learner Details (SEMUA learners dengan training)
                $learnerData = collect($this->getLearnerProgress());

                // Sheet 5: Exam Performance (SEMUA peserta dengan exam)
                $examData = DB::table('exam_attempts as ea')
                    ->join('users as u', 'ea.user_id', '=', 'u.id')
                    ->select(
                        'u.id', 'u.name',
                        DB::raw('COUNT(ea.id) as total_attempts'),
                        DB::raw('ROUND(AVG(ea.score), 2) as avg_score'),
                        DB::raw('MAX(ea.score) as highest_score'),
                        DB::raw('MIN(ea.score) as lowest_score')
                    )
                    ->groupBy('u.id', 'u.name')
                    ->orderBy('avg_score', 'desc')
                    ->get();

                // Sheet 6: Analytics Summary (COMPREHENSIVE KPI)
                $totalUsers = User::count();
                $totalModules = Module::count();
                $totalTrainings = DB::table('user_trainings')->count();
                $completedTrainings = DB::table('user_trainings')->where('status', 'completed')->count();
                $totalExams = DB::table('exam_attempts')->count();
                
                $analyticsData = [
                    '1. TOTAL PENGGUNA' => $totalUsers,
                    '2. Pengguna Aktif' => User::where('status', 'active')->count(),
                    '3. Pengguna Inactive' => User::where('status', 'inactive')->count(),
                    '4. TOTAL MODULE' => $totalModules,
                    '5. Module Aktif' => Module::where('is_active', true)->count(),
                    '6. TOTAL TRAINING ASSIGNMENTS' => $totalTrainings,
                    '7. Training Selesai' => $completedTrainings,
                    '8. Training In Progress' => DB::table('user_trainings')->where('status', 'in_progress')->count(),
                    '9. Training Pending' => DB::table('user_trainings')->where('status', 'pending')->count(),
                    '10. Rata-rata Completion' => round(($completedTrainings / max($totalTrainings, 1) * 100), 2) . '%',
                    '11. TOTAL EXAM ATTEMPTS' => $totalExams,
                    '12. Rata-rata Exam Score' => round(DB::table('exam_attempts')->avg('score') ?? 0, 2),
                    '13. Highest Exam Score' => round(DB::table('exam_attempts')->max('score') ?? 0, 2),
                    '14. Lowest Exam Score' => round(DB::table('exam_attempts')->min('score') ?? 0, 2),
                    '15. Total Departments' => User::distinct('department')->count(),
                    '16. Export Timestamp' => now()->format('Y-m-d H:i:s'),
                    '17. Compliance Rate' => round(($completedTrainings / max($totalTrainings, 1) * 100), 2) . '%',
                ];

                return Excel::download(
                    new EnhancedComprehensiveExport(
                        $complianceData,
                        $userStats,
                        $moduleStats,
                        $learnerData,
                        $examData,
                        $analyticsData
                    ),
                    $filename . '.xlsx'
                );
            } catch (\Exception $e) {
                Log::error('Excel Export Error: ' . $e->getMessage(), [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString()
                ]);
                return response()->json(['error' => 'Gagal export Excel: ' . $e->getMessage()], 500);
            }
        }

        // Untuk Excel & PDF - load data with limit
        $data = $query->limit(config('admin.reports.export_limit', 5000))->get();

        if ($format === 'pdf') {
            return $this->generatePdf($data, $filename);
        }

        return response()->json(['error' => 'Format tidak didukung'], 400);
    }

    /**
     * Export reports to CSV (Legacy - gunakan export() dengan format param)
     */
    public function exportReport(Request $request)
    {
        return $this->export($request);
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
     * Logic Download Spesifik Report (Dynamic Generation)
     * Menghapus array hardcoded, generate PDF on-the-fly berdasarkan tipe.
     */
    public function downloadReport($reportId, Request $request)
    {
        $this->authorizeAdmin();
        
        $filename = $reportId . '_' . date('Ymd') . '.pdf';
        
        // Logika generate report berdasarkan ID
        if ($reportId === 'compliance_q' . Carbon::now()->quarter || str_contains($reportId, 'compliance')) {
            $data = $this->buildComplianceQuery($request)->limit(config('admin.reports.sample_size', 100))->get(); // Sample
            return $this->generatePdf($data, $filename, 'Laporan Kepatuhan Kuartal');
        }

        if ($reportId === 'training_effectiveness') {
            // Custom query untuk efektivitas
            $data = $this->getQuestionAnalysis();
            // Disini bisa return view khusus untuk effectiveness
            // Untuk simplifikasi, return PDF standar
            return $this->generatePdf($data, $filename, 'Laporan Efektivitas');
        }

        abort(404, 'Laporan tidak ditemukan.');
    }

    // =========================================================================
    // PRIVATE HELPER METHODS (Clean Code)
    // =========================================================================

    /**
     * Authorization check untuk admin
     */
    private function authorizeAdmin()
    {
        if (Auth::user()->role !== 'admin') {
            abort(403, 'Akses ditolak. Hanya admin yang diperbolehkan.');
        }
    }

    /**
     * Get top compliance users
     */
    private function getTopComplianceUsers()
    {
        return DB::table('users as u')
            ->join('user_trainings as ut', 'u.id', '=', 'ut.user_id')
            ->select(
                'u.id', 
                'u.name', 
                'u.department', 
                DB::raw('COUNT(ut.id) as total'),
                DB::raw("SUM(CASE WHEN ut.status='completed' THEN 1 ELSE 0 END) as completed"),
                DB::raw("ROUND((SUM(CASE WHEN ut.status='completed' THEN 1 ELSE 0 END) / COUNT(ut.id)) * 100, 2) as completion_rate")
            )
            ->where('u.role', '!=', 'admin')
            ->groupBy('u.id', 'u.name', 'u.department')
            ->orderByRaw('(SUM(CASE WHEN ut.status="completed" THEN 1 ELSE 0 END) / COUNT(ut.id)) DESC')
            ->limit(config('admin.reports.top_users_limit', 10))
            ->get();
    }

    /**
     * Get learner progress data (wrapper method)
     * OPTIMIZED: Reduced from 3 joins to 2, avoid subquery explosions
     */
    private function getLearnerProgress()
    {
        // Use default date range (last 1 month)
        return $this->getLearnerProgressWithModuleScores();
    }

    /**
     * Get learner progress with module scores and date range filtering
     */
    private function getLearnerProgressWithModuleScores($startDate = null, $endDate = null)
    {
        $startDate = $startDate ?? Carbon::now()->subMonths(1)->startOfDay();
        $endDate = $endDate ?? Carbon::now()->endOfDay();

        return DB::table('users as u')
            ->leftJoin('user_trainings as ut', function($join) use ($startDate, $endDate) {
                $join->on('u.id', '=', 'ut.user_id')
                     ->whereBetween('ut.created_at', [$startDate, $endDate]);
            })
            ->leftJoin('modules as m', 'ut.module_id', '=', 'm.id')
            ->leftJoin('exam_attempts as ea', function($join) {
                $join->on('ut.user_id', '=', 'ea.user_id')
                     ->on('ut.module_id', '=', 'ea.module_id');
            })
            ->select(
                'u.id',
                'u.name',
                'u.nip',
                'u.department',
                DB::raw('COUNT(DISTINCT ut.module_id) as modules_enrolled'),
                DB::raw("COUNT(DISTINCT CASE WHEN ut.status = 'completed' THEN ut.module_id END) as modules_completed"),
                DB::raw('ROUND((COUNT(DISTINCT CASE WHEN ut.status = "completed" THEN ut.module_id END) / NULLIF(COUNT(DISTINCT ut.module_id), 0)) * 100, 1) as completion_percentage'),
                DB::raw('COALESCE(ROUND(AVG(CASE WHEN ea.score IS NOT NULL THEN ea.score END), 2), 0) as avg_module_score'),
                DB::raw('MAX(ut.updated_at) as last_active'),
                DB::raw("'active' as status"),
                DB::raw('GROUP_CONCAT(DISTINCT CONCAT(m.title, ":", ROUND(COALESCE(ea.score, 0), 1)) SEPARATOR ", ") as module_scores')
            )
            ->where('u.role', '!=', 'admin')
            ->groupBy('u.id', 'u.name', 'u.nip', 'u.department')
            ->orderBy('modules_completed', 'desc')
            ->limit(config('admin.reports.sample_size', 100))
            ->get()
            ->toArray();
    }

    /**
     * Get weekly trend data
     * OPTIMIZED: Removed expensive subquery in SELECT
     */
    private function getWeeklyTrend()
    {
        return DB::table('user_trainings')
            ->select(DB::raw("DATE(updated_at) as day_date"), 
                     DB::raw("DATE_FORMAT(updated_at, '%a') as day_name"),
                     DB::raw("COUNT(*) as completion"))
            ->where('status', 'completed')
            ->where('updated_at', '>=', Carbon::now()->subDays(7))
            ->groupBy('day_date', 'day_name')
            ->orderBy('day_date')
            ->get()
            ->map(function($item) {
                // Calculate average score for the day separately
                $avgScore = DB::table('exam_attempts')
                    ->whereDate('created_at', $item->day_date)
                    ->avg('score');
                $item->score = (int)($avgScore ?? 0);
                return $item;
            })
            ->toArray();
    }

    /**
     * Get compliance distribution
     */
    private function getComplianceDistribution()
    {
        $completed = DB::table('user_trainings')->where('status', 'completed')->count();
        $inProgress = DB::table('user_trainings')->where('status', 'in_progress')->count();
        $pending = DB::table('user_trainings')->whereIn('status', ['pending', 'enrolled'])->count();

        return [
            ['name' => 'Completed', 'value' => $completed, 'color' => '#10b981'],
            ['name' => 'In Progress', 'value' => $inProgress, 'color' => '#f59e0b'],
            ['name' => 'Pending', 'value' => $pending, 'color' => '#ef4444'],
        ];
    }

    /**
     * Get question analysis - most difficult questions
     */
    private function getQuestionAnalysis()
    {
        return DB::table('questions as q')
            ->leftJoin('user_exam_answers as uea', 'q.id', '=', 'uea.question_id')
            ->select('q.id', 'q.question_text',
                DB::raw('COUNT(uea.id) as total_attempts'),
                DB::raw('SUM(CASE WHEN uea.is_correct = 1 THEN 1 ELSE 0 END) as correct_count'),
                DB::raw('SUM(CASE WHEN uea.is_correct = 0 THEN 1 ELSE 0 END) as incorrect_count'),
                DB::raw('ROUND((SUM(CASE WHEN uea.is_correct = 1 THEN 1 ELSE 0 END) / COUNT(uea.id)) * 100, 0) as correct'),
                DB::raw('ROUND((SUM(CASE WHEN uea.is_correct = 0 THEN 1 ELSE 0 END) / COUNT(uea.id)) * 100, 0) as incorrect')
            )
            ->groupBy('q.id', 'q.question_text')
            ->havingRaw('COUNT(uea.id) > 0')
            ->orderByRaw('(SUM(CASE WHEN uea.is_correct = 0 THEN 1 ELSE 0 END) / COUNT(uea.id)) DESC')
            ->limit(config('admin.reports.low_performers_limit', 10))
            ->get()
            ->toArray();
    }

    /**
     * Stream CSV untuk performa tinggi & hemat memori
     */
    private function streamCsv($query, $filename)
    {
        $headers = [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}.csv\"",
        ];

        return response()->stream(function () use ($query) {
            $handle = fopen('php://output', 'w');
            
            // BOM for Excel UTF-8
            fputs($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Header
            fputcsv($handle, ['Nama', 'NIP', 'Departemen', 'Total Training', 'Selesai', 'Compliance Rate (%)']);

            // Gunakan cursor() untuk streaming data tanpa load semua ke RAM
            foreach ($query->cursor() as $row) {
                fputcsv($handle, [
                    $row->name,
                    $row->nip ?? '-',
                    $row->department ?? '-',
                    $row->total_trainings,
                    $row->completed_trainings,
                    $row->compliance_rate
                ]);
            }
            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Generate PDF Report
     */
    private function generatePdf($data, $filename, $title = 'Compliance Report')
    {
        try {
            $pdf = Pdf::loadView('exports.compliance-data-pdf', [
                'data' => $data,
                'title' => $title,
                'generated_at' => now(),
                'company' => config('app.name', 'HCMS E-Learning')
            ])->setPaper('a4', 'landscape');

            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('PDF Generation Error: ' . $e->getMessage());
            return response()->json(['error' => 'Gagal generate PDF: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display Comprehensive Reports Page with All E-Learning Data
     * NEW PAGE: Full analytics dashboard with all data visualization
     */
    public function indexComprehensive(Request $request)
    {
        $this->authorizeAdmin();

        try {
            // ===== 1. COLLECT ALL STATISTICS =====
            $stats = Cache::remember('admin_comprehensive_stats', 300, function () {
                // User Statistics
                $totalUsers = User::count();
                $activeUsers = User::where('status', 'active')->count();
                $inactiveUsers = User::where('status', 'inactive')->count();
                
                // Module/Program Statistics
                $totalModules = Module::count();
                $activeModules = Module::where('is_active', true)->count();
                
                // Training Assignment & Completion
                $totalAssignments = DB::table('user_trainings')->count();
                $completedAssignments = DB::table('user_trainings')->where('status', 'completed')->count();
                $inProgressAssignments = DB::table('user_trainings')->where('status', 'in_progress')->count();
                
                // Exam & Assessment Data
                $totalExamAttempts = DB::table('exam_attempts')->count();
                $avgExamScore = round(DB::table('exam_attempts')->avg('score') ?? 0, 1);
                $avgModuleCompletion = $totalAssignments > 0 
                    ? round(($completedAssignments / $totalAssignments) * 100, 2) 
                    : 0;
                
                // Department Distribution
                $totalDepartments = User::distinct('department')->count();
                
                return [
                    // User Data
                    'total_users'           => $totalUsers,
                    'active_users'          => $activeUsers,
                    'inactive_users'        => $inactiveUsers,
                    
                    // Module/Program Data
                    'total_modules'         => $totalModules,
                    'active_modules'        => $activeModules,
                    
                    // Training Data
                    'total_assignments'     => $totalAssignments,
                    'completed_assignments' => $completedAssignments,
                    'in_progress_assignments' => $inProgressAssignments,
                    'pending_assignments'   => $totalAssignments - $completedAssignments - $inProgressAssignments,
                    
                    // Assessment Data
                    'total_exam_attempts'   => $totalExamAttempts,
                    'avg_exam_score'        => $avgExamScore,
                    
                    // Metrics
                    'compliance_rate'       => $avgModuleCompletion,
                    'avg_completion'        => $avgModuleCompletion,
                    'total_departments'     => $totalDepartments,
                ];
            });

            // ===== 2. USER DATA BREAKDOWN =====
            $usersByDepartment = DB::table('users')
                ->where('role', '!=', 'admin')
                ->groupBy('department')
                ->select('department', DB::raw('COUNT(*) as count'))
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get()
                ->map(function($item) {
                    return [
                        'name' => $item->department ?? 'Tidak Diketahui',
                        'value' => $item->count
                    ];
                });

            $usersByStatus = DB::table('users')
                ->where('role', '!=', 'admin')
                ->groupBy('status')
                ->select('status', DB::raw('COUNT(*) as count'))
                ->get()
                ->map(function($item) {
                    return [
                        'name' => ucfirst($item->status),
                        'value' => $item->count
                    ];
                });

            // ===== 3. MODULE/PROGRAM DATA BREAKDOWN =====
            $moduleStats = DB::table('user_trainings as ut')
                ->join('modules as m', 'ut.module_id', '=', 'm.id')
                ->select(
                    'm.id', 'm.title',
                    DB::raw('COUNT(ut.id) as total_enrolled'),
                    DB::raw("SUM(CASE WHEN ut.status = 'completed' THEN 1 ELSE 0 END) as completed"),
                    DB::raw("SUM(CASE WHEN ut.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress"),
                    DB::raw("SUM(CASE WHEN ut.status = 'pending' THEN 1 ELSE 0 END) as pending"),
                    DB::raw("ROUND((SUM(CASE WHEN ut.status = 'completed' THEN 1 ELSE 0 END) / COUNT(ut.id)) * 100, 2) as completion_rate")
                )
                ->groupBy('m.id', 'm.title')
                ->orderBy('total_enrolled', 'desc')
                ->limit(20)
                ->get();

            // ===== 4. LEARNER PROGRESS DATA =====
            $learnerProgress = $this->getLearnerProgress();

            // ===== 5. ASSESSMENT & SCORE DATA =====
            $examPerformance = DB::table('exam_attempts as ea')
                ->join('users as u', 'ea.user_id', '=', 'u.id')
                ->select(
                    'u.id', 'u.name',
                    DB::raw('COUNT(ea.id) as total_attempts'),
                    DB::raw('ROUND(AVG(ea.score), 2) as avg_score'),
                    DB::raw('MAX(ea.score) as highest_score'),
                    DB::raw('MIN(ea.score) as lowest_score')
                )
                ->groupBy('u.id', 'u.name')
                ->orderBy('avg_score', 'desc')
                ->limit(20)
                ->get();

            // ===== 6. QUESTION PERFORMANCE DATA =====
            $questionPerformance = $this->getQuestionAnalysis();

            // ===== 7. TREND DATA (Weekly/Daily) =====
            $trendData = $this->getWeeklyTrend();

            // ===== 8. TOP PERFORMERS & STRUGGLERS =====
            $topPerformers = $this->getTopComplianceUsers();
            $strugglers = DB::table('users as u')
                ->leftJoin('user_trainings as ut', 'u.id', '=', 'ut.user_id')
                ->select('u.id', 'u.name', 'u.department',
                    DB::raw('COUNT(ut.id) as total_modules'),
                    DB::raw("SUM(CASE WHEN ut.status = 'completed' THEN 1 ELSE 0 END) as completed"),
                    DB::raw("CASE WHEN COUNT(ut.id) > 0 THEN ROUND((SUM(CASE WHEN ut.status = 'completed' THEN 1 ELSE 0 END) / COUNT(ut.id)) * 100, 2) ELSE 0 END as completion_rate")
                )
                ->where('u.role', '!=', 'admin')
                ->groupBy('u.id', 'u.name', 'u.department')
                ->orderBy('completion_rate', 'asc')
                ->limit(10)
                ->get();

            // ===== 9. ENGAGEMENT METRICS =====
            $lastWeekEnrollments = DB::table('user_trainings')
                ->where('created_at', '>=', Carbon::now()->subDays(7))
                ->count();
            
            $lastWeekCompletions = DB::table('user_trainings')
                ->where('status', 'completed')
                ->where('completed_at', '>=', Carbon::now()->subDays(7))
                ->count();

            // GET DEPARTMENTS
            $departments = Cache::remember('list_departments_comprehensive', 3600, function () {
                return User::select('department')->whereNotNull('department')->where('role', '!=', 'admin')->distinct()->pluck('department');
            });

            // ===== RETURN COMPREHENSIVE DATA TO FRONTEND =====
            return Inertia::render('Admin/Reports/ComprehensiveAdminReports', [
                // Core Statistics
                'stats' => $stats,
                
                // User Analytics
                'usersByDepartment' => $usersByDepartment,
                'usersByStatus' => $usersByStatus,
                
                // Module/Program Analytics
                'moduleStats' => $moduleStats,
                
                // Learner Data
                'learnerProgress' => $learnerProgress,
                
                // Assessment & Score Data
                'examPerformance' => $examPerformance,
                
                // Question/Item Analysis
                'questionPerformance' => $questionPerformance,
                
                // Trend Data
                'trendData' => $trendData,
                
                // Performance Metrics
                'topPerformers' => $topPerformers,
                'strugglers' => $strugglers,
                
                // Engagement Metrics
                'lastWeekEnrollments' => $lastWeekEnrollments,
                'lastWeekCompletions' => $lastWeekCompletions,
                
                // Supporting Data
                'departments' => $departments,
            ]);

        } catch (\Exception $e) {
            Log::error('Comprehensive Reports Error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Gagal memuat data laporan komprehensif: ' . $e->getMessage());
        }
    }

    /**
     * Display Unified Reports Page - Combined Dashboard + Compliance + Analytics
     * PREMIUM PAGE: All-in-one reports with Wondr design
     */
    public function indexUnified(Request $request)
    {
        $this->authorizeAdmin();

        try {
            // ===== PARSE DATE RANGE FROM QUERY PARAMETERS =====
            // Default: 30 hari terakhir jika tidak ada filter
            $startDate = $request->query('start_date') 
                ? Carbon::parse($request->query('start_date'))->startOfDay() 
                : Carbon::now()->subDays(30)->startOfDay();
            
            $endDate = $request->query('end_date') 
                ? Carbon::parse($request->query('end_date'))->endOfDay() 
                : Carbon::now()->endOfDay();

            // Cache Key Prefix agar cache unik per range tanggal
            $cacheKey = 'unified_' . $startDate->format('Ymd') . '_' . $endDate->format('Ymd');

            // ===== 1. COLLECT ALL STATISTICS (Filtered by Date) =====
            $stats = Cache::remember($cacheKey . '_stats', 300, function () use ($startDate, $endDate) {
                // User stats tidak dipengaruhi tanggal (snapshot saat ini)
                $totalUsers = User::count();
                $activeUsers = User::where('status', 'active')->count();
                $inactiveUsers = User::where('status', 'inactive')->count();
                
                // Training assignments dalam range tanggal
                $totalAssignments = DB::table('user_trainings')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count();
                
                $completedAssignments = DB::table('user_trainings')
                    ->where('status', 'completed')
                    ->whereBetween('updated_at', [$startDate, $endDate])
                    ->count();
                
                $inProgressAssignments = DB::table('user_trainings')
                    ->where('status', 'in_progress')
                    ->whereBetween('updated_at', [$startDate, $endDate])
                    ->count();
                
                // Exam attempts dalam range tanggal
                $totalExamAttempts = DB::table('exam_attempts')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count();
                
                $avgExamScore = round(
                    DB::table('exam_attempts')
                        ->whereBetween('created_at', [$startDate, $endDate])
                        ->avg('score') ?? 0, 
                    1
                );

                $avgModuleCompletion = $totalAssignments > 0 
                    ? round(($completedAssignments / $totalAssignments) * 100, 2) 
                    : 0;
                
                $totalDepartments = User::distinct('department')->count();
                
                return [
                    'total_users'           => $totalUsers,
                    'active_users'          => $activeUsers,
                    'inactive_users'        => $inactiveUsers,
                    'total_modules'         => Module::count(),
                    'active_modules'        => Module::where('is_active', true)->count(),
                    'total_assignments'     => $totalAssignments,
                    'completed_assignments' => $completedAssignments,
                    'in_progress_assignments' => $inProgressAssignments,
                    'pending_assignments'   => $totalAssignments - $completedAssignments - $inProgressAssignments,
                    'total_exam_attempts'   => $totalExamAttempts,
                    'avg_exam_score'        => $avgExamScore,
                    'compliance_rate'       => $avgModuleCompletion,
                    'avg_completion'        => $avgModuleCompletion,
                    'total_departments'     => $totalDepartments,
                ];
            });

            // ===== 2. ALL DATA COLLECTIONS =====
            $usersByDepartment = DB::table('users')
                ->where('role', '!=', 'admin')
                ->groupBy('department')
                ->select('department', DB::raw('COUNT(*) as count'))
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get()
                ->map(fn($item) => ['name' => $item->department ?? 'Tidak Diketahui', 'value' => $item->count]);

            $usersByStatus = DB::table('users')
                ->where('role', '!=', 'admin')
                ->groupBy('status')
                ->select('status', DB::raw('COUNT(*) as count'))
                ->get()
                ->map(fn($item) => ['name' => ucfirst($item->status), 'value' => $item->count]);

            $moduleStats = DB::table('user_trainings as ut')
                ->join('modules as m', 'ut.module_id', '=', 'm.id')
                ->whereBetween('ut.created_at', [$startDate, $endDate])
                ->select(
                    'm.id', 'm.title',
                    DB::raw('COUNT(ut.id) as total_enrolled'),
                    DB::raw("SUM(CASE WHEN ut.status = 'completed' THEN 1 ELSE 0 END) as completed"),
                    DB::raw("SUM(CASE WHEN ut.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress"),
                    DB::raw("SUM(CASE WHEN ut.status = 'pending' THEN 1 ELSE 0 END) as pending"),
                    DB::raw("ROUND((SUM(CASE WHEN ut.status = 'completed' THEN 1 ELSE 0 END) / NULLIF(COUNT(ut.id), 0)) * 100, 2) as completion_rate")
                )
                ->groupBy('m.id', 'm.title')
                ->orderBy('total_enrolled', 'desc')
                ->limit(20)
                ->get();

            $learnerProgress = $this->getLearnerProgressWithModuleScores($startDate, $endDate);

            $examPerformance = DB::table('exam_attempts as ea')
                ->join('users as u', 'ea.user_id', '=', 'u.id')
                ->whereBetween('ea.created_at', [$startDate, $endDate])
                ->select(
                    'u.id', 'u.name',
                    DB::raw('COUNT(ea.id) as total_attempts'),
                    DB::raw('ROUND(AVG(ea.score), 2) as avg_score'),
                    DB::raw('MAX(ea.score) as highest_score'),
                    DB::raw('MIN(ea.score) as lowest_score')
                )
                ->groupBy('u.id', 'u.name')
                ->orderBy('avg_score', 'desc')
                ->limit(20)
                ->get();

            $questionPerformance = $this->getQuestionAnalysis();
            
            // Dynamic Trend Data - groups by day if range <= 30 days, otherwise by week
            $daysDiff = $startDate->diffInDays($endDate);
            $groupByFormat = $daysDiff > 30 ? '%Y-%u' : '%Y-%m-%d';
            
            $trendData = DB::table('user_trainings')
                ->whereBetween('updated_at', [$startDate, $endDate])
                ->where('status', 'completed')
                ->select(
                    DB::raw("DATE_FORMAT(updated_at, '$groupByFormat') as date_group"),
                    DB::raw('COUNT(*) as completion')
                )
                ->groupBy('date_group')
                ->orderBy('date_group', 'asc')
                ->get()
                ->map(function($item) use ($groupByFormat) {
                    return [
                        'day_date' => $item->date_group,
                        'day_name' => $groupByFormat == '%Y-%u' 
                            ? 'Week ' . substr($item->date_group, 6) 
                            : Carbon::parse($item->date_group)->format('D, M d'),
                        'completion' => $item->completion,
                    ];
                });
            
            $topPerformers = $this->getTopComplianceUsers();
            
            $strugglers = DB::table('users as u')
                ->leftJoin('user_trainings as ut', 'u.id', '=', 'ut.user_id')
                ->select('u.id', 'u.name', 'u.department',
                    DB::raw('COUNT(ut.id) as total_modules'),
                    DB::raw("SUM(CASE WHEN ut.status = 'completed' THEN 1 ELSE 0 END) as completed"),
                    DB::raw("CASE WHEN COUNT(ut.id) > 0 THEN ROUND((SUM(CASE WHEN ut.status = 'completed' THEN 1 ELSE 0 END) / COUNT(ut.id)) * 100, 2) ELSE 0 END as completion_rate")
                )
                ->where('u.role', '!=', 'admin')
                ->groupBy('u.id', 'u.name', 'u.department')
                ->orderBy('completion_rate', 'asc')
                ->limit(10)
                ->get();

            $lastWeekEnrollments = DB::table('user_trainings')
                ->where('created_at', '>=', Carbon::now()->subDays(7))
                ->count();
            
            $lastWeekCompletions = DB::table('user_trainings')
                ->where('status', 'completed')
                ->where('completed_at', '>=', Carbon::now()->subDays(7))
                ->count();

            // ===== PHASE 1 NEW METRICS =====
            
            // 1. USER ENGAGEMENT SCORE
            $engagementScore = Cache::remember('user_engagement_score', 600, function () {
                $totalUsers = User::where('role', '!=', 'admin')->count();
                if ($totalUsers == 0) return 0;
                
                // Calculate engagement based on last activity, completion rate, and participation
                $engagedUsers = DB::table('users as u')
                    ->leftJoin('user_trainings as ut', 'u.id', '=', 'ut.user_id')
                    ->where('u.role', '!=', 'admin')
                    ->where('u.status', 'active')
                    ->where('ut.last_activity_at', '>=', Carbon::now()->subDays(7))
                    ->distinct('u.id')
                    ->count();
                
                return round(($engagedUsers / $totalUsers) * 100, 1);
            });

            // 2. DEPARTMENT PASS RATE RANKING
            $departmentPassRates = Cache::remember('department_pass_rates', 600, function () {
                $totalByDept = DB::table('users as u')
                    ->leftJoin('exam_attempts as ea', 'u.id', '=', 'ea.user_id')
                    ->where('u.role', '!=', 'admin')
                    ->groupBy('u.department')
                    ->select(
                        'u.department',
                        DB::raw('COUNT(DISTINCT ea.id) as total_exams'),
                        DB::raw('ROUND(AVG(ea.score), 2) as avg_score'),
                        DB::raw('COUNT(CASE WHEN ea.score >= 70 THEN 1 END) as passed'),
                        DB::raw('ROUND((COUNT(CASE WHEN ea.score >= 70 THEN 1 END) / COUNT(DISTINCT ea.id)) * 100, 2) as pass_rate')
                    )
                    ->havingRaw('COUNT(DISTINCT ea.id) > 0')
                    ->orderBy('pass_rate', 'desc')
                    ->limit(15)
                    ->get();
                
                return $totalByDept->map(function($item) {
                    return [
                        'name' => $item->department ?? 'Unknown',
                        'pass_rate' => (float)$item->pass_rate ?? 0,
                        'avg_score' => (float)$item->avg_score ?? 0,
                        'total_exams' => (int)$item->total_exams ?? 0
                    ];
                });
            });

            // 3. CERTIFICATE DISTRIBUTION
            $certificateStats = Cache::remember($cacheKey . '_cert_stats', 600, function () use ($startDate, $endDate) {
                $certData = DB::table('certificates')
                    ->whereBetween('issued_at', [$startDate, $endDate])
                    ->select(
                        DB::raw('COUNT(*) as total_issued'),
                        DB::raw("SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active"),
                        DB::raw("SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired"),
                        DB::raw("SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) as revoked")
                    )
                    ->first();
                
                $certByProgram = DB::table('certificates as c')
                    ->join('modules as m', 'c.module_id', '=', 'm.id')
                    ->whereBetween('c.issued_at', [$startDate, $endDate])
                    ->groupBy('m.id', 'm.title')
                    ->select('m.title', DB::raw('COUNT(c.id) as count'))
                    ->orderBy('count', 'desc')
                    ->limit(config('admin.reports.low_performers_limit', 10))
                    ->get();
                
                return [
                    'total_issued' => (int)($certData->total_issued ?? 0),
                    'active' => (int)($certData->active ?? 0),
                    'expired' => (int)($certData->expired ?? 0),
                    'revoked' => (int)($certData->revoked ?? 0),
                    'by_program' => $certByProgram->map(fn($item) => ['name' => $item->title, 'count' => $item->count])
                ];
            });

            // 4. OVERDUE TRAINING COUNT - Trainings not completed within date range
            $overdueTraining = DB::table('user_trainings as ut')
                ->join('users as u', 'ut.user_id', '=', 'u.id')
                ->where('ut.status', '!=', 'completed')
                ->whereBetween('ut.created_at', [$startDate, $endDate])
                ->select('u.id', 'u.name', 'u.department', 'ut.module_id', 'ut.enrolled_at', 
                    DB::raw('DATEDIFF(NOW(), ut.enrolled_at) as days_enrolled'))
                ->orderBy('ut.enrolled_at', 'asc')
                ->limit(20)
                ->get();
            
            $overdueCount = count($overdueTraining);

            // 5. PRE/POST TEST ANALYSIS
            $prePostAnalysis = Cache::remember('prepost_analysis', 600, function () {
                // Get pre-test scores
                $preTests = DB::table('exam_attempts as ea')
                    ->join('modules as m', 'ea.module_id', '=', 'm.id')
                    ->where('ea.exam_type', 'pretest')
                    ->select(
                        'm.id', 'm.title',
                        DB::raw('ROUND(AVG(ea.score), 2) as avg_pretest'),
                        DB::raw('COUNT(ea.id) as pretest_count')
                    )
                    ->groupBy('m.id', 'm.title')
                    ->get();
                
                // Get post-test scores
                $postTests = DB::table('exam_attempts as ea')
                    ->join('modules as m', 'ea.module_id', '=', 'm.id')
                    ->where('ea.exam_type', 'posttest')
                    ->select(
                        'm.id',
                        DB::raw('ROUND(AVG(ea.score), 2) as avg_posttest'),
                        DB::raw('COUNT(ea.id) as posttest_count')
                    )
                    ->groupBy('m.id')
                    ->get();
                
                // Merge and calculate improvement
                $preMap = $preTests->keyBy('id')->toArray();
                $postMap = $postTests->keyBy('id')->toArray();
                
                $allIds = array_unique(array_merge(array_keys($preMap), array_keys($postMap)));
                
                $result = [];
                foreach ($allIds as $moduleId) {
                    $pre = $preMap[$moduleId] ?? null;
                    $post = $postMap[$moduleId] ?? null;
                    
                    $preScore = $pre ? (float)$pre['avg_pretest'] : 0;
                    $postScore = $post ? (float)$post['avg_posttest'] : 0;
                    $improvement = $postScore - $preScore;
                    $improvementPct = $preScore > 0 ? round(($improvement / $preScore) * 100, 2) : 0;
                    
                    $result[] = [
                        'module_id' => $moduleId,
                        'module_title' => $pre['title'] ?? ($post['title'] ?? 'Unknown'),
                        'avg_pretest' => $preScore,
                        'avg_posttest' => $postScore,
                        'improvement' => round($improvement, 2),
                        'improvement_pct' => $improvementPct,
                        'mastery_rate' => $post ? round(($post['posttest_count'] > 0 ? ($post['posttest_count'] / max(1, $post['posttest_count'])) : 0) * 100, 2) : 0
                    ];
                }
                
                return collect($result)->sortByDesc('improvement_pct')->take(config('admin.reports.improvement_limit', 15))->values();
            });

            // Summary statistics
            $learningImpactSummary = [
                'overall_improvement' => $prePostAnalysis->isNotEmpty() 
                    ? round($prePostAnalysis->avg('improvement_pct'), 2) 
                    : 0,
                'total_modules_with_tests' => count($prePostAnalysis),
                'modules_with_improvement' => $prePostAnalysis->filter(fn($item) => $item['improvement'] > 0)->count()
            ];

            $departments = Cache::remember('list_departments_unified', 3600, function () {
                return User::select('department')->whereNotNull('department')->where('role', '!=', 'admin')->distinct()->pluck('department');
            });

            // ===== PHASE 2 STRATEGIC METRICS =====
            
            // 2.1 DEPARTMENT COMPLIANCE LEADERBOARD (Comparative Analysis)
            $departmentLeaderboard = Cache::remember($cacheKey . '_dept_leaderboard', 600, function () use ($startDate, $endDate) {
                $leaderboard = DB::table('users as u')
                    ->leftJoin('user_trainings as ut', 'u.id', '=', 'ut.user_id')
                    ->where('u.role', '!=', 'admin')
                    ->whereBetween('ut.created_at', [$startDate, $endDate])
                    ->groupBy('u.department')
                    ->select(
                        'u.department',
                        DB::raw('COUNT(DISTINCT u.id) as total_users'),
                        DB::raw('COUNT(DISTINCT ut.id) as total_assignments'),
                        DB::raw("SUM(CASE WHEN ut.status = 'completed' THEN 1 ELSE 0 END) as completed_assignments"),
                        DB::raw("ROUND((SUM(CASE WHEN ut.status = 'completed' THEN 1 ELSE 0 END) / NULLIF(COUNT(DISTINCT ut.id), 0)) * 100, 2) as completion_rate"),
                        DB::raw("ROUND(AVG(CASE WHEN ut.status = 'completed' THEN 100 WHEN ut.status = 'in_progress' THEN 50 ELSE 0 END), 1) as engagement_score")
                    )
                    ->havingRaw('COUNT(DISTINCT u.id) > 0')
                    ->orderBy('completion_rate', 'desc')
                    ->get();
                
                return $leaderboard->map(function($item, $index) {
                    return [
                        'rank' => $index + 1,
                        'department' => $item->department ?? 'Unknown',
                        'total_users' => (int)$item->total_users,
                        'total_assignments' => (int)$item->total_assignments,
                        'completed' => (int)$item->completed_assignments,
                        'completion_rate' => (float)$item->completion_rate ?? 0,
                        'engagement_score' => (float)$item->engagement_score ?? 0,
                        'badge' => $index == 0 ? '🏆' : ($index == 1 ? '🥈' : ($index == 2 ? '🥉' : ''))
                    ];
                })->take(config('admin.reports.top_performers_limit', 20));
            });

            // 2.2 QUESTION ITEM ANALYSIS (Hardest Questions)
            $questionItemAnalysis = Cache::remember('question_item_analysis', 600, function () {
                $hardestQuestions = DB::table('questions as q')
                    ->leftJoin('user_exam_answers as uea', 'q.id', '=', 'uea.question_id')
                    ->groupBy('q.id', 'q.question_text', 'q.points')
                    ->select(
                        'q.id',
                        'q.question_text',
                        'q.points',
                        DB::raw('COUNT(uea.id) as total_attempts'),
                        DB::raw("SUM(CASE WHEN uea.is_correct = false THEN 1 ELSE 0 END) as wrong_attempts"),
                        DB::raw("ROUND((SUM(CASE WHEN uea.is_correct = false THEN 1 ELSE 0 END) / COUNT(uea.id)) * 100, 1) as difficulty_index")
                    )
                    ->havingRaw('COUNT(uea.id) > 5')
                    ->orderBy('difficulty_index', 'desc')
                    ->limit(10)
                    ->get();
                
                return $hardestQuestions->map(function($item) {
                    $severity = $item->difficulty_index >= 80 ? 'critical' : ($item->difficulty_index >= 60 ? 'warning' : 'normal');
                    return [
                        'id' => $item->id,
                        'question' => substr($item->question_text, 0, 80) . (strlen($item->question_text) > 80 ? '...' : ''),
                        'full_question' => $item->question_text,
                        'points' => (int)$item->points,
                        'total_attempts' => (int)$item->total_attempts,
                        'wrong_attempts' => (int)$item->wrong_attempts,
                        'difficulty_index' => (float)$item->difficulty_index,
                        'severity' => $severity
                    ];
                });
            });

            // 2.3 AT-RISK USERS (Inactive > 7 days)
            $atRiskUsers = Cache::remember('at_risk_users', 300, function () {
                $atRisk = DB::table('users as u')
                    ->leftJoin('user_trainings as ut', 'u.id', '=', 'ut.user_id')
                    ->where('u.role', '!=', 'admin')
                    ->where('u.status', 'active')
                    ->where('ut.status', 'in_progress')
                    ->where(function($query) {
                        $query->where('ut.last_activity_at', '<', Carbon::now()->subDays(7))
                              ->orWhereNull('ut.last_activity_at');
                    })
                    ->select(
                        'u.id', 'u.name', 'u.email', 'u.department',
                        'ut.module_id',
                        DB::raw('DATEDIFF(NOW(), ut.last_activity_at) as days_inactive'),
                        DB::raw('DATEDIFF(NOW(), ut.enrolled_at) as days_since_enrollment'),
                        DB::raw("CASE WHEN DATEDIFF(NOW(), ut.enrolled_at) > 30 THEN 'overdue' WHEN DATEDIFF(NOW(), ut.enrolled_at) > 14 THEN 'urgent' ELSE 'at-risk' END as risk_level")
                    )
                    ->distinct()
                    ->orderBy('days_inactive', 'desc')
                    ->limit(25)
                    ->get();
                
                return $atRisk->map(function($item) {
                    return [
                        'id' => $item->id,
                        'name' => $item->name,
                        'email' => $item->email,
                        'department' => $item->department,
                        'days_inactive' => $item->days_inactive ?? 0,
                        'days_since_enrollment' => $item->days_since_enrollment ?? 0,
                        'risk_level' => $item->risk_level
                    ];
                })->toArray();
            });
            
            // Convert to collection for count/filter operations
            $atRiskCollection = collect($atRiskUsers);
            $atRiskCount = $atRiskCollection->count();
            $urgentCount = $atRiskCollection->filter(fn($u) => $u['risk_level'] === 'urgent')->count();
            $overdueCount = $atRiskCollection->filter(fn($u) => $u['risk_level'] === 'overdue')->count();

            // 2.4 LEARNING DURATION DISTRIBUTION (Time Analytics)
            $learningDurationStats = Cache::remember('learning_duration_stats', 600, function () {
                $durations = DB::table('user_trainings as ut')
                    ->join('modules as m', 'ut.module_id', '=', 'm.id')
                    ->where('ut.status', 'completed')
                    ->select(
                        'm.title',
                        DB::raw('AVG(ut.duration_minutes) as avg_duration'),
                        DB::raw('MIN(ut.duration_minutes) as min_duration'),
                        DB::raw('MAX(ut.duration_minutes) as max_duration'),
                        DB::raw('COUNT(ut.id) as completions'),
                        DB::raw("ROUND(STDDEV(ut.duration_minutes), 2) as std_dev"),
                        DB::raw("CASE WHEN AVG(ut.duration_minutes) > (SELECT AVG(duration_minutes) * 1.5 FROM user_trainings) THEN 'too-long' WHEN AVG(ut.duration_minutes) < (SELECT AVG(duration_minutes) * 0.3 FROM user_trainings) THEN 'too-short' ELSE 'normal' END as duration_flag")
                    )
                    ->groupBy('m.id', 'm.title')
                    ->orderBy('avg_duration', 'desc')
                    ->limit(15)
                    ->get();
                
                return $durations->map(function($item) {
                    $severity = 'normal';
                    if ($item->duration_flag === 'too-long') $severity = 'warning';
                    if ($item->duration_flag === 'too-short') $severity = 'alert';
                    
                    return [
                        'module' => $item->title,
                        'avg_duration' => round($item->avg_duration, 0),
                        'min_duration' => (int)$item->min_duration,
                        'max_duration' => (int)$item->max_duration,
                        'completions' => (int)$item->completions,
                        'std_dev' => (float)$item->std_dev,
                        'duration_flag' => $item->duration_flag,
                        'severity' => $severity
                    ];
                });
            });

            // ===== FEATURE: DROPOUT PREDICTION (Rule-Based) =====
            $dropoutPredictions = Cache::remember('dropout_predictions', 300, function () {
                $users = DB::table('users as u')
                    ->leftJoin('user_trainings as ut', 'u.id', '=', 'ut.user_id')
                    ->leftJoin('exam_attempts as ea', 'u.id', '=', 'ea.user_id')
                    ->where('u.role', '!=', 'admin')
                    ->where('u.status', 'active')
                    ->select(
                        'u.id', 'u.name', 'u.email', 'u.department',
                        DB::raw('MAX(ut.last_activity_at) as last_activity'),
                        DB::raw('AVG(ut.duration_minutes) as avg_session_duration'),
                        DB::raw('COUNT(CASE WHEN ea.score < 70 THEN 1 END) as failed_attempts'),
                        DB::raw('COUNT(CASE WHEN ea.score >= 70 THEN 1 END) as passed_attempts')
                    )
                    ->groupBy('u.id', 'u.name', 'u.email', 'u.department')
                    ->get();

                return $users->map(function($user) {
                    // Weighted Scoring Algorithm
                    $daysInactive = $user->last_activity ? Carbon::parse($user->last_activity)->diffInDays(Carbon::now()) : 30;
                    $failedAttempts = $user->failed_attempts ?? 0;
                    $sessionDuration = $user->avg_session_duration ?? 0;
                    $shortSessionPenalty = ($sessionDuration < 5) ? 1 : 0;
                    
                    // Formula: Skor Risiko = (H × 2) + (S × 3) + (L × 1)
                    $riskScore = ($daysInactive * 2) + ($failedAttempts * 3) + ($shortSessionPenalty * 1);
                    
                    // Normalize to 0-100 scale
                    $probabilityOfFailure = min(100, round(($riskScore / 50) * 100, 1));
                    
                    // Classify risk level
                    if ($probabilityOfFailure >= 70) {
                        $riskLevel = 'high';
                        $recommendation = 'Perlu intervensi HR segera - jadwalkan 1-on-1 coaching';
                    } elseif ($probabilityOfFailure >= 40) {
                        $riskLevel = 'medium';
                        $recommendation = 'Monitor ketat - tawarkan peer mentoring';
                    } else {
                        $riskLevel = 'low';
                        $recommendation = 'On track - lanjutkan support reguler';
                    }

                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'department' => $user->department,
                        'risk_score' => $riskScore,
                        'probability_of_failure' => $probabilityOfFailure,
                        'risk_level' => $riskLevel,
                        'days_inactive' => $daysInactive,
                        'failed_attempts' => $failedAttempts,
                        'session_duration' => round($sessionDuration, 1),
                        'recommendation' => $recommendation
                    ];
                })
                ->sortByDesc('probability_of_failure')
                ->take(config('admin.reports.risk_assessment_limit', 30))
                ->values();
            });

            // ===== FEATURE: PEAK PERFORMANCE TIME (Activity Heatmap) =====
            $peakPerformanceTime = Cache::remember('peak_performance_time', 600, function () {
                // Query activity by hour and day
                $heatmapData = DB::table('exam_attempts')
                    ->select(
                        DB::raw('DAYNAME(created_at) as day_name'),
                        DB::raw('HOUR(created_at) as hour'),
                        DB::raw('COUNT(*) as attempt_count'),
                        DB::raw('ROUND(AVG(score), 2) as avg_score'),
                        DB::raw('COUNT(CASE WHEN score >= 70 THEN 1 END) as passed_count')
                    )
                    ->where('created_at', '>=', Carbon::now()->subDays(30))
                    ->groupBy(DB::raw('DAYNAME(created_at)'), DB::raw('HOUR(created_at)'))
                    ->orderBy(DB::raw('HOUR(created_at)'))
                    ->get();

                // Organize data by day
                $daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                $organized = [];

                foreach ($daysOrder as $day) {
                    $organized[$day] = [];
                    for ($h = 6; $h <= 22; $h++) {
                        $hourData = $heatmapData->firstWhere(function($item) use ($day, $h) {
                            return $item->day_name === $day && $item->hour === $h;
                        });

                        $attempts = $hourData ? $hourData->attempt_count : 0;
                        $avgScore = $hourData ? (float)$hourData->avg_score : 0;
                        $passed = $hourData ? $hourData->passed_count : 0;
                        $intensity = $attempts ? min(1, $attempts / 20) : 0;

                        $organized[$day][$h] = [
                            'hour' => $h,
                            'day' => $day,
                            'attempts' => $attempts,
                            'avg_score' => $avgScore,
                            'passed' => $passed,
                            'intensity' => $intensity
                        ];
                    }
                }

                // Find peak hours
                $allFlat = $heatmapData->sortByDesc('avg_score')->take(config('admin.reports.top_scores_limit', 5));
                $peakHours = $allFlat->map(fn($item) => [
                    'day' => $item->day_name,
                    'hour' => $item->hour,
                    'score' => $item->avg_score,
                    'attempts' => $item->attempt_count
                ]);

                // Find worst hours
                $worstHours = $heatmapData->filter(fn($item) => $item->attempt_count > 5)
                    ->sortBy('avg_score')
                    ->take(3) // Top 3 worst performing hours
                    ->map(fn($item) => [
                        'day' => $item->day_name,
                        'hour' => $item->hour,
                        'score' => $item->avg_score,
                        'attempts' => $item->attempt_count
                    ]);

                return [
                    'heatmap' => $organized,
                    'peak_hours' => $peakHours->values(),
                    'worst_hours' => $worstHours->values(),
                    'insight' => 'Optimal learning time ditemukan - gunakan data ini untuk scheduling training'
                ];
            });

            // Get total unique enrolled users for accurate program stats
            $totalEnrolledUsers = DB::table('user_trainings')
                ->distinct('user_id')
                ->count('user_id');

            // ===== RENDER UNIFIED REPORTS PAGE =====
            return Inertia::render('Admin/Reports/UnifiedReports', [
                'stats' => $stats,
                'usersByDepartment' => $usersByDepartment,
                'usersByStatus' => $usersByStatus,
                'moduleStats' => $moduleStats,
                'totalEnrolledUsers' => $totalEnrolledUsers,
                'learnerProgress' => $learnerProgress,
                'examPerformance' => $examPerformance,
                'questionPerformance' => $questionPerformance,
                'trendData' => $trendData,
                'topPerformers' => $topPerformers,
                'strugglers' => $strugglers,
                'lastWeekEnrollments' => $lastWeekEnrollments,
                'lastWeekCompletions' => $lastWeekCompletions,
                'departments' => $departments,
                
                // Phase 1 New Metrics
                'engagementScore' => $engagementScore,
                'departmentPassRates' => $departmentPassRates,
                'certificateStats' => $certificateStats,
                'overdueTraining' => $overdueTraining,
                'overdueCount' => $overdueCount,
                'prePostAnalysis' => $prePostAnalysis,
                'learningImpactSummary' => $learningImpactSummary,
                
                // Phase 2 Strategic Metrics
                'departmentLeaderboard' => $departmentLeaderboard,
                'questionItemAnalysis' => $questionItemAnalysis,
                'atRiskUsers' => $atRiskUsers,
                'atRiskCount' => $atRiskCount,
                'urgentCount' => $urgentCount,
                'overdueCount' => $overdueCount,
                'learningDurationStats' => $learningDurationStats,
                
                // Phase 3 Predictive & Time Analytics
                'dropoutPredictions' => $dropoutPredictions,
                'peakPerformanceTime' => $peakPerformanceTime,
                
                // Date Range Info
                'dateRange' => [
                    'start' => $startDate->format('Y-m-d'),
                    'end' => $endDate->format('Y-m-d')
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Unified Reports Error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Gagal memuat unified reports: ' . $e->getMessage());
        }
    }

    // =========================================================================
    // FEATURE 1: INDIVIDUAL LEARNER REPORT CARD (Rapor Karyawan)
    // =========================================================================

    /**
     * Get comprehensive learner report card data
     * Includes: Learning Agility, Skill Mastery, Engagement, Credentials
     */
    public function getLearnerReportCard($userId)
    {
        $this->authorizeAdmin();

        try {
            $user = User::findOrFail($userId);
            
            // 1. LEARNING AGILITY - Average completion time vs company average
            $userTrainings = DB::table('user_trainings as ut')
                ->join('modules as m', 'ut.module_id', '=', 'm.id')
                ->where('ut.user_id', $userId)
                ->where('ut.status', 'completed')
                ->select(
                    'ut.id',
                    'm.title',
                    DB::raw('DATEDIFF(ut.completed_at, ut.enrolled_at) as days_to_complete'),
                    'ut.final_score',
                    'ut.completed_at'
                )
                ->orderBy('ut.completed_at', 'desc')
                ->get();

            $userAvgCompletion = $userTrainings->count() > 0 ? 
                round($userTrainings->avg('days_to_complete'), 1) : 0;
            
            $companyAvgCompletion = round(
                DB::table('user_trainings as ut')
                    ->where('status', 'completed')
                    ->selectRaw('AVG(DATEDIFF(ut.completed_at, ut.enrolled_at)) as avg_days')
                    ->value('avg_days') ?? 0,
                1
            );

            $learningAgility = [
                'user_avg_days' => $userAvgCompletion,
                'company_avg_days' => $companyAvgCompletion,
                'speed_index' => $companyAvgCompletion > 0 ? 
                    round(($companyAvgCompletion / $userAvgCompletion) * 100, 1) : 100,
                'performance' => $userAvgCompletion < $companyAvgCompletion ? 'excellent' : 'normal'
            ];

            // 2. SKILL MASTERY - Skills/Tags learned from completed modules
            $skillMastery = DB::table('user_trainings as ut')
                ->join('modules as m', 'ut.module_id', '=', 'm.id')
                ->leftJoin('module_tags as mtags', 'm.id', '=', 'mtags.module_id')
                ->leftJoin('tags as t', 'mtags.tag_id', '=', 't.id')
                ->where('ut.user_id', $userId)
                ->where('ut.status', 'completed')
                ->select('t.id', 't.tag_name', 't.color', DB::raw('COUNT(ut.id) as mastery_level'))
                ->whereNotNull('t.id')
                ->groupBy('t.id', 't.tag_name', 't.color')
                ->orderBy('mastery_level', 'desc')
                ->get();

            // 3. ENGAGEMENT - Login patterns and total learning time
            $totalLearningHours = round(
                DB::table('exam_attempts')
                    ->where('user_id', $userId)
                    ->sum(DB::raw('COALESCE(duration_minutes, 0)')) / 60,
                1
            );

            $activityLogs = DB::table('activity_logs')
                ->where('user_id', $userId)
                ->whereIn('action', ['login', 'course_start', 'course_complete'])
                ->select(DB::raw('DATE(created_at) as login_date'), DB::raw('COUNT(*) as login_count'))
                ->where('created_at', '>=', Carbon::now()->subDays(30))
                ->groupBy('login_date')
                ->orderBy('login_date', 'desc')
                ->get();

            $lastLoginDays = DB::table('activity_logs')
                ->where('user_id', $userId)
                ->where('action', 'login')
                ->max('created_at');
            
            $daysSinceLastLogin = $lastLoginDays ? 
                Carbon::parse($lastLoginDays)->diffInDays(now()) : 999;

            $engagement = [
                'total_learning_hours' => $totalLearningHours,
                'last_login_days' => $daysSinceLastLogin,
                'monthly_login_avg' => round($activityLogs->avg('login_count') ?? 0, 1),
                'login_trend' => $activityLogs->toArray()
            ];

            // 4. CREDENTIALS - Active and expired certificates
            $credentials = DB::table('certificates')
                ->join('modules as m', 'certificates.module_id', '=', 'm.id')
                ->where('certificates.user_id', $userId)
                ->select(
                    'certificates.id',
                    'certificates.certificate_number',
                    'm.title as training_title',
                    'certificates.score',
                    'certificates.issued_at',
                    'certificates.status',
                    DB::raw("CASE WHEN certificates.issued_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR) THEN 'active' ELSE 'expired' END as credential_status")
                )
                ->orderBy('certificates.issued_at', 'desc')
                ->get();

            $activeCredentials = $credentials->where('credential_status', 'active')->count();
            $expiredCredentials = $credentials->where('credential_status', 'expired')->count();

            // 5. OVERALL METRICS
            $totalModulesEnrolled = DB::table('user_trainings')
                ->where('user_id', $userId)
                ->count();
            
            $totalModulesCompleted = DB::table('user_trainings')
                ->where('user_id', $userId)
                ->where('status', 'completed')
                ->count();

            $avgExamScore = round(
                DB::table('exam_attempts')
                    ->where('user_id', $userId)
                    ->avg('score') ?? 0,
                1
            );

            return response()->json([
                'user' => $user,
                'learning_agility' => $learningAgility,
                'skill_mastery' => $skillMastery,
                'engagement' => $engagement,
                'credentials' => [
                    'active' => $activeCredentials,
                    'expired' => $expiredCredentials,
                    'details' => $credentials
                ],
                'overall_metrics' => [
                    'total_enrolled' => $totalModulesEnrolled,
                    'total_completed' => $totalModulesCompleted,
                    'completion_rate' => $totalModulesEnrolled > 0 ? 
                        round(($totalModulesCompleted / $totalModulesEnrolled) * 100, 1) : 0,
                    'avg_exam_score' => $avgExamScore,
                    'trainings' => $userTrainings
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Learner Report Card Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // FEATURE 2: PREDICTIVE DROP-OUT PROBABILITY
    // =========================================================================

    /**
     * Calculate drop-out risk for all users using weighted scoring
     * Risk Score = (H × 2) + (S × 3) + (L × 1)
     * H = Days since last login
     * S = Consecutive failed quiz attempts
     * L = Average session duration (if < 5 min, risk++
     */
    public function getDropoutPredictions()
    {
        $this->authorizeAdmin();

        try {
            $predictions = $this->calculateDropoutPredictions();

            return response()->json([
                'total_users' => count($predictions),
                'high_risk' => count(array_filter($predictions, fn($p) => $p['risk_level'] === 'high')),
                'medium_risk' => count(array_filter($predictions, fn($p) => $p['risk_level'] === 'medium')),
                'low_risk' => count(array_filter($predictions, fn($p) => $p['risk_level'] === 'low')),
                'predictions' => $predictions
            ]);
        } catch (\Exception $e) {
            Log::error('Dropout Prediction Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Calculate dropout predictions (internal method for both API and exports)
     */
    private function calculateDropoutPredictions()
    {
        return Cache::remember('dropout_predictions_cache', 300, function() {
            $users = User::where('role', '!=', 'admin')->get();
            
            $predictions = $users->map(function($user) {
                // FACTOR 1 (40%): Inactivity Score - days since last login
                $lastLogin = DB::table('activity_logs')
                    ->where('user_id', $user->id)
                    ->where('action', 'login')
                    ->max('created_at');
                
                $daysSinceLogin = $lastLogin ? 
                    Carbon::parse($lastLogin)->diffInDays(now()) : 30;
                $inactivityDays = min($daysSinceLogin, 30); // Cap at 30 days
                // Scale 0-30 days to 0-100 score
                $factor1_inactivity = ($inactivityDays / 30) * 100;

                // FACTOR 2 (25%): Learning Progress - completion rate vs expected enrollment time
                $enrollmentDate = $user->created_at;
                $daysEnrolled = Carbon::parse($enrollmentDate)->diffInDays(now());
                
                $totalModules = DB::table('modules')
                    ->where('is_active', true)
                    ->count();
                
                $completedModules = DB::table('user_trainings')
                    ->where('user_trainings.user_id', $user->id)
                    ->where('user_trainings.status', 'completed')
                    ->count();
                
                $expectedCompletionRate = min(($daysEnrolled / 90) * 100, 100); // Assume 90 days for full completion
                $actualCompletionRate = $totalModules > 0 ? ($completedModules / $totalModules) * 100 : 0;
                $factor2_progress = max(100 - $actualCompletionRate, 0); // Inverse: lower progress = higher risk

                // FACTOR 3 (20%): Assessment Performance - failed exam rate + low scores
                $totalExams = DB::table('exam_attempts')
                    ->where('user_id', $user->id)
                    ->count();
                
                $failedExams = DB::table('exam_attempts')
                    ->where('user_id', $user->id)
                    ->where('is_passed', false)
                    ->count();
                
                $avgScore = DB::table('exam_attempts')
                    ->where('user_id', $user->id)
                    ->avg('score') ?? 0;
                
                $failureRate = $totalExams > 0 ? ($failedExams / $totalExams) * 100 : 0;
                $lowScoreRisk = max(100 - $avgScore, 0); // Inverse: lower score = higher risk
                $factor3_assessment = ($failureRate * 0.6) + ($lowScoreRisk * 0.4); // 60% weight to failure, 40% to low scores

                // FACTOR 4 (10%): Engagement Depth - session duration + frequency
                $sessionCount = DB::table('exam_attempts')
                    ->where('user_id', $user->id)
                    ->where('created_at', '>=', Carbon::now()->subDays(14))
                    ->count();
                
                $avgSessionDuration = DB::table('exam_attempts')
                    ->where('user_id', $user->id)
                    ->avg(DB::raw('COALESCE(duration_minutes, 0)')) ?? 0;
                
                $expectedSessionsPerWeek = 3; // Benchmark
                $sessionsPerWeek = ($sessionCount / 2); // Past 14 days
                $engagementFrequencyRisk = max(100 - (($sessionsPerWeek / $expectedSessionsPerWeek) * 100), 0);
                $engagementDurationRisk = $avgSessionDuration < 10 ? 100 : max(100 - ($avgSessionDuration / 60 * 100), 0);
                $factor4_engagement = ($engagementFrequencyRisk * 0.6) + ($engagementDurationRisk * 0.4);

                // FACTOR 5 (3%): Behavioral Pattern - consecutive inactive days
                $lastActivity = DB::table('activity_logs')
                    ->where('user_id', $user->id)
                    ->max('created_at');
                
                $consecutiveInactiveDays = $lastActivity ? 
                    Carbon::parse($lastActivity)->diffInDays(now()) : 30;
                $factor5_behavior = min(($consecutiveInactiveDays / 14) * 100, 100); // 14 days = 100% risk

                // FACTOR 6 (2%): Course Completion Trend - declining completion rate detection
                $previousCompletionRate = DB::table('user_trainings')
                    ->where('user_id', $user->id)
                    ->where('status', 'completed')
                    ->whereDate('completed_at', '<', Carbon::now()->subDays(7))
                    ->count();
                
                $currentCompletionRate = DB::table('user_trainings')
                    ->where('user_id', $user->id)
                    ->where('status', 'completed')
                    ->whereDate('completed_at', '>=', Carbon::now()->subDays(7))
                    ->count();
                
                $trend = $previousCompletionRate > 0 ? 
                    (($previousCompletionRate - $currentCompletionRate) / $previousCompletionRate) * 100 : 0;
                $factor6_trend = max($trend, 0); // Only count declining trends

                // Calculate weighted risk score
                $riskScore = 
                    ($factor1_inactivity * 0.40) +
                    ($factor2_progress * 0.25) +
                    ($factor3_assessment * 0.20) +
                    ($factor4_engagement * 0.10) +
                    ($factor5_behavior * 0.03) +
                    ($factor6_trend * 0.02);
                
                $riskScore = round($riskScore, 1);

                // Determine risk level and intervention type
                if ($riskScore >= 75) {
                    $riskLevel = 'high';
                    $interventionType = 'immediate';
                    $recommendation = 'Perlu intervensi segera - Kontak user untuk assessment';
                } elseif ($riskScore >= 50) {
                    $riskLevel = 'medium';
                    $interventionType = 'proactive';
                    $recommendation = 'Monitor ketat - Tawarkan dukungan dan resources tambahan';
                } else {
                    $riskLevel = 'low';
                    $interventionType = 'standard';
                    $recommendation = 'User on track - Pertahankan momentum dan engagement';
                }

                return [
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'department' => $user->department,
                    'risk_score' => $riskScore,
                    'risk_percentage' => round($riskScore, 0),
                    'probability_of_failure' => $riskScore, // Same as risk_score (0-100)
                    'risk_level' => $riskLevel,
                    'intervention_type' => $interventionType,
                    'recommendation' => $recommendation,
                    'score_breakdown' => [
                        'inactivity' => round($factor1_inactivity, 1),
                        'progress' => round($factor2_progress, 1),
                        'assessment' => round($factor3_assessment, 1),
                        'engagement' => round($factor4_engagement, 1),
                        'behavior' => round($factor5_behavior, 1),
                        'trend' => round($factor6_trend, 1)
                    ],
                    'risk_factors' => $this->identifyRiskFactors(
                        $factor1_inactivity, $factor2_progress, $factor3_assessment, 
                        $factor4_engagement, $factor5_behavior, $factor6_trend
                    ),
                    'factors' => [
                        'days_since_login' => $inactivityDays,
                        'failed_attempts_week' => $failedExams,
                        'avg_session_minutes' => round($avgSessionDuration, 0)
                    ],
                    'metrics' => [
                        'days_since_login' => $inactivityDays,
                        'completion_rate' => round($actualCompletionRate, 1),
                        'avg_score' => round($avgScore, 1),
                        'sessions_last_14_days' => $sessionCount,
                        'days_enrolled' => $daysEnrolled
                    ]
                ];
            })
            ->sortByDesc('probability_of_failure')
            ->values()
            ->toArray();

            return $predictions;
        });
    }

    /**
     * Identify dominant risk factors
     */
    private function identifyRiskFactors($inactivity, $progress, $assessment, $engagement, $behavior, $trend)
    {
        $factors = [
            ['name' => 'Inactivity', 'score' => $inactivity, 'weight' => 0.40],
            ['name' => 'Progress Lag', 'score' => $progress, 'weight' => 0.25],
            ['name' => 'Assessment Issues', 'score' => $assessment, 'weight' => 0.20],
            ['name' => 'Low Engagement', 'score' => $engagement, 'weight' => 0.10],
            ['name' => 'Behavioral Patterns', 'score' => $behavior, 'weight' => 0.03],
            ['name' => 'Declining Trend', 'score' => $trend, 'weight' => 0.02]
        ];

        // Sort by weighted score and return top 3
        $topFactors = collect($factors)
            ->map(function($factor) {
                $factor['weighted_score'] = $factor['score'] * $factor['weight'];
                return $factor;
            })
            ->sortByDesc('weighted_score')
            ->take(3)
            ->map(function($factor) {
                return [
                    'name' => $factor['name'],
                    'score' => round($factor['score'], 1),
                    'impact' => round($factor['weighted_score'], 1)
                ];
            })
            ->values()
            ->toArray();

        return $topFactors;
    }

    // =========================================================================
    // FEATURE 3: PEAK PERFORMANCE TIME (Learning Habit Analytics - Heatmap)
    // =========================================================================

    /**
     * Analyze peak performance times using heatmap data
     * Returns: Hour × Day matrix with avg scores and attempt counts
     */
    public function getPeakPerformanceHeatmap($departmentFilter = null)
    {
        $this->authorizeAdmin();

        try {
            // Create cache key with department filter
            $cacheKey = 'peak_performance_heatmap_' . ($departmentFilter ?? 'all');
            
            $heatmapData = Cache::remember($cacheKey, 3600, function() use ($departmentFilter) {
                // Optimized single query with all aggregations
                $query = DB::table('exam_attempts as ea')
                    ->join('users as u', 'ea.user_id', '=', 'u.id')
                    ->select(
                        DB::raw('HOUR(ea.created_at) as hour_of_day'),
                        DB::raw('DAYNAME(ea.created_at) as day_name'),
                        DB::raw('WEEKDAY(ea.created_at) as day_number'),
                        DB::raw('AVG(ea.score) as avg_score'),
                        DB::raw('COUNT(ea.id) as attempt_count'),
                        DB::raw('SUM(CASE WHEN ea.is_passed = 1 THEN 1 ELSE 0 END) as passed_count'),
                        DB::raw('MAX(ea.score) as max_score'),
                        DB::raw('MIN(ea.score) as min_score'),
                        DB::raw('STDDEV(ea.score) as score_stddev')
                    )
                    ->where('ea.created_at', '>=', Carbon::now()->subDays(60));

                if ($departmentFilter && $departmentFilter !== 'all') {
                    $query->where('u.department', $departmentFilter);
                }

                return $query
                    ->groupBy(DB::raw('HOUR(ea.created_at), DAYNAME(ea.created_at), WEEKDAY(ea.created_at)'))
                    ->orderBy('day_number')
                    ->orderBy('hour_of_day')
                    ->get();
            });

            // Build heatmap grid with intensity calculation
            $heatmapGrid = [];
            $dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            $allScores = $heatmapData->pluck('avg_score')->filter()->toArray();
            $maxScore = count($allScores) > 0 ? max($allScores) : 100;
            $minScore = count($allScores) > 0 ? min($allScores) : 0;
            $baseline = 70; // Baseline for intensity scoring
            
            foreach ($dayOrder as $dayIndex => $dayName) {
                $dayData = [];
                for ($hour = 0; $hour < 24; $hour++) {
                    $cellData = $heatmapData->first(function($item) use ($hour, $dayName) {
                        return $item->hour_of_day == $hour && $item->day_name == $dayName;
                    });

                    $avgScore = $cellData?->avg_score ? round($cellData->avg_score, 1) : 0;
                    $passRate = $cellData && $cellData->attempt_count > 0 
                        ? round(($cellData->passed_count / $cellData->attempt_count) * 100, 1) 
                        : 0;
                    
                    // Intensity: 0-1 scale, normalized against baseline (70)
                    if ($avgScore > 0) {
                        $intensity = min(round(($avgScore / 100) * 2, 2), 1);
                    } else {
                        $intensity = 0;
                    }

                    $dayData[] = [
                        'hour' => $hour,
                        'day' => $dayName,
                        'avg_score' => $avgScore,
                        'pass_rate' => $passRate,
                        'attempt_count' => $cellData?->attempt_count ?? 0,
                        'intensity' => $intensity,
                        'max_score' => $cellData?->max_score ? round($cellData->max_score, 1) : 0,
                        'min_score' => $cellData?->min_score ? round($cellData->min_score, 1) : 0
                    ];
                }
                $heatmapGrid[] = [
                    'day' => $dayName,
                    'hours' => $dayData
                ];
            }

            // Find peak performance times (highest avg_score)
            $peakTimes = collect($heatmapData)
                ->sortByDesc('avg_score')
                ->take(5)
                ->map(function($item) {
                    return [
                        'time' => sprintf('%02d:00 - %02d:00', $item->hour_of_day, $item->hour_of_day + 1),
                        'day' => $item->day_name,
                        'avg_score' => round($item->avg_score, 1),
                        'pass_rate' => round(($item->passed_count / $item->attempt_count) * 100, 1),
                        'attempts' => $item->attempt_count
                    ];
                })->values();

            // Low performance times (lowest avg_score, filter by minimum attempts)
            $lowPerformanceTimes = collect($heatmapData)
                ->filter(function($item) {
                    return $item->attempt_count >= 3; // Only consider slots with at least 3 attempts
                })
                ->sortBy('avg_score')
                ->take(5)
                ->map(function($item) {
                    return [
                        'time' => sprintf('%02d:00 - %02d:00', $item->hour_of_day, $item->hour_of_day + 1),
                        'day' => $item->day_name,
                        'avg_score' => round($item->avg_score, 1),
                        'pass_rate' => round(($item->passed_count / $item->attempt_count) * 100, 1),
                        'attempts' => $item->attempt_count
                    ];
                })->values();

            // Calculate overall insights
            $overallAvgScore = round($heatmapData->avg('avg_score'), 1);
            $totalAttempts = $heatmapData->sum('attempt_count');
            $totalPassed = $heatmapData->sum('passed_count');
            $overallPassRate = $totalAttempts > 0 
                ? round(($totalPassed / $totalAttempts) * 100, 1) 
                : 0;

            return response()->json([
                'success' => true,
                'heatmap_grid' => $heatmapGrid,
                'peak_times' => $peakTimes,
                'low_performance_times' => $lowPerformanceTimes,
                'insights' => [
                    'best_time' => $peakTimes->first() ? $peakTimes->first()['day'] . ' ' . $peakTimes->first()['time'] : 'N/A',
                    'worst_time' => $lowPerformanceTimes->first() ? $lowPerformanceTimes->first()['day'] . ' ' . $lowPerformanceTimes->first()['time'] : 'N/A',
                    'avg_score' => $overallAvgScore,
                    'overall_pass_rate' => $overallPassRate,
                    'total_attempts' => $totalAttempts,
                    'total_passed' => $totalPassed
                ],
                'recommendations' => [
                    'primary' => "Waktu terbaik untuk training: " . ($peakTimes->first()['day'] ?? 'N/A') . " jam " . ($peakTimes->first()['time'] ?? 'N/A'),
                    'secondary' => "Hindari training di: " . ($lowPerformanceTimes->first()['day'] ?? 'N/A') . " jam " . ($lowPerformanceTimes->first()['time'] ?? 'N/A'),
                    'note' => "Data dari 60 hari terakhir dengan " . $totalAttempts . " attempt"
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Peak Performance Heatmap Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate heatmap: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get department-specific peak performance times
     */
    public function getDepartmentPeakPerformance($department)
    {
        return $this->getPeakPerformanceHeatmap($department);
    }

    /**
     * Export Unified Reports as Excel with 9 professional sheets
     */
    public function exportUnifiedReportsExcel(Request $request)
    {
        try {
            // Get date range from request
            $startDate = $request->query('start_date') ? Carbon::parse($request->query('start_date'))->startOfDay() : Carbon::now()->subMonths(1)->startOfDay();
            $endDate = $request->query('end_date') ? Carbon::parse($request->query('end_date'))->endOfDay() : Carbon::now()->endOfDay();

            // Gather all data from unified reports (same filtering as indexUnified)
            $stats = Cache::remember('admin_unified_stats_' . $startDate->format('Ymd') . '_' . $endDate->format('Ymd'), 300, function () use ($startDate, $endDate) {
                $totalUsers = User::count();
                $activeUsers = User::where('status', 'active')->count();
                $inactiveUsers = User::where('status', 'inactive')->count();
                $totalModules = Module::count();
                $activeModules = Module::where('is_active', true)->count();
                
                // Apply date filtering to assignments
                $totalAssignments = DB::table('user_trainings')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count();
                $completedAssignments = DB::table('user_trainings')
                    ->where('status', 'completed')
                    ->whereBetween('updated_at', [$startDate, $endDate])
                    ->count();
                $inProgressAssignments = DB::table('user_trainings')
                    ->where('status', 'in_progress')
                    ->whereBetween('updated_at', [$startDate, $endDate])
                    ->count();
                
                // Apply date filtering to exams
                $totalExamAttempts = DB::table('exam_attempts')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count();
                $avgExamScore = round(DB::table('exam_attempts')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->avg('score') ?? 0, 1);
                
                $avgModuleCompletion = $totalAssignments > 0 ? round(($completedAssignments / $totalAssignments) * 100, 2) : 0;
                $totalDepartments = User::distinct('department')->count();
                
                return [
                    'total_users' => $totalUsers,
                    'active_users' => $activeUsers,
                    'inactive_users' => $inactiveUsers,
                    'total_modules' => $totalModules,
                    'active_modules' => $activeModules,
                    'total_assignments' => $totalAssignments,
                    'completed_assignments' => $completedAssignments,
                    'in_progress_assignments' => $inProgressAssignments,
                    'total_exam_attempts' => $totalExamAttempts,
                    'avg_exam_score' => $avgExamScore,
                    'compliance_rate' => $avgModuleCompletion,
                    'avg_completion' => $avgModuleCompletion,
                    'total_departments' => $totalDepartments,
                ];
            });

            $departmentLeaderboard = DB::table('users as u')
                ->leftJoin('user_trainings as ut', 'u.id', '=', 'ut.user_id')
                ->where('u.role', '!=', 'admin')
                ->whereBetween('ut.created_at', [$startDate, $endDate])
                ->groupBy('u.department')
                ->select(
                    'u.department',
                    DB::raw('COUNT(DISTINCT u.id) as total_users'),
                    DB::raw('COUNT(CASE WHEN ut.status = "completed" THEN 1 END) as completed_modules'),
                    DB::raw('COUNT(ut.id) as total_modules'),
                    DB::raw('ROUND((COUNT(CASE WHEN ut.status = "completed" THEN 1 END) / NULLIF(COUNT(ut.id), 0)) * 100, 2) as completion_rate')
                )
                ->orderBy('completion_rate', 'desc')
                ->limit(10)
                ->get()
                ->map(function($item) {
                    return [
                        'department' => $item->department ?? 'Unknown',
                        'total_users' => $item->total_users,
                        'completion_rate' => (float)($item->completion_rate ?? 0)
                    ];
                })->toArray();

            $learnerProgress = $this->getLearnerProgressWithModuleScores($startDate, $endDate);
            $atRiskUsers = $this->getAtRiskUsers();
            $certificateStats = $this->getCertificateStats();
            $overdueTraining = $this->getOverdueTraining($startDate, $endDate);
            $prePostAnalysis = $this->getPrePostAnalysis();
            $questionItemAnalysis = $this->getQuestionItemAnalysis();
            
            // Wrap risky methods in try-catch to handle missing tables gracefully
            $dropoutPredictions = [];
            $peakPerformanceTime = [];
            try {
                $dropoutPredictions = $this->calculateDropoutPredictions();
                $peakPerformanceTime = $this->getPeakPerformanceHeatmap();
            } catch (\Exception $e) {
                \Log::warning('Dropout predictions/peak performance data unavailable: ' . $e->getMessage());
            }
            
            // Collect all additional data with error handling
            $moduleStats = [];
            $examPerformance = [];
            $trendData = [];
            $quizDifficulty = [];
            $complianceAudit = [];
            $prerequisiteCompliance = [];
            $engagementAnalytics = [];
            $performanceHeatmap = [];
            $trainingMaterials = [];
            $programEnrollment = [];
            $resourceUtilization = [];
            $dormantUsers = [];
            $skillDevelopment = [];
            $demographics = [];
            $certificateDistribution = [];
            $moduleTimeline = [];
            
            try {
                $moduleStats = $this->getModuleStats();
                $examPerformance = $this->getExamPerformance();
                $trendData = $this->getTrendData();
                $quizDifficulty = $this->getQuizDifficultyAnalysis();
                $complianceAudit = $this->getComplianceAudit();
                $prerequisiteCompliance = $this->getPrerequisiteCompliance();
                $engagementAnalytics = $this->getEngagementAnalytics();
                $performanceHeatmap = $this->getPerformanceHeatmap();
                $trainingMaterials = $this->getTrainingMaterials();
                $programEnrollment = $this->getProgramEnrollment();
                $resourceUtilization = $this->getResourceUtilization();
                $dormantUsers = $this->getDormantUsers();
                $skillDevelopment = $this->getSkillDevelopment();
                $demographics = $this->getDemographics();
                $certificateDistribution = $this->getCertificateDistribution();
                $moduleTimeline = $this->getModuleTimeline();
            } catch (\Exception $e) {
                \Log::warning('Some export data unavailable: ' . $e->getMessage());
            }

            $totalModules = count($prePostAnalysis);
            $modulesWithImprovement = count(array_filter($prePostAnalysis, fn($item) => ($item['improvement_pct'] ?? 0) > 5));
            $avgImprovement = $totalModules > 0 ? array_sum(array_column($prePostAnalysis, 'improvement_pct')) / $totalModules : 0;

            $data = [
                'stats' => $stats,
                'departmentLeaderboard' => $departmentLeaderboard,
                'learnerProgress' => $learnerProgress ?? [],
                'moduleStats' => $moduleStats ?? [],
                'examPerformance' => $examPerformance ?? [],
                'atRiskUsers' => $atRiskUsers ?? [],
                'atRiskCount' => count($atRiskUsers ?? []),
                'certificateStats' => $certificateStats ?? [],
                'overdueTraining' => $overdueTraining ?? [],
                'overdueCount' => count($overdueTraining ?? []),
                'prePostAnalysis' => $prePostAnalysis ?? [],
                'learningImpactSummary' => [
                    'total_modules_with_tests' => $totalModules,
                    'modules_with_improvement' => $modulesWithImprovement,
                    'overall_improvement' => round($avgImprovement, 2),
                ],
                'questionItemAnalysis' => $questionItemAnalysis ?? [],
                'trendData' => $trendData ?? [],
                'quizDifficulty' => $quizDifficulty ?? [],
                'complianceAudit' => $complianceAudit ?? [],
                'prerequisiteCompliance' => $prerequisiteCompliance ?? [],
                'engagementAnalytics' => $engagementAnalytics ?? [],
                'performanceHeatmap' => $performanceHeatmap ?? [],
                'trainingMaterials' => $trainingMaterials ?? [],
                'programEnrollment' => $programEnrollment ?? [],
                'resourceUtilization' => $resourceUtilization ?? [],
                'dormantUsers' => $dormantUsers ?? [],
                'skillDevelopment' => $skillDevelopment ?? [],
                'demographics' => $demographics ?? [],
                'certificateDistribution' => $certificateDistribution ?? [],
                'moduleTimeline' => $moduleTimeline ?? [],
                'engagementScore' => Cache::remember('engagement_score_export', 300, function () {
                    $totalUsers = User::where('role', '!=', 'admin')->count();
                    if ($totalUsers == 0) return 0;
                    $engagedUsers = DB::table('users as u')
                        ->leftJoin('user_trainings as ut', 'u.id', '=', 'ut.user_id')
                        ->where('u.role', '!=', 'admin')
                        ->where('u.status', 'active')
                        ->where('ut.last_activity_at', '>=', Carbon::now()->subDays(7))
                        ->distinct('u.id')
                        ->count();
                    return round(($engagedUsers / $totalUsers) * 100, 1);
                }),
                'dropoutPredictions' => $dropoutPredictions ?? [],
                'peakPerformanceTime' => $peakPerformanceTime ?? [],
                'dateRange' => [
                    'start' => $startDate->format('Y-m-d'),
                    'end' => $endDate->format('Y-m-d')
                ]
            ];

            $filename = 'UnifiedReports_' . $startDate->format('Y-m-d') . '_to_' . $endDate->format('Y-m-d') . '_' . date('Hi') . '.xlsx';

            // SOLUTION: Direct Download Response
            // Create Excel export and stream directly to browser
            // Use response()->streamDownload() to bypass Inertia middleware
            
            try {
                $export = new \App\Exports\UnifiedReportsExport($data);
                
                // Log for audit
                \Log::info('Unified Reports Export Started', [
                    'filename' => $filename,
                    'user_id' => auth()->id() ?? null,
                    'start_date' => $startDate->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d'),
                ]);
                
                // Stream Excel file directly to browser
                // This bypasses Inertia middleware since we're returning a StreamedResponse
                return Excel::download($export, $filename);
                
            } catch (\Exception $e) {
                \Log::error('Excel export error: ' . $e->getMessage(), [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString()
                ]);
                return redirect()->back()->withErrors(['export' => 'Export failed: ' . $e->getMessage()]);
            }
            
        } catch (\Exception $e) {
            \Log::error('Excel export error: ' . $e->getMessage() . ' ' . $e->getFile() . ':' . $e->getLine());
            return redirect()->back()->withErrors(['export' => 'Export failed: ' . $e->getMessage()]);
        }
    }

    /**
     * Export specific tab as Excel (for per-tab exports)
     */
    public function exportTabAsExcel($tab)
    {
        try {
            // Gather same data as above but simpler
            $stats = Cache::remember('admin_unified_stats', 300, function () {
                $totalUsers = User::count();
                $activeUsers = User::where('status', 'active')->count();
                $totalAssignments = DB::table('user_trainings')->count();
                $completedAssignments = DB::table('user_trainings')->where('status', 'completed')->count();
                $avgModuleCompletion = $totalAssignments > 0 ? round(($completedAssignments / $totalAssignments) * 100, 2) : 0;
                
                return [
                    'total_users' => $totalUsers,
                    'active_users' => $activeUsers,
                    'compliance_rate' => $avgModuleCompletion,
                    'avg_completion' => $avgModuleCompletion,
                ];
            });

            $learnerProgress = $this->getLearnerProgress();
            $atRiskUsers = $this->getAtRiskUsers();
            $certificateStats = $this->getCertificateStats();
            $overdueTraining = $this->getOverdueTraining();
            $prePostAnalysis = $this->getPrePostAnalysis();
            $questionItemAnalysis = $this->getQuestionItemAnalysis();
            $dropoutPredictions = $this->calculateDropoutPredictions();
            $peakPerformanceTime = $this->getPeakPerformanceHeatmap();
            
            // Collect all additional data
            $moduleStats = $this->getModuleStats();
            $examPerformance = $this->getExamPerformance();
            $trendData = $this->getTrendData();
            $quizDifficulty = $this->getQuizDifficultyAnalysis();
            $complianceAudit = $this->getComplianceAudit();
            $prerequisiteCompliance = $this->getPrerequisiteCompliance();
            $engagementAnalytics = $this->getEngagementAnalytics();
            $performanceHeatmap = $this->getPerformanceHeatmap();
            $trainingMaterials = $this->getTrainingMaterials();
            $programEnrollment = $this->getProgramEnrollment();
            $resourceUtilization = $this->getResourceUtilization();
            $dormantUsers = $this->getDormantUsers();
            $skillDevelopment = $this->getSkillDevelopment();
            $demographics = $this->getDemographics();
            $certificateDistribution = $this->getCertificateDistribution();
            $moduleTimeline = $this->getModuleTimeline();

            $data = [
                'stats' => $stats,
                'departmentLeaderboard' => [],
                'learnerProgress' => $learnerProgress ?? [],
                'moduleStats' => $moduleStats ?? [],
                'examPerformance' => $examPerformance ?? [],
                'atRiskUsers' => $atRiskUsers ?? [],
                'atRiskCount' => 0,
                'certificateStats' => $certificateStats ?? [],
                'overdueTraining' => $overdueTraining ?? [],
                'overdueCount' => 0,
                'prePostAnalysis' => $prePostAnalysis ?? [],
                'learningImpactSummary' => [],
                'questionItemAnalysis' => $questionItemAnalysis ?? [],
                'trendData' => $trendData ?? [],
                'quizDifficulty' => $quizDifficulty ?? [],
                'complianceAudit' => $complianceAudit ?? [],
                'prerequisiteCompliance' => $prerequisiteCompliance ?? [],
                'engagementAnalytics' => $engagementAnalytics ?? [],
                'performanceHeatmap' => $performanceHeatmap ?? [],
                'trainingMaterials' => $trainingMaterials ?? [],
                'programEnrollment' => $programEnrollment ?? [],
                'resourceUtilization' => $resourceUtilization ?? [],
                'dormantUsers' => $dormantUsers ?? [],
                'skillDevelopment' => $skillDevelopment ?? [],
                'demographics' => $demographics ?? [],
                'certificateDistribution' => $certificateDistribution ?? [],
                'moduleTimeline' => $moduleTimeline ?? [],
                'engagementScore' => 0,
                'dropoutPredictions' => $dropoutPredictions ?? [],
                'peakPerformanceTime' => $peakPerformanceTime ?? [],
            ];

            return Excel::download(
                new \App\Exports\UnifiedReportsExport($data),
                ucfirst($tab) . '_' . date('Y-m-d_Hi') . '.xlsx'
            );
        } catch (\Exception $e) {
            \Log::error('Tab export error: ' . $e->getMessage());
            return response()->json(['error' => 'Export failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get at-risk users (inactive > 7 days)
     */
    private function getAtRiskUsers()
    {
        return Cache::remember('at_risk_users', 300, function () {
            $atRisk = DB::table('users as u')
                ->leftJoin('user_trainings as ut', 'u.id', '=', 'ut.user_id')
                ->where('u.role', '!=', 'admin')
                ->where('u.status', 'active')
                ->where('ut.status', 'in_progress')
                ->where(function($query) {
                    $query->where('ut.last_activity_at', '<', Carbon::now()->subDays(7))
                          ->orWhereNull('ut.last_activity_at');
                })
                ->select(
                    'u.id', 'u.name', 'u.email', 'u.department',
                    'ut.module_id',
                    DB::raw('DATEDIFF(NOW(), ut.last_activity_at) as days_inactive'),
                    DB::raw('DATEDIFF(NOW(), ut.enrolled_at) as days_since_enrollment'),
                    DB::raw("CASE WHEN DATEDIFF(NOW(), ut.enrolled_at) > 30 THEN 'overdue' WHEN DATEDIFF(NOW(), ut.enrolled_at) > 14 THEN 'urgent' ELSE 'at-risk' END as risk_level")
                )
                ->distinct()
                ->orderBy('days_inactive', 'desc')
                ->limit(25)
                ->get();
            
            return $atRisk->map(function($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'email' => $item->email,
                    'department' => $item->department,
                    'days_inactive' => $item->days_inactive ?? 0,
                    'days_since_enrollment' => $item->days_since_enrollment ?? 0,
                    'risk_level' => $item->risk_level
                ];
            })->values()->toArray();
        });
    }

    /**
     * Get certificate statistics
     */
    private function getCertificateStats()
    {
        return Cache::remember('cert_stats', 600, function () {
            $certData = DB::table('certificates')
                ->select(
                    DB::raw('COUNT(*) as total_issued'),
                    DB::raw("SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active"),
                    DB::raw("SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired"),
                    DB::raw("SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) as revoked")
                )
                ->first();
            
            $certByProgram = DB::table('certificates as c')
                ->join('modules as m', 'c.module_id', '=', 'm.id')
                ->groupBy('m.id', 'm.title')
                ->select('m.title', DB::raw('COUNT(c.id) as count'))
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get();
            
            return [
                'total_issued' => (int)($certData->total_issued ?? 0),
                'active' => (int)($certData->active ?? 0),
                'expired' => (int)($certData->expired ?? 0),
                'revoked' => (int)($certData->revoked ?? 0),
                'by_program' => $certByProgram->map(fn($item) => ['name' => $item->title, 'count' => $item->count])->toArray()
            ];
        });
    }

    /**
     * Get overdue training with date range filtering
     */
    private function getOverdueTraining($startDate = null, $endDate = null)
    {
        $startDate = $startDate ?? Carbon::now()->subMonths(1)->startOfDay();
        $endDate = $endDate ?? Carbon::now()->endOfDay();

        return DB::table('user_trainings as ut')
            ->join('users as u', 'ut.user_id', '=', 'u.id')
            ->where('ut.status', '!=', 'completed')
            ->whereRaw('DATEDIFF(NOW(), ut.enrolled_at) > 30')
            ->whereBetween('ut.enrolled_at', [$startDate, $endDate])
            ->select('u.id', 'u.name', 'u.department', 'ut.module_id', 'ut.enrolled_at', 
                DB::raw('DATEDIFF(NOW(), ut.enrolled_at) as days_enrolled'))
            ->orderBy('ut.enrolled_at', 'asc')
            ->limit(20)
            ->get()
            ->map(function($item) {
                return [
                    'id' => $item->id,
                    'user_name' => $item->name,
                    'department' => $item->department,
                    'module_id' => $item->module_id,
                    'days_enrolled' => $item->days_enrolled ?? 0
                ];
            })->values()->toArray();
    }

    /**
     * Get pre-post analysis
     */
    private function getPrePostAnalysis()
    {
        return Cache::remember('prepost_analysis_method', 600, function () {
            // Get pre-test scores
            $preTests = DB::table('exam_attempts as ea')
                ->join('modules as m', 'ea.module_id', '=', 'm.id')
                ->where('ea.exam_type', 'pretest')
                ->select(
                    'm.id', 'm.title',
                    DB::raw('ROUND(AVG(ea.score), 2) as avg_pretest'),
                    DB::raw('COUNT(ea.id) as pretest_count')
                )
                ->groupBy('m.id', 'm.title')
                ->get();
            
            // Get post-test scores
            $postTests = DB::table('exam_attempts as ea')
                ->join('modules as m', 'ea.module_id', '=', 'm.id')
                ->where('ea.exam_type', 'posttest')
                ->select(
                    'm.id',
                    DB::raw('ROUND(AVG(ea.score), 2) as avg_posttest'),
                    DB::raw('COUNT(ea.id) as posttest_count')
                )
                ->groupBy('m.id')
                ->get();
            
            // Merge and calculate improvement
            $preMap = $preTests->keyBy('id')->toArray();
            $postMap = $postTests->keyBy('id')->toArray();
            
            $allIds = array_unique(array_merge(array_keys($preMap), array_keys($postMap)));
            
            $result = [];
            foreach ($allIds as $moduleId) {
                $pre = $preMap[$moduleId] ?? null;
                $post = $postMap[$moduleId] ?? null;
                
                $preScore = $pre ? (float)$pre['avg_pretest'] : 0;
                $postScore = $post ? (float)$post['avg_posttest'] : 0;
                $improvement = $postScore - $preScore;
                $improvementPct = $preScore > 0 ? round(($improvement / $preScore) * 100, 2) : 0;
                
                $result[] = [
                    'module_id' => $moduleId,
                    'module_title' => $pre['title'] ?? ($post['title'] ?? 'Unknown'),
                    'avg_pretest' => $preScore,
                    'avg_posttest' => $postScore,
                    'improvement' => round($improvement, 2),
                    'improvement_pct' => $improvementPct,
                    'mastery_rate' => $post ? round(($post['posttest_count'] > 0 ? ($post['posttest_count'] / max(1, $post['posttest_count'])) : 0) * 100, 2) : 0
                ];
            }
            
            return collect($result)->sortByDesc('improvement_pct')->take(config('admin.reports.improvement_limit', 15))->values()->toArray();
        });
    }

    /**
     * Get question item analysis
     */
    private function getQuestionItemAnalysis()
    {
        return Cache::remember('question_item_analysis', 600, function () {
            $hardestQuestions = DB::table('questions as q')
                ->leftJoin('user_exam_answers as uea', 'q.id', '=', 'uea.question_id')
                ->groupBy('q.id', 'q.question_text', 'q.points')
                ->select(
                    'q.id',
                    'q.question_text',
                    'q.points',
                    DB::raw('COUNT(uea.id) as total_attempts'),
                    DB::raw("SUM(CASE WHEN uea.is_correct = false THEN 1 ELSE 0 END) as wrong_attempts"),
                    DB::raw("ROUND((SUM(CASE WHEN uea.is_correct = false THEN 1 ELSE 0 END) / COUNT(uea.id)) * 100, 1) as difficulty_index")
                )
                ->havingRaw('COUNT(uea.id) > 5')
                ->orderBy('difficulty_index', 'desc')
                ->limit(10)
                ->get();
            
            return $hardestQuestions->map(function($item) {
                $severity = $item->difficulty_index >= 80 ? 'critical' : ($item->difficulty_index >= 60 ? 'warning' : 'normal');
                return [
                    'id' => $item->id,
                    'question' => substr($item->question_text, 0, 80) . (strlen($item->question_text) > 80 ? '...' : ''),
                    'full_question' => $item->question_text,
                    'points' => (int)$item->points,
                    'total_attempts' => (int)$item->total_attempts,
                    'wrong_attempts' => (int)$item->wrong_attempts,
                    'difficulty_index' => (float)$item->difficulty_index,
                    'severity' => $severity
                ];
            })->toArray();
        });
    }

    /**
     * Get module statistics for exam performance
     */
    private function getModuleStats()
    {
        return Cache::remember('module_stats_export', 300, function () {
            return DB::table('modules as m')
                ->leftJoin('user_trainings as ut', function($join) {
                    $join->on('m.id', '=', 'ut.module_id');
                })
                ->leftJoin('exam_attempts as ea', function($join) {
                    $join->on('ut.user_id', '=', 'ea.user_id')
                         ->on('ut.module_id', '=', 'ea.module_id');
                })
                ->select(
                    'm.id',
                    'm.title',
                    DB::raw('COUNT(DISTINCT ut.id) as total_enrolled'),
                    DB::raw('COUNT(DISTINCT CASE WHEN ut.status = "completed" THEN ut.id END) as total_completed'),
                    DB::raw('ROUND(AVG(CASE WHEN ea.score IS NOT NULL THEN ea.score END), 2) as avg_score'),
                    DB::raw('COUNT(DISTINCT ea.id) as total_assessments')
                )
                ->groupBy('m.id', 'm.title')
                ->get()
                ->map(function($item) {
                    $completionRate = $item->total_enrolled > 0 ? round(($item->total_completed / $item->total_enrolled) * 100, 2) : 0;
                    return [
                        'id' => $item->id,
                        'module_name' => $item->title,
                        'total_enrolled' => (int)$item->total_enrolled,
                        'total_completed' => (int)$item->total_completed,
                        'completion_rate' => (float)$completionRate,
                        'avg_score' => (float)($item->avg_score ?? 0),
                        'total_assessments' => (int)$item->total_assessments
                    ];
                })->toArray();
        });
    }

    /**
     * Get exam performance data
     */
    private function getExamPerformance()
    {
        return Cache::remember('exam_performance_export', 300, function () {
            return DB::table('exam_attempts as ea')
                ->leftJoin('modules as m', 'ea.module_id', '=', 'm.id')
                ->select(
                    'm.title as module_name',
                    'ea.exam_type',
                    DB::raw('COUNT(*) as total_attempts'),
                    DB::raw('ROUND(AVG(ea.score), 2) as avg_score'),
                    DB::raw('ROUND(MIN(ea.score), 2) as min_score'),
                    DB::raw('ROUND(MAX(ea.score), 2) as max_score'),
                    DB::raw('ROUND(AVG(ea.duration_minutes), 2) as avg_time_minutes')
                )
                ->groupBy('ea.exam_type', 'ea.module_id', 'm.title')
                ->get()
                ->map(function($item) {
                    return [
                        'module_name' => $item->module_name ?? 'Unknown',
                        'exam_type' => ucfirst(str_replace('_', ' ', $item->exam_type)),
                        'total_attempts' => (int)$item->total_attempts,
                        'avg_score' => (float)($item->avg_score ?? 0),
                        'min_score' => (float)($item->min_score ?? 0),
                        'max_score' => (float)($item->max_score ?? 0),
                        'avg_time_minutes' => (float)($item->avg_time_minutes ?? 0)
                    ];
                })->toArray();
        });
    }

    /**
     * Get trend data
     */
    private function getTrendData()
    {
        return Cache::remember('trend_data_export', 300, function () {
            return DB::table('user_trainings')
                ->select(
                    DB::raw("DATE(updated_at) as date"),
                    DB::raw("DATE_FORMAT(updated_at, '%Y-%m-%d') as formatted_date"),
                    DB::raw('COUNT(*) as completions'),
                    DB::raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed_today')
                )
                ->where('status', 'completed')
                ->where('updated_at', '>=', Carbon::now()->subDays(30))
                ->groupBy('date', 'formatted_date')
                ->orderBy('date', 'asc')
                ->get()
                ->map(function($item) {
                    return [
                        'date' => $item->formatted_date,
                        'completions' => (int)$item->completions,
                        'completed_today' => (int)$item->completed_today
                    ];
                })->toArray();
        });
    }

    /**
     * Get quiz difficulty analysis
     */
    private function getQuizDifficultyAnalysis()
    {
        return Cache::remember('quiz_difficulty_analysis', 300, function () {
            return DB::table('quizzes as q')
                ->leftJoin('modules as m', 'q.module_id', '=', 'm.id')
                // join exam_attempts by module_id and match quiz type to exam_type
                ->leftJoin('exam_attempts as ea', function($join) {
                    $join->on('ea.module_id', '=', 'q.module_id')
                         ->whereRaw("( (q.type = 'pretest' AND ea.exam_type = 'pre_test') OR (q.type = 'posttest' AND ea.exam_type = 'post_test') )");
                })
                ->select(
                    'q.id',
                    'q.name',
                    'm.title as module_name',
                    'q.difficulty',
                    DB::raw('ROUND(AVG(ea.score), 2) as avg_score'),
                    DB::raw('COUNT(CASE WHEN ea.score >= q.passing_score THEN 1 END) as pass_count'),
                    DB::raw('COUNT(ea.id) as total_attempts'),
                    DB::raw('ROUND((COUNT(CASE WHEN ea.score >= q.passing_score THEN 1 END) / NULLIF(COUNT(ea.id), 0)) * 100, 2) as pass_rate'),
                    DB::raw('COUNT(DISTINCT ea.user_id) as unique_takers'),
                    DB::raw('ROUND(AVG(ea.duration_minutes), 2) as avg_time_minutes'),
                    DB::raw('ROUND(q.quality_score, 2) as quality_score')
                )
                ->groupBy('q.id', 'q.name', 'm.title', 'q.difficulty', 'q.quality_score', 'q.passing_score')
                ->orderBy('avg_score', 'desc')
                ->get()
                ->map(function($item) {
                    $attemptsPerUser = $item->unique_takers > 0 ? round($item->total_attempts / $item->unique_takers, 2) : 0;
                    return [
                        'id' => $item->id,
                        'name' => $item->name,
                        'module_name' => $item->module_name ?? 'Unknown',
                        'difficulty' => $item->difficulty,
                        'avg_score' => (float)($item->avg_score ?? 0),
                        'pass_rate' => (float)($item->pass_rate ?? 0),
                        'attempts_per_user' => (float)$attemptsPerUser,
                        'avg_time_minutes' => (float)($item->avg_time_minutes ?? 0),
                        'quality_score' => (float)($item->quality_score ?? 0),
                        'total_attempts' => (int)$item->total_attempts
                    ];
                })->toArray();
        });
    }

    /**
     * Get compliance audit data
     */
    private function getComplianceAudit()
    {
        return Cache::remember('compliance_audit_export', 300, function () {
            $totalUsers = User::count();
            $completedUsers = DB::table('user_trainings')
                ->where('status', 'completed')
                ->distinct('user_id')
                ->count();
            $completionRate = $totalUsers > 0 ? round(($completedUsers / $totalUsers) * 100, 2) : 0;
            
            return [
                [
                    'category' => 'Training Completion',
                    'required' => '100%',
                    'actual' => $completionRate . '%',
                    'status' => $completionRate >= 100 ? 'Compliant' : 'Non-Compliant',
                    'gap' => max(0, 100 - $completionRate) . '%'
                ],
                [
                    'category' => 'Active Users',
                    'required' => '80%',
                    'actual' => round((User::where('status', 'active')->count() / max(1, $totalUsers)) * 100, 2) . '%',
                    'status' => 'Compliant',
                    'gap' => '0%'
                ]
            ];
        });
    }

    /**
     * Get prerequisite compliance data
     */
    private function getPrerequisiteCompliance()
    {
        return Cache::remember('prerequisite_compliance_export', 300, function () {
            // Return user-level prerequisite compliance data
            return DB::table('users as u')
                ->leftJoin('user_trainings as ut', 'u.id', '=', 'ut.user_id')
                ->leftJoin('modules as m', 'ut.module_id', '=', 'm.id')
                ->where('u.role', '!=', 'admin')
                ->select(
                    'u.id as user_id',
                    'u.name as user_name',
                    'm.title as module_name',
                    DB::raw("CASE WHEN ut.status = 'completed' THEN 1 ELSE 0 END as prerequisites_met"),
                    DB::raw("COALESCE(ut.status, 'not_started') as compliance_status"),
                    DB::raw('DATEDIFF(NOW(), ut.created_at) as days_until_required')
                )
                ->orderBy('u.id')
                ->limit(100)
                ->get()
                ->map(function($item) {
                    return [
                        'user_id' => $item->user_id,
                        'user_name' => $item->user_name ?? 'Unknown',
                        'program_name' => 'Training Program',
                        'module_name' => $item->module_name ?? 'Unknown',
                        'prerequisites_met' => (bool)$item->prerequisites_met,
                        'prerequisite_modules' => 'Module Prerequisites',
                        'compliance_status' => $item->compliance_status,
                        'days_until_required' => (int)($item->days_until_required ?? 0)
                    ];
                })->toArray();
        });
    }

    /**
     * Get engagement analytics
     */
    private function getEngagementAnalytics()
    {
        return Cache::remember('engagement_analytics_export', 300, function () {
            return DB::table('users as u')
                ->where('u.role', '!=', 'admin')
                ->select(
                    'u.id',
                    'u.name',
                    DB::raw('COUNT(DISTINCT ut.id) as modules_started'),
                    DB::raw('COUNT(CASE WHEN ut.last_activity_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as active_this_week'),
                    DB::raw('MAX(ut.last_activity_at) as last_active_date')
                )
                ->leftJoin('user_trainings as ut', 'u.id', '=', 'ut.user_id')
                ->groupBy('u.id', 'u.name')
                ->orderBy('active_this_week', 'desc')
                ->limit(50)
                ->get()
                ->map(function($item) {
                    $engagementScore = $item->modules_started > 0 ? min(100, ($item->active_this_week / max(1, $item->modules_started)) * 100) : 0;
                    return [
                        'user_id' => $item->id,
                        'user_name' => $item->name,
                        'modules_started' => (int)$item->modules_started,
                        'active_this_week' => (int)$item->active_this_week,
                        'engagement_score' => (float)round($engagementScore, 2),
                        'last_active' => $item->last_active_date ? substr($item->last_active_date, 0, 10) : 'N/A'
                    ];
                })->toArray();
        });
    }

    /**
     * Get performance heatmap data
     */
    private function getPerformanceHeatmap()
    {
        return Cache::remember('performance_heatmap_export', 300, function () {
            $modules = DB::table('modules')->select('id', 'title')->get();
            
            $heatmap = [];
            foreach ($modules->take(config('admin.reports.low_performers_limit', 10)) as $module) {
                $avgScore = DB::table('exam_attempts')
                    ->where('module_id', $module->id)
                    ->avg('score');
                
                $heatmap[] = [
                    'module_id' => $module->id,
                    'module_name' => $module->title,
                    'performance_score' => (float)round($avgScore ?? 0, 2),
                    'intensity' => $avgScore >= 80 ? 'high' : ($avgScore >= 60 ? 'medium' : 'low')
                ];
            }
            
            return $heatmap;
        });
    }

    /**
     * Get training materials data
     */
    private function getTrainingMaterials()
    {
        return Cache::remember('training_materials_export', 300, function () {
            // Materials table may not exist in all installations
            if (!Schema::hasTable('materials')) {
                return [];
            }
            
            return DB::table('materials')
                ->select(
                    'id',
                    'title',
                    'module_id',
                    DB::raw('COUNT(*) as access_count'),
                    'created_at'
                )
                ->groupBy('id', 'title', 'module_id', 'created_at')
                ->limit(50)
                ->get()
                ->map(function($item) {
                    return [
                        'id' => $item->id,
                        'title' => $item->title,
                        'module_id' => $item->module_id,
                        'access_count' => (int)$item->access_count,
                        'created_date' => substr($item->created_at, 0, 10)
                    ];
                })->toArray();
        });
    }

    /**
     * Get program enrollment data
     */
    private function getProgramEnrollment()
    {
        return Cache::remember('program_enrollment_export', 300, function () {
            return DB::table('modules')
                ->select(
                    'modules.id',
                    'modules.title',
                    DB::raw('COUNT(DISTINCT user_trainings.user_id) as total_enrolled')
                )
                ->leftJoin('user_trainings', 'modules.id', '=', 'user_trainings.module_id')
                ->groupBy('modules.id', 'modules.title')
                ->get()
                ->map(function($item) {
                    return [
                        'program_id' => $item->id,
                        'program_name' => $item->title,
                        'total_enrolled' => (int)$item->total_enrolled
                    ];
                })->toArray();
        });
    }

    /**
     * Get resource utilization data
     */
    private function getResourceUtilization()
    {
        return Cache::remember('resource_utilization_export', 300, function () {
            // Materials table may not exist in all installations
            if (!Schema::hasTable('materials')) {
                return [];
            }
            
            return DB::table('materials')
                ->select(
                    'title',
                    DB::raw('COUNT(*) as total_views'),
                    DB::raw('COUNT(DISTINCT module_id) as modules_used')
                )
                ->groupBy('title')
                ->orderBy('total_views', 'desc')
                ->limit(20)
                ->get()
                ->map(function($item) {
                    return [
                        'resource_name' => $item->title,
                        'total_views' => (int)$item->total_views,
                        'modules_using' => (int)$item->modules_used,
                        'utilization_rate' => 'Active'
                    ];
                })->toArray();
        });
    }

    /**
     * Get dormant users
     */
    private function getDormantUsers()
    {
        return Cache::remember('dormant_users_export', 300, function () {
            return DB::table('users as u')
                ->leftJoin('user_trainings as ut', function($join) {
                    $join->on('u.id', '=', 'ut.user_id')
                         ->where('ut.updated_at', '>=', Carbon::now()->subDays(30));
                })
                ->where('u.role', '!=', 'admin')
                ->select(
                    'u.id',
                    'u.name',
                    'u.department',
                    DB::raw('MAX(ut.updated_at) as last_activity')
                )
                ->groupBy('u.id', 'u.name', 'u.department')
                ->havingRaw('MAX(ut.updated_at) IS NULL OR MAX(ut.updated_at) < DATE_SUB(NOW(), INTERVAL 30 DAY)')
                ->get()
                ->map(function($item) {
                    return [
                        'user_id' => $item->id,
                        'user_name' => $item->name,
                        'department' => $item->department ?? 'Unknown',
                        'last_active' => $item->last_activity ? substr($item->last_activity, 0, 10) : 'Never',
                        'days_inactive' => $item->last_activity ? Carbon::parse($item->last_activity)->diffInDays() : 'N/A'
                    ];
                })->toArray();
        });
    }

    /**
     * Get skill development data
     */
    private function getSkillDevelopment()
    {
        return Cache::remember('skill_development_export', 300, function () {
            return DB::table('users as u')
                ->leftJoin('user_trainings as ut', 'u.id', '=', 'ut.user_id')
                ->select(
                    'u.id',
                    'u.name',
                    DB::raw('COUNT(DISTINCT ut.module_id) as skills_developed'),
                    DB::raw('COUNT(DISTINCT CASE WHEN ut.status = "completed" THEN ut.module_id END) as skills_mastered')
                )
                ->where('u.role', '!=', 'admin')
                ->groupBy('u.id', 'u.name')
                ->limit(50)
                ->get()
                ->map(function($item) {
                    $masteryRate = $item->skills_developed > 0 ? round(($item->skills_mastered / $item->skills_developed) * 100, 2) : 0;
                    return [
                        'user_id' => $item->id,
                        'user_name' => $item->name,
                        'skills_developed' => (int)$item->skills_developed,
                        'skills_mastered' => (int)$item->skills_mastered,
                        'mastery_rate' => (float)$masteryRate . '%'
                    ];
                })->toArray();
        });
    }

    /**
     * Get demographics
     */
    private function getDemographics()
    {
        return Cache::remember('demographics_export', 300, function () {
            return DB::table('users')
                ->where('role', '!=', 'admin')
                ->select(
                    'department',
                    DB::raw('COUNT(*) as total_users'),
                    DB::raw('COUNT(CASE WHEN status = "active" THEN 1 END) as active_users'),
                    DB::raw('COUNT(CASE WHEN status = "inactive" THEN 1 END) as inactive_users')
                )
                ->groupBy('department')
                ->get()
                ->map(function($item) {
                    $activeRate = $item->total_users > 0 ? round(($item->active_users / $item->total_users) * 100, 2) : 0;
                    return [
                        'department' => $item->department ?? 'Unknown',
                        'total_users' => (int)$item->total_users,
                        'active_users' => (int)$item->active_users,
                        'inactive_users' => (int)$item->inactive_users,
                        'active_rate' => (float)$activeRate . '%'
                    ];
                })->toArray();
        });
    }

    /**
     * Get certificate distribution
     */
    private function getCertificateDistribution()
    {
        return $this->getCertificateStats();
    }

    /**
     * Get module timeline
     */
    private function getModuleTimeline()
    {
        return Cache::remember('module_timeline_export', 300, function () {
            return DB::table('user_trainings')
                ->select(
                    DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                    'module_id',
                    DB::raw('COUNT(*) as enrollments'),
                    DB::raw('COUNT(CASE WHEN status = "completed" THEN 1 END) as completions')
                )
                ->where('created_at', '>=', Carbon::now()->subMonths(12))
                ->groupBy('month', 'module_id')
                ->orderBy('month', 'asc')
                ->get()
                ->map(function($item) {
                    return [
                        'month' => $item->month,
                        'module_id' => $item->module_id,
                        'enrollments' => (int)$item->enrollments,
                        'completions' => (int)$item->completions
                    ];
                })->toArray();
        });
    }
}