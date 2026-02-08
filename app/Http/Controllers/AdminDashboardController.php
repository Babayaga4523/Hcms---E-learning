<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Models\User;
use App\Models\UserTraining;
use App\Models\ExamAttempt;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\TrainingReportExport;

class AdminDashboardController extends Controller
{
    /**
     * Debug endpoint for top performers data
     */
    public function debugTopPerformers()
    {
        $topPerformers = User::where('role', 'user')
            ->with(['trainings', 'examAttempts'])
            ->get()
            ->map(function($user) {
                $completedTrainings = $user->trainings?->where('status', 'completed')->count() ?? 0;
                $certifications = $user->trainings?->where('is_certified', true)->count() ?? 0;
                $avgExamScore = $user->examAttempts?->avg('score') ?? 0;

                // Calculate total points: certifications (200 pts) + completed trainings (50 pts) + avg score bonus
                $totalPoints = ($certifications * 200) + ($completedTrainings * 50) + round($avgExamScore);

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'nip' => $user->nip,
                    'department' => $user->department,
                    'location' => $user->location,
                    'completed_trainings' => $completedTrainings,
                    'certifications' => $certifications,
                    'avg_exam_score' => round($avgExamScore, 1),
                    'total_points' => $totalPoints,
                ];
            })
            ->sortByDesc('total_points')
            ->take(10)
            ->values()
            ->toArray();

