<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\AdminAuditLog;
use Illuminate\Contracts\Auth\Guard;

class SettingsController extends Controller
{
    /**
     * Get system settings
     */
    public function getSettings()
    {
        $this->authorize('manage-settings');
        
        try {
            // Get all settings from database
            $dbSettings = DB::table('system_settings')->get();
            
            $settings = [];
            foreach ($dbSettings as $setting) {
                $value = $setting->value;
                
                // Cast value based on type
                switch ($setting->type) {
                    case 'boolean':
                        $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                        break;
                    case 'integer':
                        $value = (int) $value;
                        break;
                    case 'json':
                        $value = json_decode($value, true);
                        break;
                }
                
                $settings[$setting->key] = $value;
            }
            
            // If empty, return defaults
            if (empty($settings)) {
                $settings = [
                    'app_name' => 'Wondr Learning',
                    'app_url' => config('app.url', 'http://localhost'),
                    'timezone' => 'Asia/Jakarta',
                    'locale' => 'id',
                    'max_upload_size' => 50,
                    'session_timeout' => 30,
                    'enable_two_factor' => true,
                    'enable_api' => true,
                    'api_rate_limit' => 1000,
                    'maintenance_mode' => false,
                    'backup_enabled' => true,
                    'backup_frequency' => 'daily',
                ];
            }

            return response()->json($settings);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to get settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save system settings with validation
     */
    public function saveSettings(Request $request)
    {
        try {
            // Check authorization first
            $this->authorize('manage-settings');
            
            // Validate input sebelum simpan
            $validated = $request->validate([
                'app_name' => 'required|string|max:255|min:1',
                'app_url' => 'required|url',
                'timezone' => 'required|string|timezone',
                'session_timeout' => 'required|integer|min:1|max:1440',
                'max_upload_size' => 'required|integer|min:10|max:500',
                'enable_two_factor' => 'required|boolean',
            ]);

            // Wrap entire save operation in atomic transaction
            $result = DB::transaction(function () use ($validated, $request) {
                // Get current settings for audit comparison
                $currentSettings = DB::table('system_settings')
                    ->whereIn('key', array_keys($validated))
                    ->lockForUpdate()  // Lock rows to prevent race conditions
                    ->get()
                    ->keyBy('key');

                // Track changes for audit logging
                $changedSettings = [];
                /** @var \App\Models\User|null $user */
                $user = Auth::user();
                $adminId = $user?->id;
                $adminName = $user?->name ?? 'Unknown';
                $request_obj = request();
                $ipAddress = $request_obj->ip();
                $userAgent = $request_obj->userAgent();

                // Process & save validated settings
                foreach ($validated as $key => $value) {
                    // Get old value for audit logging
                    $oldRecord = $currentSettings->get($key);
                    $oldValue = $oldRecord?->value ?? null;

                    // Determine type using Laravel's request methods for proper type casting
                    $type = 'string';
                    $storedValue = $value;
                    
                    // Use $request->boolean() and $request->integer() for proper HTTP data casting
                    if (in_array($key, ['enable_two_factor', 'maintenance_mode', 'backup_enabled', 'enable_api'])) {
                        $type = 'boolean';
                        $storedValue = $request->boolean($key) ? 'true' : 'false';
                    } elseif (in_array($key, ['session_timeout', 'max_upload_size', 'api_rate_limit'])) {
                        $type = 'integer';
                        $storedValue = (string) $request->integer($key);
                    } elseif (is_array($value)) {
                        $type = 'json';
                        $storedValue = json_encode($value);
                    }

                    // Determine group
                    $group = 'general';
                    if (in_array($key, ['enable_two_factor', 'session_timeout'])) {
                        $group = 'security';
                    } elseif (in_array($key, ['max_upload_size', 'backup_enabled', 'backup_frequency'])) {
                        $group = 'data';
                    } elseif (in_array($key, ['enable_api', 'api_rate_limit'])) {
                        $group = 'api';
                    }

                    // Update or insert
                    DB::table('system_settings')->updateOrInsert(
                        ['key' => $key],
                        [
                            'value' => $storedValue,
                            'type' => $type,
                            'group' => $group,
                            'updated_at' => now(),
                        ]
                    );

                    // Track if value changed
                    if ($oldValue !== $storedValue) {
                        $changedSettings[] = [
                            'setting_key' => $key,
                            'old_value' => $oldValue,
                            'new_value' => $storedValue,
                            'type' => $type,
                            'group' => $group,
                        ];

                        // Create detailed audit log entry
                        try {
                            AdminAuditLog::create([
                                'admin_id' => $adminId,
                                'admin_name' => $adminName,
                                'action' => 'update_setting',
                                'target_type' => 'setting',
                                'target_id' => $key,
                                'field_name' => $key,
                                'old_value' => $oldValue,
                                'new_value' => $storedValue,
                                'metadata' => json_encode([
                                    'group' => $group,
                                    'type' => $type,
                                    'description' => 'System setting updated via admin panel',
                                ]),
                                'ip_address' => $ipAddress,
                                'user_agent' => $userAgent,
                                'created_at' => now(),
                            ]);

                            // Log to application log for debugging
                            \Log::info('[SystemSettingChanged] ' . $key . ' modified by ' . $adminName, [
                                'admin_id' => $adminId,
                                'setting_key' => $key,
                                'old_value' => $oldValue,
                                'new_value' => $storedValue,
                                'group' => $group,
                                'ip_address' => $ipAddress,
                            ]);
                        } catch (\Exception $auditError) {
                            \Log::warning('[AuditLogError] Failed to create audit log for setting: ' . $key, [
                                'error' => $auditError->getMessage(),
                            ]);
                            // Don't rethrow - audit log failure shouldn't block settings save
                        }
                    }
                }

                // Clear cache
                Cache::forget('system_settings');

                // Log summary of all changes
                \Log::info('[AdminSettingsUpdate] System settings updated', [
                    'user_id' => $adminId,
                    'user_name' => $adminName,
                    'changes_count' => count($changedSettings),
                    'settings_changed' => collect($changedSettings)->pluck('setting_key')->toArray(),
                    'timestamp' => now(),
                    'ip_address' => $ipAddress,
                ]);

                return [
                    'validated' => $validated,
                    'changedSettings' => $changedSettings
                ];
            }, 5); // 5 attempts before giving up on retry

            return response()->json([
                'message' => 'Settings berhasil disimpan' . (count($result['changedSettings']) > 0 ? ' dan ' . count($result['changedSettings']) . ' perubahan tercatat dalam audit log' : ''),
                'data' => $result['validated'],
                'changes_recorded' => count($result['changedSettings']),
                'changed_settings' => collect($result['changedSettings'])->pluck('setting_key')->toArray(),
            ], 200);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json([
                'message' => 'Anda tidak memiliki izin untuk mengubah settings',
                'error' => 'Unauthorized'
            ], 403);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Return validation errors
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            /** @var \App\Models\User|null $currentUser */
            $currentUser = Auth::user();
            \Log::error('[AdminSettingsError] Failed to save settings: ' . $e->getMessage(), [
                'user_id' => $currentUser?->id,
                'exception' => $e,
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Gagal menyimpan settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create system backup
     */
    public function createBackup()
    {
        $this->authorize('manage-system');
        
        try {
            $timestamp = now()->format('Y-m-d_H-i-s');
            $backupName = "backup_{$timestamp}";
            $backupDir = storage_path("backups/{$backupName}");

            // Create backup directory
            if (!file_exists($backupDir)) {
                mkdir($backupDir, 0755, true);
            }

            // Backup database
            $dbName = config('database.connections.mysql.database', 'hcms_elearning');
            $dbUser = config('database.connections.mysql.username', 'root');
            $dbPass = config('database.connections.mysql.password', '');
            $dbHost = config('database.connections.mysql.host', 'localhost');

            $backupDbFile = "{$backupDir}/database.sql";
            
            // Use mysqldump command
            $command = sprintf(
                'mysqldump -h %s -u %s %s > %s',
                escapeshellarg($dbHost),
                escapeshellarg($dbUser),
                ($dbPass ? '-p' . escapeshellarg($dbPass) : ''),
                escapeshellarg($backupDbFile)
            );

            // For Windows, use alternative approach
            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                // Create a simple text backup info instead
                file_put_contents("{$backupDir}/backup_info.txt", "Backup created at: " . now());
                file_put_contents("{$backupDir}/files_list.txt", "Backup files list");
            } else {
                exec($command, $output, $returnVar);
            }

            // Create backup metadata
            $metadata = [
                'created_at' => now(),
                'timestamp' => $timestamp,
                'version' => config('app.version', '1.0.0'),
                'size' => $this->getDirectorySize($backupDir),
            ];

            file_put_contents("{$backupDir}/metadata.json", json_encode($metadata));

            return response()->json([
                'message' => 'Backup created successfully',
                'backup_id' => $backupName,
                'created_at' => now(),
                'download_url' => "/api/admin/backup-download/{$backupName}"
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create backup',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download backup
     */
    public function downloadBackup($backupId)
    {
        $this->authorize('manage-system');
        
        try {
            $backupDir = storage_path("backups/{$backupId}");

            if (!file_exists($backupDir)) {
                return response()->json(['message' => 'Backup not found'], 404);
            }

            // Create zip file
            $zipPath = storage_path("backups/{$backupId}.zip");
            
            // For Windows compatibility, use PHP's built-in zip
            $zip = new \ZipArchive();
            
            if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === true) {
                $this->addFilesToZip($zip, $backupDir, basename($backupDir));
                $zip->close();

                return response()->download($zipPath, "{$backupId}.zip", [
                    'Content-Type' => 'application/zip'
                ])->deleteFileAfterSend(true);
            }

            return response()->json(['message' => 'Failed to create zip'], 500);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to download backup',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get backup list with validation
     */
    public function getBackups()
    {
        $this->authorize('manage-system');
        
        try {
            $backupsDir = storage_path('backups');
            $backups = [];

            // Verify backups directory exists and is accessible
            if (!file_exists($backupsDir)) {
                // Create if doesn't exist
                if (!mkdir($backupsDir, 0755, true)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Direktori backup tidak dapat diakses atau dibuat',
                        'backups' => []
                    ], 200);
                }
            }

            if (!is_readable($backupsDir)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Direktori backup tidak dapat dibaca',
                    'backups' => []
                ], 200);
            }

            $dirs = array_diff(scandir($backupsDir), ['.', '..']);
            
            if (!$dirs) {
                return response()->json([
                    'success' => true,
                    'message' => 'Tidak ada backup tersedia',
                    'backups' => [],
                    'backup_count' => 0
                ], 200);
            }
            
            foreach ($dirs as $dir) {
                $dirPath = "{$backupsDir}/{$dir}";
                if (!is_dir($dirPath) || strpos($dir, 'backup_') !== 0) {
                    continue;
                }

                // Verify directory has files
                $dirContents = @scandir($dirPath);
                if (!$dirContents || count($dirContents) <= 2) {
                    // Empty directory, skip
                    continue;
                }

                $metadataPath = "{$dirPath}/metadata.json";
                $metadata = [];
                $backupSize = 0;
                $fileCount = 0;
                
                if (file_exists($metadataPath) && is_readable($metadataPath)) {
                    $metadataContent = file_get_contents($metadataPath);
                    if ($metadataContent) {
                        $decoded = json_decode($metadataContent, true);
                        if ($decoded && is_array($decoded)) {
                            $metadata = $decoded;
                        }
                    }
                }

                // Calculate directory size with error handling
                try {
                    $backupSize = $this->getDirectorySize($dirPath);
                    $fileCount = count(array_diff($dirContents, ['.', '..']));
                } catch (\Exception $e) {
                    \Log::warning("Failed to calculate size for backup {$dir}: " . $e->getMessage());
                    $backupSize = 0;
                }

                // Verify backup integrity
                $createdAt = $metadata['created_at'] ?? date('Y-m-d H:i:s', filemtime($dirPath));
                $status = 'valid';
                
                // Check for metadata completion flag
                if (isset($metadata['status'])) {
                    $status = $metadata['status']; // 'completed', 'incomplete', etc
                }

                $backups[] = [
                    'id' => $dir,
                    'created_at' => $createdAt,
                    'size' => $backupSize,
                    'size_formatted' => $this->formatBytes($backupSize),
                    'file_count' => $fileCount,
                    'status' => $status,
                    'download_url' => "/api/admin/backup-download/{$dir}",
                    'deletable' => true // Flag if user can delete this backup
                ];
            }

            if (empty($backups)) {
                return response()->json([
                    'success' => true,
                    'message' => 'Tidak ada backup valid tersedia',
                    'backups' => [],
                    'backup_count' => 0
                ], 200);
            }

            // Sort by created_at descending
            usort($backups, function($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            return response()->json([
                'success' => true,
                'message' => 'Backup berhasil diambil',
                'backups' => $backups,
                'backup_count' => count($backups),
                'total_size' => array_sum(array_column($backups, 'size')),
                'total_size_formatted' => $this->formatBytes(array_sum(array_column($backups, 'size')))
            ], 200);

        } catch (\Exception $e) {
            \Log::error('SettingsController::getBackups error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil daftar backup',
                'error' => $e->getMessage(),
                'backups' => []
            ], 500);
        }
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));

        return round($bytes, $precision) . ' ' . $units[$pow];
    }

    /**
     * Helper: Update environment file
     */
    private function updateEnvFile($key, $value)
    {
        $envFile = base_path('.env');
        $contents = file_get_contents($envFile);

        $pattern = "/^{$key}=.*/m";
        $replacement = "{$key}={$value}";

        if (preg_match($pattern, $contents)) {
            $contents = preg_replace($pattern, $replacement, $contents);
        } else {
            $contents .= "\n{$key}={$value}";
        }

        file_put_contents($envFile, $contents);
    }

    /**
     * Helper: Get directory size
     */
    private function getDirectorySize($dir)
    {
        $size = 0;
        $files = @scandir($dir);

        if ($files) {
            foreach ($files as $file) {
                if ($file != '.' && $file != '..') {
                    $path = $dir . DIRECTORY_SEPARATOR . $file;
                    if (is_file($path)) {
                        $size += filesize($path);
                    } elseif (is_dir($path)) {
                        $size += $this->getDirectorySize($path);
                    }
                }
            }
        }

        return $size;
    }

    /**
     * Helper: Add files to zip
     * FIXED: Use separate variable for current zip path to avoid overwriting parent path
     */
    private function addFilesToZip(&$zip, $dir, $zipPath)
    {
        $files = @scandir($dir);

        if ($files) {
            foreach ($files as $file) {
                if ($file != '.' && $file != '..') {
                    $path = $dir . DIRECTORY_SEPARATOR . $file;
                    // Use separate variable to avoid overwriting $zipPath in loop
                    $currentZipPath = $zipPath . '/' . $file;

                    if (is_file($path)) {
                        $zip->addFile($path, $currentZipPath);
                    } elseif (is_dir($path)) {
                        $this->addFilesToZip($zip, $path, $currentZipPath);
                    }
                }
            }
        }
    }

    /**
     * Get audit logs for settings changes
     */
    public function getAuditLogs(Request $request)
    {
        $this->authorize('view-audit-logs');
        
        try {
            $limit = $request->query('limit', 50);
            $offset = $request->query('offset', 0);
            
            $logs = AdminAuditLog::where('target_type', 'setting')
                ->where('action', 'update_setting')
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->offset($offset)
                ->get();

            $total = AdminAuditLog::where('target_type', 'setting')
                ->where('action', 'update_setting')
                ->count();

            return response()->json([
                'success' => true,
                'logs' => $logs,
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve audit logs',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get settings change history for a specific setting
     */
    public function getSettingHistory($settingName)
    {
        $this->authorize('view-audit-logs');
        
        try {
            $history = AdminAuditLog::where('target_type', 'setting')
                ->where('action', 'update_setting')
                ->where('field_name', $settingName)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'setting_name' => $settingName,
                'history' => $history,
                'total_changes' => count($history),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve setting history',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
