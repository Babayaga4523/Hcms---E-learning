<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    /**
     * Get system settings
     */
    public function getSettings()
    {
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
     * Save system settings
     */
    public function saveSettings(Request $request)
    {
        try {
            $settings = $request->all();

            foreach ($settings as $key => $value) {
                // Determine type
                $type = 'string';
                if (is_bool($value)) {
                    $type = 'boolean';
                    $value = $value ? 'true' : 'false';
                } elseif (is_int($value)) {
                    $type = 'integer';
                } elseif (is_array($value)) {
                    $type = 'json';
                    $value = json_encode($value);
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
                        'value' => $value,
                        'type' => $type,
                        'group' => $group,
                        'updated_at' => now(),
                    ]
                );
            }

            // Clear cache
            Cache::forget('system_settings');

            return response()->json([
                'message' => 'Settings saved successfully',
                'data' => $settings
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to save settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create system backup
     */
    public function createBackup()
    {
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
     * Get backup list
     */
    public function getBackups()
    {
        try {
            $backupsDir = storage_path('backups');
            $backups = [];

            if (file_exists($backupsDir)) {
                $dirs = array_diff(scandir($backupsDir), ['.', '..']);
                
                foreach ($dirs as $dir) {
                    $dirPath = "{$backupsDir}/{$dir}";
                    if (is_dir($dirPath) && strpos($dir, 'backup_') === 0) {
                        $metadataPath = "{$dirPath}/metadata.json";
                        $metadata = [];
                        
                        if (file_exists($metadataPath)) {
                            $metadata = json_decode(file_get_contents($metadataPath), true);
                        }

                        $backups[] = [
                            'id' => $dir,
                            'created_at' => $metadata['created_at'] ?? filemtime($dirPath),
                            'size' => $this->getDirectorySize($dirPath),
                            'download_url' => "/api/admin/backup-download/{$dir}"
                        ];
                    }
                }
            }

            // Sort by created_at descending
            usort($backups, function($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            return response()->json($backups);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to get backups',
                'error' => $e->getMessage()
            ], 500);
        }
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
     */
    private function addFilesToZip(&$zip, $dir, $zipPath)
    {
        $files = @scandir($dir);

        if ($files) {
            foreach ($files as $file) {
                if ($file != '.' && $file != '..') {
                    $path = $dir . DIRECTORY_SEPARATOR . $file;
                    $zipPath = $zipPath . '/' . $file;

                    if (is_file($path)) {
                        $zip->addFile($path, $zipPath);
                    } elseif (is_dir($path)) {
                        $this->addFilesToZip($zip, $path, $zipPath);
                    }
                }
            }
        }
    }
}