        return response()->json([
            'top_performers' => $topPerformers,
            'count' => count($topPerformers)
        ]);
    }

    /**
     * Display admin dashboard
     */
    public function index()
    {
        $user = Auth::user();
        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized');
        }

        try {
            // Get comprehensive dashboard data from DashboardMetricsController
            $metricsController = new \App\Http\Controllers\Admin\DashboardMetricsController();
            
            // Get all data from the metrics controller
            $statistics = $metricsController->getStatistics();
            $complianceTrend = $metricsController->getComplianceTrend();
            $enrollmentTrend = $metricsController->getEnrollmentTrend();
            $modulesStats = $metricsController->getModulesStats();
            $topPerformers = $metricsController->getTopPerformers();
            $recentEnrollments = $metricsController->getRecentEnrollments();
            $recentCompletions = $metricsController->getRecentCompletions();
            $recentActivityLogs = $metricsController->getRecentActivityLogs();
            $alerts = $metricsController->getAlerts();
            $reports = $metricsController->getReports();
            $complianceDistribution = $metricsController->getComplianceDistribution();

            Log::info('Dashboard data loaded successfully', [
                'stats' => count($statistics),
                'modules' => count($modulesStats),
                'performers' => count($topPerformers),
            ]);

            return Inertia::render('Admin/Dashboard', [
                'auth' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                    ],
                ],
                'statistics' => $statistics,
                'recent_enrollments' => $recentEnrollments,
                'recent_completions' => $recentCompletions,
                'modules_stats' => $modulesStats,
                'top_performers' => $topPerformers,
                'compliance_trend' => $complianceTrend,
                'enrollment_trend' => $enrollmentTrend,
                'alerts' => $alerts,
                'reports' => $reports,
                'compliance_distribution' => $complianceDistribution,
                'recent_activity_logs' => $recentActivityLogs,
            ]);
        } catch (\Exception $e) {
            Log::error('Admin Dashboard Error: ' . $e->getMessage(), [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            abort(500, 'Error loading dashboard: ' . $e->getMessage());
        }
    }

    /**
     * Download reports as CSV with professional template
     */
    public function downloadReports()
    {
        try {
            $user = Auth::user();
            if ($user->role !== 'admin') {
                abort(403, 'Unauthorized');
            }

            // Get reports data and statistics
            $metricsController = new \App\Http\Controllers\Admin\DashboardMetricsController();
            $reports = $metricsController->getReports();
            $statistics = $metricsController->getStatistics();
            $complianceDistribution = $metricsController->getComplianceDistribution();

            // Create CSV
            $fileName = 'Laporan-Pelatihan-' . date('Y-m-d-H-i-s') . '.csv';
            $headers = [
                "Content-Type" => "text/csv; charset=utf-8",
                "Content-Disposition" => "attachment; filename=$fileName",
                "Pragma" => "no-cache",
                "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
                "Expires" => "0",
            ];

            $callback = function() use ($reports, $statistics, $complianceDistribution, $user) {
                $file = fopen('php://output', 'w');
                
                // Set BOM untuk Excel compatibility
                fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
                
                // ========== HEADER SECTION ==========
                fputcsv($file, [], ';');
                fputcsv($file, ['SISTEM MANAJEMEN PELATIHAN'], ';');
                fputcsv($file, ['ARSIP LAPORAN PELATIHAN'], ';');
                fputcsv($file, [], ';');
                
                // ========== INFO SECTION ==========
                fputcsv($file, ['Tanggal Generate', date('d-m-Y H:i:s')], ';');
                fputcsv($file, ['Dibuat Oleh', $user->name], ';');
                fputcsv($file, ['Total Laporan', count($reports)], ';');
                fputcsv($file, [], ';');
                
                // ========== SUMMARY SECTION ==========
                fputcsv($file, ['RINGKASAN STATISTIK'], ';');
                fputcsv($file, [], ';');
                fputcsv($file, ['Metrik', 'Nilai'], ';');
                fputcsv($file, ['Total Pengguna', $statistics['total_users'] ?? 0], ';');
                fputcsv($file, ['Tingkat Penyelesaian', ($statistics['completion_rate'] ?? 0) . '%'], ';');
                fputcsv($file, ['Rata-rata Skor', number_format($statistics['average_score'] ?? 0, 2)], ';');
                fputcsv($file, ['Tingkat Kepatuhan', ($statistics['overall_compliance_rate'] ?? 0) . '%'], ';');
                
                // Compliance Distribution
                if (!empty($complianceDistribution)) {
                    fputcsv($file, [], ';');
                    fputcsv($file, ['Status Kepatuhan', 'Jumlah'], ';');
                    foreach ($complianceDistribution as $compliance) {
                        fputcsv($file, [
                            $compliance['name'],
                            $compliance['value'],
                        ], ';');
                    }
                }
                
                // ========== DATA SECTION ==========
                fputcsv($file, [], ';');
                fputcsv($file, ['DETAIL LAPORAN'], ';');
                fputcsv($file, [], ';');
                fputcsv($file, ['No', 'ID Laporan', 'Nama Laporan', 'Departemen', 'Tanggal', 'Status'], ';');
                
                // Data rows
                $no = 1;
                foreach ($reports as $report) {
                    fputcsv($file, [
                        $no++,
                        $report->id,
                        $report->name,
                        $report->dept,
                        $report->date,
                        $report->status,
                    ], ';');
                }
                
                // ========== FOOTER SECTION ==========
                fputcsv($file, [], ';');
                fputcsv($file, [], ';');
                fputcsv($file, ['Catatan: File ini berisi data sensitif pelatihan. Simpan dengan aman.'], ';');
                fputcsv($file, ['Untuk informasi lebih lanjut, hubungi bagian HR/Training.'], ';');
                fputcsv($file, ['Generated by: HCMS E-Learning System'], ';');
                fputcsv($file, ['Generated Date: ' . date('d-m-Y H:i:s')], ';');
                
                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            Log::error('Download Reports Error: ' . $e->getMessage());
            return back()->with('error', 'Error downloading reports: ' . $e->getMessage());
        }
    }

    /**
     * Download comprehensive training reports as Excel
     */
    public function downloadReportsExcel()
    {
        try {
            $user = Auth::user();
            if ($user->role !== 'admin') {
                abort(403, 'Unauthorized');
            }

            // Get comprehensive data
            $metricsController = new \App\Http\Controllers\Admin\DashboardMetricsController();
            $statistics = $metricsController->getStatistics();
            $complianceDistribution = $metricsController->getComplianceDistribution();
            $departmentReports = $metricsController->getDepartmentReports();
            
            // Get detailed training data
            $trainings = DB::table('user_trainings')
                ->join('users', 'user_trainings.user_id', '=', 'users.id')
                ->join('modules', 'user_trainings.module_id', '=', 'modules.id')
                ->select(
                    'users.name as user_name',
                    'users.email as user_email',
                    'users.nip',
                    'users.department',
                    'users.location',
                    'modules.title as module_title',
                    'modules.passing_grade',
                    'modules.duration as module_duration',
                    'user_trainings.status',
                    'user_trainings.final_score',
                    'user_trainings.is_certified',
                    'user_trainings.enrolled_at',
                    'user_trainings.completed_at',
                    DB::raw('(SELECT COUNT(*) FROM exam_attempts ea WHERE ea.user_training_id = user_trainings.id) as attempts'),
                    DB::raw('(SELECT MAX(score) FROM exam_attempts ea WHERE ea.user_training_id = user_trainings.id) as highest_score'),
                    DB::raw('(SELECT ROUND(AVG(score),2) FROM exam_attempts ea WHERE ea.user_training_id = user_trainings.id) as avg_attempt_score'),
                    DB::raw('TIMESTAMPDIFF(MINUTE, user_trainings.enrolled_at, user_trainings.completed_at) as time_to_complete_minutes')
                )
                ->orderBy('users.department')
                ->orderBy('users.name')
                ->get();

            // Create Excel file
            $fileName = 'Laporan-Pelatihan-Lengkap-' . date('Y-m-d-H-i-s') . '.xlsx';
            
            return Excel::download(new TrainingReportExport(
                $trainings,
                $statistics,
                $complianceDistribution,
                $departmentReports,
                $user
            ), $fileName);

        } catch (\Exception $e) {
            Log::error('Download Reports Excel Error: ' . $e->getMessage());
            return back()->with('error', 'Error downloading reports: ' . $e->getMessage());
        }
    }

    public function getUserManagement()
    {
        $users = User::where('role', 'user')
            ->with('trainings')
            ->get()
            ->map(fn($user) => [
                'id' => $user->id,
                'nip' => $user->nip,
                'name' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
                'total_trainings' => $user->trainings->count(),
                'completed_trainings' => $user->trainings->where('status', 'completed')->count(),
                'certifications' => $user->trainings->where('is_certified', true)->count(),
            ]);

        return response()->json($users);
    }

    /**
     * Get module management data
     */
    public function getModuleManagement()
    {
        $modules = Module::with(['userTrainings', 'questions'])
            ->get()
            ->map(fn($module) => [
                'id' => $module->id,
                'title' => $module->title,
                'description' => $module->description,
                'total_questions' => $module->questions->count(),
                'total_enrollments' => $module->userTrainings->count(),
                'completed_count' => $module->userTrainings->where('status', 'completed')->count(),
                'passing_grade' => $module->passing_grade,
                'has_pretest' => $module->has_pretest,
                'is_active' => $module->is_active,
            ]);

        return response()->json($modules);
    }

    /**
     * Get compliance reports data
     */
    public function getComplianceReports()
    {
        // Get all users with their training completion data
        $complianceData = User::where('role', 'user')
            ->with(['trainings', 'auditLogs'])
            ->get()
            ->map(fn($user) => [
                'nip' => $user->nip,
                'name' => $user->name,
                'department' => $user->department,
                'total_trainings' => $user->trainings->count(),
                'completed_trainings' => $user->trainings->where('status', 'completed')->count(),
                'certifications' => $user->trainings->where('is_certified', true)->count(),
                'completion_percentage' => $user->trainings->count() > 0
                    ? round(($user->trainings->where('status', 'completed')->count() / $user->trainings->count()) * 100, 2)
                    : 0,
                'audit_activities' => $user->auditLogs->count(),
            ]);

        return response()->json($complianceData);
    }

    /**
     * Search users, modules, and trainings
     */
    public function search()
    {
        $query = trim(request()->input('q', ''));
        
        // Return empty if query too short
        if (strlen($query) < 1) {
            return Inertia::render('Admin/SearchResults', [
                'query' => $query,
                'users' => [],
                'modules' => [],
                'trainings' => [],
            ]);
        }

        // Search users
        $users = User::where('role', 'user')
            ->where(function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%")
                  ->orWhere('nip', 'like', "%{$query}%")
                  ->orWhere('department', 'like', "%{$query}%");
            })
            ->with('trainings')
            ->limit(10)
            ->get()
            ->map(fn($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'nip' => $user->nip,
                'email' => $user->email,
                'role' => $user->role,
                'department' => $user->department,
                'total_trainings' => $user->trainings->count(),
                'completed_trainings' => $user->trainings->where('status', 'completed')->count(),
            ])
            ->toArray();

        // Search modules
        $modules = Module::where('is_active', true)
            ->where(function($q) use ($query) {
                $q->where('title', 'like', "%{$query}%")
                  ->orWhere('description', 'like', "%{$query}%");
            })
            ->with('userTrainings')
            ->limit(10)
            ->get()
            ->map(fn($module) => [
                'id' => $module->id,
                'title' => $module->title,
                'description' => $module->description,
                'category' => $module->category ?? 'General',
                'duration' => $module->duration ?? '1h',
                'rating' => 4.5,
                'total_enrollments' => $module->userTrainings->count(),
                'completed_count' => $module->userTrainings->where('status', 'completed')->count(),
            ])
            ->toArray();

        // Search trainings
        $trainings = UserTraining::with(['user', 'module'])
            ->where(function($q) use ($query) {
                $q->whereHas('user', function($userQ) use ($query) {
                    $userQ->where('name', 'like', "%{$query}%")
                          ->orWhere('nip', 'like', "%{$query}%");
                })
                ->orWhereHas('module', function($moduleQ) use ($query) {
                    $moduleQ->where('title', 'like', "%{$query}%");
                });
            })
            ->limit(10)
            ->get()
            ->map(fn($training) => [
                'id' => $training->id,
                'user_name' => $training->user?->name ?? 'N/A',
                'user_nip' => $training->user?->nip ?? 'N/A',
                'module_title' => $training->module?->title ?? 'N/A',
                'title' => $training->module?->title ?? 'N/A',
                'status' => $training->status,
                'progress' => $training->final_score ?? 0,
                'enrolled_at' => $training->enrolled_at,
            ])
            ->toArray();

        return Inertia::render('Admin/SearchResults', [
            'query' => $query,
            'users' => $users,
            'modules' => $modules,
            'trainings' => $trainings,
            'auth' => [
                'user' => Auth::user(),
            ],
        ]);
    }

    /**
     * Recent Activity page - send same data as dashboard for consistency
     */
    public function recentActivity()
    {
        $user = Auth::user();
        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized');
        }

        try {
            // Get data from DashboardMetricsController for consistency
            $metricsController = new \App\Http\Controllers\Admin\DashboardMetricsController();
            
            $recentEnrollments = $metricsController->getRecentEnrollments();
            $recentCompletions = $metricsController->getRecentCompletions();
            $recentActivityLogs = $metricsController->getRecentActivityLogs();

            return Inertia::render('Admin/RecentActivity', [
                'auth' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                    ],
                ],
                'recent_enrollments' => $recentEnrollments,
                'recent_completions' => $recentCompletions,
                'recent_activity_logs' => $recentActivityLogs,
            ]);
        } catch (\Exception $e) {
            Log::error('Recent Activity Error: ' . $e->getMessage());
            abort(500, 'Error loading recent activity: ' . $e->getMessage());
        }
    }

    /**
     * Display leaderboard page
     */
    public function leaderboard()
    {
        $user = Auth::user();
        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized');
        }

        return Inertia::render('Admin/Leaderboard', [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
            ],
        ]);
    }
}
