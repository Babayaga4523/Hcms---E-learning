<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\User;
use App\Models\ProgramEnrollmentMetric;
use App\Services\PointsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class DashboardMetricsController extends Controller
{
    /**
     * Get comprehensive dashboard data - single endpoint for all dashboard needs
     */
    public function getComprehensiveDashboard()
    {
        $this->authorize('view-dashboard');
        return response()->json([
            'success' => true,
            'data' => [
                'statistics' => $this->getStatistics(),
                'compliance_trend' => $this->getComplianceTrend(),
                'enrollment_trend' => $this->getEnrollmentTrend(),
                'modules_stats' => $this->getModulesStats(),
                'top_performers' => $this->getTopPerformers(),
                'recent_enrollments' => $this->getRecentEnrollments(),
                'recent_completions' => $this->getRecentCompletions(),
                'alerts' => $this->getAlerts(),
                'reports' => $this->getReports(),
                'compliance_distribution' => $this->getComplianceDistribution(),
            ]
        ]);
    }

    /**
     * Get all dashboard statistics (OPTIMIZED - Combined queries + CACHED)
     */
    public function getStatistics()
    {$this->authorize('view-dashboard');
        
        // Cache for 5 minutes to avoid repeated heavy queries
        return Cache::remember('dashboard_statistics', 300, function() {
            // OPTIMIZE: Combine Module counts into single query
            $moduleStats = DB::table('modules')
                ->selectRaw('COUNT(*) as total, SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active')
                ->first();
            
            $totalPrograms = $moduleStats->total ?? 0;
            $activePrograms = $moduleStats->active ?? 0;
            
            // OPTIMIZE: Use single query for all training stats (5 queries → 1 query)
            $trainingStats = DB::table('user_trainings')
                ->selectRaw('
                    COUNT(*) as total_trainings,
                    SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN is_certified = true THEN 1 ELSE 0 END) as certified,
                    AVG(CASE WHEN final_score IS NOT NULL THEN final_score ELSE NULL END) as avg_score
                ')
                ->first();
            
            $completionRate = ($trainingStats->total_trainings ?? 0) > 0 
                ? round(($trainingStats->completed / $trainingStats->total_trainings) * 100, 2)
                : 0;
            
            $complianceRate = ($trainingStats->total_trainings ?? 0) > 0
                ? round(($trainingStats->certified / $trainingStats->total_trainings) * 100, 2)
                : 0;
            
            $averageScore = round($trainingStats->avg_score ?? 0, 2);
            
            // Count enrolled users
            $totalEnrolledLearners = DB::table('users')
                ->whereIn('id', DB::table('user_trainings')->distinct()->pluck('user_id'))
                ->where('role', 'user')
                ->count();

        // Weekly engagement
        $weeklyEngagement = DB::table('user_trainings')
            ->selectRaw('DAYOFWEEK(created_at) as day, DAYNAME(created_at) as day_name, COUNT(*) as active')
            ->whereRaw('created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)')
            ->groupByRaw('DAYOFWEEK(created_at), DAYNAME(created_at)')
            ->orderBy('day')
            ->get()
            ->map(function($item) {
                return [
                    'day' => substr($item->day_name, 0, 3),
                    'active' => $item->active
                ];
            })
            ->toArray();

        // Fill missing days
        $daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        $engagementMap = collect($weeklyEngagement)->keyBy('day')->toArray();
        $weeklyEngagement = array_map(function($day) use ($engagementMap) {
            return $engagementMap[$day] ?? ['day' => $day, 'active' => 0];
        }, $daysOrder);

        // Skill gaps - Calculate from actual module performance
        $skillsGap = DB::table('modules')
            ->leftJoin('user_trainings', 'modules.id', '=', 'user_trainings.module_id')
            ->selectRaw('
                modules.title as subject,
                ROUND(AVG(user_trainings.final_score), 2) as current,
                ROUND(AVG(user_trainings.final_score) + (100 - AVG(user_trainings.final_score)) * 0.15, 2) as target
            ')
            ->whereNotNull('user_trainings.final_score')
            ->groupBy('modules.id', 'modules.title')
            ->orderByDesc('current')
            ->limit(6)
            ->get()
            ->map(function($skill) {
                return [
                    'subject' => $skill->subject ?? 'Unknown',
                    'current' => $skill->current ?? 0,
                    'target' => min($skill->target ?? 100, 100),  // Max 100
                ];
            })
            ->toArray();

        // No fallback - use real data only or empty array
        if (empty($skillsGap)) {
            // Log warning if no data
            Log::warning('[DashboardMetrics] Skill gap data is empty - no modules with final_score found');
        }

        // Department compliance stats
        $departmentCompliance = DB::table('users')
            ->leftJoin('user_trainings', 'users.id', '=', 'user_trainings.user_id')
            ->where('users.role', 'user')
            ->selectRaw('
                COALESCE(users.department, "Unassigned") as department,
                COUNT(DISTINCT users.id) as total_users,
                SUM(CASE WHEN user_trainings.is_certified = true THEN 1 ELSE 0 END) as compliant_users
            ')
            ->groupBy('users.department')
            ->get()
            ->map(function($item) {
                $compliance = $item->total_users > 0 
                    ? round(($item->compliant_users / $item->total_users) * 100, 2)
                    : 0;
                return [
                    'department' => $item->department,
                    'total_users' => $item->total_users,
                    'compliant_users' => $item->compliant_users,
                    'compliance' => $compliance
                ];
            })
            ->toArray();

            return [
                'total_users' => $totalEnrolledLearners,
                'completion_rate' => $completionRate,
                'average_score' => round($averageScore, 2),
                'overall_compliance_rate' => $complianceRate,
                'total_programs' => $totalPrograms,
                'active_programs' => $activePrograms,
                'weekly_engagement' => array_values($weeklyEngagement),
                'skills_gap' => $skillsGap,
                'department_compliance' => $departmentCompliance,
                'department_reports' => $this->getDepartmentReports(),
            ];
        });
    }

    /**
     * Get compliance trend data (last 12 months) - CACHED
     */
    public function getComplianceTrend()
    {
        // Cache for 1 hour
        return Cache::remember('dashboard_compliance_trend', 3600, function() {
            $trend = DB::table('user_trainings')
                ->selectRaw('
                    DATE_FORMAT(created_at, "%Y-%m") as month,
                    MONTHNAME(created_at) as month_name,
                    COUNT(*) as total,
                    SUM(CASE WHEN is_certified = true THEN 1 ELSE 0 END) as certified
                ')
                ->where('created_at', '>=', now()->subMonths(12))
                ->groupByRaw('DATE_FORMAT(created_at, "%Y-%m"), MONTHNAME(created_at)')
                ->orderBy('month')
                ->get()
                ->map(function($item) {
                    return [
                        'month' => substr($item->month_name, 0, 3),
                        'completed' => $item->certified ?? 0,
                        'total' => $item->total ?? 0,
                    ];
                })
                ->toArray();

            return $trend;
        });
    }

    /**
     * Get enrollment trend data (last 12 months) - CACHED
     */
    public function getEnrollmentTrend()
    {
        // Cache for 1 hour
        return Cache::remember('dashboard_enrollment_trend', 3600, function() {
            $trends = DB::table('user_trainings')
                ->selectRaw('
                    DATE_FORMAT(created_at, "%Y-%m") as month,
                    MONTHNAME(created_at) as month_name,
                    COUNT(*) as enrollments
                ')
                ->where('created_at', '>=', now()->subMonths(12))
                ->groupByRaw('DATE_FORMAT(created_at, "%Y-%m"), MONTHNAME(created_at)')
                ->orderBy('month')
                ->get()
                ->map(function($metric) {
                    return [
                        'month' => substr($metric->month_name, 0, 3),
                        'enrollments' => $metric->enrollments ?? 0,
                    ];
                })
                ->toArray();

            if (empty($trends)) {
                Log::warning('⚠️ No enrollment trend data found for past 12 months');
            }

            return $trends;
        });
    }

    /**
     * Get modules statistics
     */
    public function getModulesStats()
    {
        return Module::with(['users' => function($q) {
            $q->select('users.id');
        }])
        ->get()
        ->map(function($module) {
            $totalEnrolled = $module->users->count();
            $completed = $module->users()->wherePivot('status', 'completed')->count();
            
            return [
                'id' => $module->id,
                'title' => $module->title,
                'description' => $module->description,
                'total_enrollments' => $totalEnrolled,
                'completed_count' => $completed,
                'completion_rate' => $totalEnrolled > 0 ? round(($completed / $totalEnrolled) * 100, 2) : 0,
                'is_active' => $module->is_active,
            ];
        })
        ->toArray();
    }

    /**
     * Get top performers
     */
    public function getTopPerformers()
    {
        $pointsService = app(PointsService::class);
        return $pointsService->getTopPerformers(10);
    }

    /**
     * Get recent enrollments
     */
    public function getRecentEnrollments()
    {
        return DB::table('user_trainings')
            ->join('users', 'user_trainings.user_id', '=', 'users.id')
            ->join('modules', 'user_trainings.module_id', '=', 'modules.id')
            ->select('users.name as user', 'modules.title as module', 'user_trainings.enrolled_at as time')
            ->orderByDesc('user_trainings.enrolled_at')
            ->limit(5)
            ->get()
            ->map(function($item) {
                return [
                    'user' => $item->user,
                    'module' => $item->module,
                    'time' => $item->time ? \Carbon\Carbon::parse($item->time)->diffForHumans() : 'Recently',
                    'icon' => 'UserPlus',
                    'bg' => 'bg-blue-50',
                    'color' => 'text-blue-600',
                    'timestamp' => $item->time ? \Carbon\Carbon::parse($item->time)->timestamp : 0,
                ];
            })
            ->toArray();
    }

    /**
     * Get recent completions
     */
    public function getRecentCompletions()
    {
        return DB::table('user_trainings')
            ->join('users', 'user_trainings.user_id', '=', 'users.id')
            ->join('modules', 'user_trainings.module_id', '=', 'modules.id')
            ->where('user_trainings.status', 'completed')
            ->select('users.name as user', 'modules.title as module', 'user_trainings.completed_at as time')
            ->orderByDesc('user_trainings.completed_at')
            ->limit(5)
            ->get()
            ->map(function($item) {
                return [
                    'user' => $item->user,
                    'module' => $item->module,
                    'time' => $item->time ? \Carbon\Carbon::parse($item->time)->diffForHumans() : 'Recently',
                    'icon' => 'CheckCircle',
                    'bg' => 'bg-emerald-50',
                    'color' => 'text-emerald-600',
                    'timestamp' => $item->time ? \Carbon\Carbon::parse($item->time)->timestamp : 0,
                ];
            })
            ->toArray();
    }


    /**
     * Get recent activity logs - Menampilkan aktivitas real-time user
     */
    public function getRecentActivityLogs()
    {
        // Kumpulkan semua aktivitas dari berbagai sumber dengan nama karyawan yang jelas
        $loginActivities = DB::table('audit_logs')
            ->join('users', 'audit_logs.user_id', '=', 'users.id')
            ->where('audit_logs.action', 'like', '%login%')
            ->select(
                'users.id as user_id',
                'users.name as user',
                'users.name as user_name',
                'audit_logs.action',
                DB::raw('NULL as module_name'),
                DB::raw('"login" as type'),
                'audit_logs.logged_at as time',
                'audit_logs.logged_at as created_at',
                DB::raw('UNIX_TIMESTAMP(audit_logs.logged_at) as timestamp')
            )
            ->orderByDesc('audit_logs.logged_at');

        // Aktivitas enrollment
        $enrollmentActivities = DB::table('user_trainings')
            ->join('users', 'user_trainings.user_id', '=', 'users.id')
            ->join('modules', 'user_trainings.module_id', '=', 'modules.id')
            ->select(
                'users.id as user_id',
                'users.name as user',
                'users.name as user_name',
                DB::raw('CONCAT("enrolled in ", modules.title) as action'),
                'modules.title as module_name',
                DB::raw('"enrollment" as type'),
                'user_trainings.enrolled_at as time',
                'user_trainings.enrolled_at as created_at',
                DB::raw('UNIX_TIMESTAMP(user_trainings.enrolled_at) as timestamp')
            )
            ->whereNotNull('user_trainings.enrolled_at')
            ->orderByDesc('user_trainings.enrolled_at');

        // Aktivitas completion
        $completionActivities = DB::table('user_trainings')
            ->join('users', 'user_trainings.user_id', '=', 'users.id')
            ->join('modules', 'user_trainings.module_id', '=', 'modules.id')
            ->select(
                'users.id as user_id',
                'users.name as user',
                'users.name as user_name',
                DB::raw('CONCAT("completed ", modules.title) as action'),
                'modules.title as module_name',
                DB::raw('"completion" as type'),
                'user_trainings.completed_at as time',
                'user_trainings.completed_at as created_at',
                DB::raw('UNIX_TIMESTAMP(user_trainings.completed_at) as timestamp')
            )
            ->where('user_trainings.status', 'completed')
            ->whereNotNull('user_trainings.completed_at')
            ->orderByDesc('user_trainings.completed_at');

        // Aktivitas quiz/exam attempts
        $examActivities = DB::table('exam_attempts')
            ->join('users', 'exam_attempts.user_id', '=', 'users.id')
            ->select(
                'users.id as user_id',
                'users.name as user',
                'users.name as user_name',
                DB::raw('CONCAT("attempted exam with score: ", ROUND(exam_attempts.score, 2)) as action'),
                DB::raw('NULL as module_name'),
                DB::raw('"exam" as type'),
                'exam_attempts.created_at as time',
                'exam_attempts.created_at as created_at',
                DB::raw('UNIX_TIMESTAMP(exam_attempts.created_at) as timestamp')
            )
            ->orderByDesc('exam_attempts.created_at');

        // Gabung semua aktivitas dan urutkan berdasarkan waktu
        $allActivities = $loginActivities
            ->union($enrollmentActivities)
            ->union($completionActivities)
            ->union($examActivities)
            ->orderByDesc('timestamp')
            ->limit(20)
            ->get()
            ->map(function($item) {
                return [
                    'user_id' => $item->user_id ?? null,
                    'user' => $item->user ?? 'System',
                    'user_name' => $item->user_name ?? 'Karyawan',
                    'action' => $item->action ?? 'melakukan aktivitas',
                    'module_name' => $item->module_name ?? null,
                    'type' => $item->type ?? 'other',
                    'time' => $item->time ? \Carbon\Carbon::parse($item->time)->diffForHumans() : 'Recently',
                    'created_at' => $item->created_at ?? null,
                    'timestamp' => $item->timestamp ?? 0,
                ];
            })
            ->values()
            ->toArray();

        return $allActivities;
    }

    /**
     * Get alerts/notifications
     */
    public function getAlerts()
    {
        $alerts = [];

        // Upcoming deadlines
        $upcomingDeadlines = Module::where('end_date', '>', now())
            ->where('end_date', '<=', now()->addDays(7))
            ->count();
        
        if ($upcomingDeadlines > 0) {
            $alerts[] = [
                'type' => 'warning',
                'title' => 'Upcoming Deadlines',
                'message' => "$upcomingDeadlines programs end within 7 days",
                'icon' => 'AlertTriangle'
            ];
        }

        // Users with low completion rate
        $lowPerformers = User::where('role', 'user')
            ->whereHas('trainings', function($q) {
                $q->where('status', '!=', 'completed');
            })
            ->count();

        if ($lowPerformers > 0) {
            $alerts[] = [
                'type' => 'info',
                'title' => 'In Progress Training',
                'message' => "$lowPerformers users still have incomplete trainings",
                'icon' => 'Clock'
            ];
        }

        return $alerts;
    }

    /**
     * Get reports
     */
    public function getReports()
    {
        // Mock reports - adapt based on your actual reports table
        return DB::table('user_trainings')
            ->join('users', 'user_trainings.user_id', '=', 'users.id')
            ->join('modules', 'user_trainings.module_id', '=', 'modules.id')
            ->selectRaw('
                CONCAT("RPT-", user_trainings.id) as id,
                CONCAT(modules.title, " Report") as name,
                COALESCE(users.department, "General") as dept,
                DATE(user_trainings.created_at) as date,
                CASE 
                    WHEN user_trainings.status = "completed" THEN "Selesai"
                    WHEN user_trainings.status = "in_progress" THEN "Pending"
                    ELSE "Gagal"
                END as status
            ')
            ->orderByDesc('user_trainings.created_at')
            ->limit(10)
            ->get()
            ->toArray();
    }

    /**
     * Get compliance distribution
     */
    public function getComplianceDistribution()
    {
        $total = DB::table('user_trainings')->count();
        
        $compliant = DB::table('user_trainings')
            ->where('is_certified', true)
            ->count();
        
        $pending = DB::table('user_trainings')
            ->where('status', 'in_progress')
            ->count();
        
        $nonCompliant = $total - $compliant - $pending;

        return [
            ['name' => 'Compliant', 'value' => $compliant],
            ['name' => 'Pending', 'value' => $pending],
            ['name' => 'Non-Compliant', 'value' => $nonCompliant],
        ];
    }

    /**     * Get department-wise report generation status
     */
    public function getDepartmentReports()
    {
        $reports = DB::table('users')
            ->leftJoin('user_trainings', 'users.id', '=', 'user_trainings.user_id')
            ->where('users.role', '=', 'user')
            ->selectRaw("COALESCE(users.department, 'Unassigned') as name, COALESCE(SUM(CASE WHEN user_trainings.status = 'completed' THEN 1 ELSE 0 END), 0) as completed_count, COALESCE(SUM(CASE WHEN user_trainings.status = 'in_progress' THEN 1 ELSE 0 END), 0) as pending_count, COALESCE(SUM(CASE WHEN user_trainings.status = 'not_started' THEN 1 ELSE 0 END), 0) as failed_count")
            ->groupByRaw("COALESCE(users.department, 'Unassigned')")
            ->get()
            ->map(function($item) {
                return [
                    'name' => $item->name,
                    'generated' => (int)($item->completed_count ?? 0),
                    'pending' => (int)($item->pending_count ?? 0),
                    'failed' => (int)($item->failed_count ?? 0),
                ];
            })
            ->toArray();

        return $reports;
    }

    /**     * Get dashboard statistics (legacy method)
     */
    public function getDashboardStats()
    {
        return response()->json([
            'success' => true,
            'data' => $this->getStatistics()
        ]);
    }

    /**
     * Export reports to CSV with professional formatting
     */
    public function exportReportsCSV()
    {
        // Get detailed reports
        $reports = DB::table('user_trainings')
            ->join('users', 'user_trainings.user_id', '=', 'users.id')
            ->join('modules', 'user_trainings.module_id', '=', 'modules.id')
            ->selectRaw('
                CONCAT("RPT-", user_trainings.id) as report_id,
                modules.title as module_name,
                users.name as user_name,
                users.nip,
                COALESCE(users.department, "General") as department,
                DATE(user_trainings.created_at) as enrollment_date,
                DATE(user_trainings.updated_at) as completion_date,
                CASE 
                    WHEN user_trainings.status = "completed" THEN "Selesai"
                    WHEN user_trainings.status = "in_progress" THEN "Sedang Berlangsung"
                    ELSE "Belum Dimulai"
                END as status,
                user_trainings.final_score as score,
                CASE 
                    WHEN user_trainings.is_certified = true THEN "Ya"
                    ELSE "Tidak"
                END as certified
            ')
            ->orderByDesc('user_trainings.created_at')
            ->limit(1000)
            ->get()
            ->toArray();

        // Calculate summary statistics
        $totalRecords = count($reports);
        $completedCount = collect($reports)->where('status', 'Selesai')->count();
        $certifiedCount = collect($reports)->where('certified', 'Ya')->count();
        $avgScore = collect($reports)->where('score', '!=', null)->avg('score');

        $headers = [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="Laporan_Pembelajaran_Detail_' . date('Y-m-d_H-i-s') . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
        ];

        $output = fopen('php://output', 'w');
        fwrite($output, "\xEF\xBB\xBF");

        // ===== HEADER / TITLE SECTION =====
        fputcsv($output, ['LAPORAN PEMBELAJARAN PESERTA'], ',', '"');
        fputcsv($output, ['Generated: ' . date('d F Y H:i:s')], ',', '"');
        fputcsv($output, [], ',', '"');

        // ===== SUMMARY SECTION =====
        fputcsv($output, ['RINGKASAN'], ',', '"');
        fputcsv($output, ['Total Records', $totalRecords], ',', '"');
        fputcsv($output, ['Telah Selesai', $completedCount . ' (' . round(($completedCount/$totalRecords)*100, 1) . '%)'], ',', '"');
        fputcsv($output, ['Tersertifikasi', $certifiedCount . ' (' . round(($certifiedCount/$totalRecords)*100, 1) . '%)'], ',', '"');
        fputcsv($output, ['Rata-rata Skor', round($avgScore, 2)], ',', '"');
        fputcsv($output, [], ',', '"');

        // ===== DATA TABLE SECTION =====
        fputcsv($output, ['DATA DETAIL LAPORAN'], ',', '"');
        fputcsv($output, [], ',', '"');

        $csvHeaders = [
            'No.',
            'ID Laporan',
            'Nama Module',
            'Nama Peserta',
            'NIP',
            'Departemen',
            'Tanggal Pendaftaran',
            'Tanggal Selesai',
            'Status',
            'Skor Akhir',
            'Tersertifikasi'
        ];
        
        fputcsv($output, $csvHeaders, ',', '"');
        
        // Write data rows
        foreach ($reports as $index => $report) {
            fputcsv($output, [
                $index + 1,
                $report->report_id,
                $report->module_name,
                $report->user_name,
                $report->nip ?? '-',
                $report->department,
                $report->enrollment_date,
                $report->completion_date ?? '-',
                $report->status,
                $report->score ?? '-',
                $report->certified
            ], ',', '"');
        }

        fclose($output);
        
        return response()->streamDownload(function() {}, 'Laporan_Pembelajaran_Detail_' . date('Y-m-d_H-i-s') . '.csv', $headers);
    }

    /**
     * Export reports with summary statistics - more professional
     */
    public function exportReportsSummaryCSV()
    {
        // Get department statistics
        $departmentStats = DB::table('users')
            ->leftJoin('user_trainings', 'users.id', '=', 'user_trainings.user_id')
            ->where('users.role', 'user')
            ->selectRaw('
                COALESCE(users.department, "Unassigned") as department,
                COUNT(DISTINCT users.id) as total_users,
                COUNT(DISTINCT CASE WHEN user_trainings.status = "completed" THEN user_trainings.id END) as completed,
                COUNT(DISTINCT CASE WHEN user_trainings.status = "in_progress" THEN user_trainings.id END) as in_progress,
                COUNT(DISTINCT CASE WHEN user_trainings.status = "not_started" THEN user_trainings.id END) as not_started,
                COUNT(DISTINCT CASE WHEN user_trainings.is_certified = true THEN users.id END) as certified_users,
                ROUND(AVG(user_trainings.final_score), 2) as avg_score
            ')
            ->groupBy('users.department')
            ->orderByDesc('completed')
            ->get()
            ->toArray();

        // Overall statistics
        $totalStats = DB::table('users')
            ->leftJoin('user_trainings', 'users.id', '=', 'user_trainings.user_id')
            ->where('users.role', 'user')
            ->selectRaw('
                COUNT(DISTINCT users.id) as total_users,
                COUNT(DISTINCT CASE WHEN user_trainings.status = "completed" THEN user_trainings.id END) as completed,
                COUNT(DISTINCT CASE WHEN user_trainings.status = "in_progress" THEN user_trainings.id END) as in_progress,
                COUNT(DISTINCT CASE WHEN user_trainings.is_certified = true THEN users.id END) as certified_users,
                ROUND(AVG(user_trainings.final_score), 2) as avg_score
            ')
            ->first();

        $headers = [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="Ringkasan_Laporan_Pembelajaran_' . date('Y-m-d_H-i-s') . '.csv"',
        ];

        $output = fopen('php://output', 'w');
        fwrite($output, "\xEF\xBB\xBF");

        // ===== HEADER =====
        fputcsv($output, ['RINGKASAN LAPORAN PEMBELAJARAN PER DEPARTEMEN'], ',', '"');
        fputcsv($output, ['Generated: ' . date('d F Y H:i:s')], ',', '"');
        fputcsv($output, [], ',', '"');

        // ===== OVERALL SUMMARY =====
        fputcsv($output, ['STATISTIK KESELURUHAN'], ',', '"');
        fputcsv($output, ['Total Pengguna', $totalStats->total_users], ',', '"');
        fputcsv($output, ['Total Training Selesai', $totalStats->completed], ',', '"');
        fputcsv($output, ['Total Training Sedang Berlangsung', $totalStats->in_progress], ',', '"');
        fputcsv($output, ['Total Pengguna Tersertifikasi', $totalStats->certified_users], ',', '"');
        fputcsv($output, ['Rata-rata Skor Keseluruhan', $totalStats->avg_score ?? 0], ',', '"');
        fputcsv($output, [], ',', '"');

        // ===== DEPARTMENTAL SUMMARY TABLE =====
        fputcsv($output, ['RINGKASAN PER DEPARTEMEN'], ',', '"');
        fputcsv($output, [], ',', '"');

        fputcsv($output, [
            'No.',
            'Departemen',
            'Total Pengguna',
            'Training Selesai',
            'Sedang Berlangsung',
            'Belum Dimulai',
            'Pengguna Tersertifikasi',
            'Rata-rata Skor',
            'Tingkat Penyelesaian (%)',
            'Tingkat Sertifikasi (%)'
        ], ',', '"');
        
        foreach ($departmentStats as $index => $stat) {
            $total_trainings = $stat->completed + $stat->in_progress + $stat->not_started;
            $completion_rate = $total_trainings > 0 ? round(($stat->completed / $total_trainings) * 100, 1) : 0;
            $certification_rate = $stat->total_users > 0 ? round(($stat->certified_users / $stat->total_users) * 100, 1) : 0;
            
            fputcsv($output, [
                $index + 1,
                $stat->department,
                $stat->total_users,
                $stat->completed,
                $stat->in_progress,
                $stat->not_started,
                $stat->certified_users,
                $stat->avg_score ?? 0,
                $completion_rate . '%',
                $certification_rate . '%'
            ], ',', '"');
        }

        fputcsv($output, [], ',', '"');
        fputcsv($output, ['CATATAN:'], ',', '"');
        fputcsv($output, ['- Tingkat Penyelesaian (%) = (Training Selesai / Total Training) × 100'], ',', '"');
        fputcsv($output, ['- Tingkat Sertifikasi (%) = (Pengguna Tersertifikasi / Total Pengguna) × 100'], ',', '"');
        fputcsv($output, ['- Data diperbarui pada: ' . date('d F Y H:i:s')], ',', '"');

        fclose($output);
        
        return response()->streamDownload(function() {}, 'Ringkasan_Laporan_Pembelajaran_' . date('Y-m-d_H-i-s') . '.csv', $headers);
    }

    /**
     * Get trend analysis data for specified number of days
     * GET /api/admin/trend-analysis?days=7|30|90|365
     */
    public function trendAnalysis(Request $request)
    {
        $this->authorize('view-dashboard');

        try {
            $days = (int) $request->query('days', 30);
            
            // Validate days parameter
            if (!in_array($days, [7, 30, 90, 365])) {
                $days = 30; // Default to 30 days
            }

            $startDate = now()->subDays($days);

            // Generate date range
            $dateRange = [];
            for ($i = 0; $i < $days; $i++) {
                $dateRange[] = $startDate->copy()->addDays($i)->format('Y-m-d');
            }

            // Fetch enrollment and completion data
            $enrollmentData = DB::table('user_trainings')
                ->selectRaw('DATE(created_at) as date, COUNT(*) as enrollments')
                ->where('created_at', '>=', $startDate)
                ->groupBy('date')
                ->get()
                ->keyBy('date');

            $completionData = DB::table('user_trainings')
                ->selectRaw('DATE(updated_at) as date, COUNT(*) as completions')
                ->where('status', 'completed')
                ->where('updated_at', '>=', $startDate)
                ->groupBy('date')
                ->get()
                ->keyBy('date');

            $engagementData = DB::table('exam_attempts')
                ->selectRaw('DATE(attempt_date) as date, COUNT(*) as attempts')
                ->where('attempt_date', '>=', $startDate)
                ->groupBy('date')
                ->get()
                ->keyBy('date');

            // Build response data
            $trendData = [];
            foreach ($dateRange as $date) {
                $trendData[] = [
                    'date' => $date,
                    'enrollments' => $enrollmentData[$date]->enrollments ?? 0,
                    'completions' => $completionData[$date]->completions ?? 0,
                    'engagement' => $engagementData[$date]->attempts ?? 0,
                ];
            }

            if (empty($trendData)) {
                Log::warning('⚠️ No trend analysis data found for days: ' . $days);
                return response()->json([], 200);
            }

            Log::info('✅ Trend analysis data retrieved', [
                'days' => $days,
                'data_points' => count($trendData)
            ]);

            return response()->json($trendData, 200);

        } catch (\Exception $e) {
            Log::error('❌ Error fetching trend analysis data: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch trend analysis',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}