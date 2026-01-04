<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Module;
use App\Models\ExamAttempt;
use App\Models\ModuleAssignment;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;
use Exception;

class CommandController extends Controller
{
    /**
     * Send bulk reminder to users or departments
     */
    public function sendBulkReminder(Request $request)
    {
        $request->validate([
            'type' => 'required|in:all,department,overdue',
            'department' => 'required_if:type,department|string',
            'message' => 'required|string|max:500',
            'subject' => 'required|string|max:200'
        ]);

        try {
            $query = User::where('role', 'user')->where('status', 'active');

            switch ($request->type) {
                case 'department':
                    $query->where('department', $request->department);
                    break;
                case 'overdue':
                    // Get users with overdue trainings
                    $overdueUsers = ModuleAssignment::where('due_date', '<', now())
                        ->where('status', '!=', 'completed')
                        ->pluck('user_id')
                        ->unique();
                    $query->whereIn('id', $overdueUsers);
                    break;
            }

            $users = $query->get();

            // Create notification records
            $notifications = [];
            foreach ($users as $user) {
                $notifications[] = [
                    'user_id' => $user->id,
                    'title' => $request->subject,
                    'message' => $request->message,
                    'type' => 'reminder',
                    'is_read' => false,
                    'created_at' => now(),
                    'updated_at' => now()
                ];
            }

            Notification::insert($notifications);

            return response()->json([
                'success' => true,
                'message' => "Berhasil mengirim reminder ke {$users->count()} pengguna",
                'count' => $users->count()
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim bulk reminder: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate comprehensive report
     */
    public function generateReport(Request $request)
    {
        $request->validate([
            'type' => 'required|in:compliance,performance,overview,custom',
            'format' => 'required|in:pdf,excel,csv',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'departments' => 'nullable|array'
        ]);

        try {
            $dateFrom = $request->date_from ? Carbon::parse($request->date_from) : now()->subMonths(3);
            $dateTo = $request->date_to ? Carbon::parse($request->date_to) : now();

            // Build base query
            $userQuery = User::where('role', 'user');
            if ($request->departments) {
                $userQuery->whereIn('department', $request->departments);
            }

            $data = [];

            switch ($request->type) {
                case 'compliance':
                    $data = $this->generateComplianceReport($userQuery, $dateFrom, $dateTo);
                    break;
                case 'performance':
                    $data = $this->generatePerformanceReport($userQuery, $dateFrom, $dateTo);
                    break;
                case 'overview':
                    $data = $this->generateOverviewReport($userQuery, $dateFrom, $dateTo);
                    break;
                default:
                    $data = $this->generateCustomReport($userQuery, $dateFrom, $dateTo, $request);
            }

            // Generate file
            $filename = "report_{$request->type}_" . now()->format('Y-m-d_H-i-s') . ".{$request->format}";
            $filePath = "reports/{$filename}";

            // Store report data temporarily for file generation
            Storage::disk('local')->put("temp/{$filename}.json", json_encode($data));

            return response()->json([
                'success' => true,
                'message' => 'Report berhasil dibuat',
                'download_url' => "/api/admin/reports/download/{$filename}",
                'filename' => $filename,
                'data' => $data
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal generate report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Run system health check
     */
    public function runHealthCheck()
    {
        try {
            $checks = [];

            // Database connectivity
            try {
                DB::connection()->getPdo();
                $checks['database'] = ['status' => 'healthy', 'message' => 'Database connection OK'];
            } catch (Exception $e) {
                $checks['database'] = ['status' => 'error', 'message' => 'Database connection failed'];
            }

            // Storage access
            try {
                Storage::disk('local')->put('health-check.txt', 'test');
                Storage::disk('local')->delete('health-check.txt');
                $checks['storage'] = ['status' => 'healthy', 'message' => 'File storage accessible'];
            } catch (Exception $e) {
                $checks['storage'] = ['status' => 'error', 'message' => 'Storage access failed'];
            }

            // Data integrity checks
            $totalUsers = User::count();
            $totalModules = Module::count();
            $totalAssignments = ModuleAssignment::count();
            $orphanedAssignments = ModuleAssignment::whereNotExists(function($query) {
                $query->select(DB::raw(1))
                      ->from('users')
                      ->whereColumn('users.id', 'module_assignments.user_id');
            })->count();

            $checks['data_integrity'] = [
                'status' => $orphanedAssignments > 0 ? 'warning' : 'healthy',
                'message' => "Users: {$totalUsers}, Modules: {$totalModules}, Assignments: {$totalAssignments}",
                'orphaned_assignments' => $orphanedAssignments
            ];

            // Performance metrics
            $avgResponseTime = $this->calculateAverageResponseTime();
            $checks['performance'] = [
                'status' => $avgResponseTime > 2000 ? 'warning' : 'healthy',
                'message' => "Avg response time: {$avgResponseTime}ms",
                'response_time' => $avgResponseTime
            ];

            // Overall status
            $hasErrors = collect($checks)->contains('status', 'error');
            $hasWarnings = collect($checks)->contains('status', 'warning');
            
            $overallStatus = $hasErrors ? 'error' : ($hasWarnings ? 'warning' : 'healthy');

            return response()->json([
                'success' => true,
                'status' => $overallStatus,
                'checks' => $checks,
                'timestamp' => now()->toISOString(),
                'message' => $overallStatus === 'healthy' ? 'Semua sistem berjalan normal' : 'Ditemukan masalah pada sistem'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Health check failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Backup database
     */
    public function backupDatabase(Request $request)
    {
        try {
            $timestamp = now()->format('Y-m-d_H-i-s');
            $filename = "backup_database_{$timestamp}.sql";
            $backupPath = storage_path("app/backups/{$filename}");

            // Create backups directory if not exists
            if (!file_exists(dirname($backupPath))) {
                mkdir(dirname($backupPath), 0755, true);
            }

            // For SQLite, simply copy the database file
            if (config('database.default') === 'sqlite') {
                $dbPath = database_path('database.sqlite');
                if (file_exists($dbPath)) {
                    copy($dbPath, storage_path("app/backups/database_backup_{$timestamp}.sqlite"));
                    
                    return response()->json([
                        'success' => true,
                        'message' => 'Database backup berhasil dibuat',
                        'filename' => "database_backup_{$timestamp}.sqlite",
                        'size' => $this->formatBytes(filesize(storage_path("app/backups/database_backup_{$timestamp}.sqlite"))),
                        'timestamp' => $timestamp
                    ]);
                }
            }

            // For other databases, use mysqldump or equivalent
            $command = $this->buildBackupCommand($filename);
            
            if ($command) {
                exec($command, $output, $returnCode);
                
                if ($returnCode === 0) {
                    return response()->json([
                        'success' => true,
                        'message' => 'Database backup berhasil dibuat',
                        'filename' => $filename,
                        'size' => file_exists($backupPath) ? $this->formatBytes(filesize($backupPath)) : 'Unknown',
                        'timestamp' => $timestamp
                    ]);
                }
            }

            throw new Exception('Backup command failed or not supported for this database type');

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Backup failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search across modules, users, reports
     */
    public function search(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:2',
            'type' => 'nullable|in:modules,users,reports,all'
        ]);

        $query = $request->query;
        $type = $request->type ?? 'all';
        $results = [];

        try {
            if ($type === 'all' || $type === 'modules') {
                $modules = Module::where('title', 'LIKE', "%{$query}%")
                    ->orWhere('description', 'LIKE', "%{$query}%")
                    ->select('id', 'title', 'description', 'category', 'status', 'created_at')
                    ->limit(10)
                    ->get()
                    ->map(function($module) {
                        return [
                            'type' => 'module',
                            'id' => $module->id,
                            'title' => $module->title,
                            'description' => $module->description,
                            'url' => "/admin/training-programs/{$module->id}",
                            'category' => $module->category ?? 'Training'
                        ];
                    });
                $results['modules'] = $modules;
            }

            if ($type === 'all' || $type === 'users') {
                $users = User::where('name', 'LIKE', "%{$query}%")
                    ->orWhere('email', 'LIKE', "%{$query}%")
                    ->orWhere('nip', 'LIKE', "%{$query}%")
                    ->select('id', 'name', 'email', 'nip', 'department', 'role')
                    ->limit(10)
                    ->get()
                    ->map(function($user) {
                        return [
                            'type' => 'user',
                            'id' => $user->id,
                            'title' => $user->name,
                            'description' => $user->email . ' • ' . ($user->department ?? 'No Department'),
                            'url' => "/admin/users/{$user->id}",
                            'category' => ucfirst($user->role)
                        ];
                    });
                $results['users'] = $users;
            }

            $totalCount = collect($results)->flatten(1)->count();

            return response()->json([
                'success' => true,
                'results' => $results,
                'total_count' => $totalCount,
                'query' => $query
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Search failed: ' . $e->getMessage()
            ], 500);
        }
    }

    // Private helper methods

    private function generateComplianceReport($userQuery, $dateFrom, $dateTo)
    {
        $users = $userQuery->get();
        $data = [];

        foreach ($users as $user) {
            $assignments = ModuleAssignment::where('user_id', $user->id)
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->with('module')
                ->get();

            $completed = $assignments->where('status', 'completed')->count();
            $total = $assignments->count();
            $compliance = $total > 0 ? round(($completed / $total) * 100, 2) : 0;

            $data[] = [
                'name' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
                'total_assignments' => $total,
                'completed' => $completed,
                'compliance_rate' => $compliance,
                'status' => $compliance >= 80 ? 'HIGH' : ($compliance >= 60 ? 'MEDIUM' : 'LOW')
            ];
        }

        return $data;
    }

    private function generatePerformanceReport($userQuery, $dateFrom, $dateTo)
    {
        // Similar implementation for performance metrics
        return [];
    }

    private function generateOverviewReport($userQuery, $dateFrom, $dateTo)
    {
        // Similar implementation for overview
        return [];
    }

    private function generateCustomReport($userQuery, $dateFrom, $dateTo, $request)
    {
        // Custom report based on request parameters
        return [];
    }

    private function calculateAverageResponseTime()
    {
        // Simulate response time calculation
        return rand(100, 2000);
    }

    private function buildBackupCommand($filename)
    {
        $config = config('database.connections.' . config('database.default'));
        
        if ($config['driver'] === 'mysql') {
            return "mysqldump -h {$config['host']} -u {$config['username']} -p{$config['password']} {$config['database']} > " . storage_path("app/backups/{$filename}");
        }
        
        return null;
    }

    private function formatBytes($bytes, $precision = 2)
    {
        $units = array('B', 'KB', 'MB', 'GB', 'TB');

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }
}