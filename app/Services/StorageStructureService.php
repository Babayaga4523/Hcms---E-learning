<?php
/**
 * Ensure Storage Directories Exist
 * 
 * Run this during app initialization to ensure all storage folders are created
 */

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class StorageStructureService
{
    /**
     * Required folders dalam public storage
     */
    protected static $requiredFolders = [
        'questions',           // Quiz images
        'materials',          // Training materials
        'materials/documents',
        'materials/presentations',
        'materials/videos',
        'training-programs',  // Program assets
    ];
    
    /**
     * Initialize storage structure
     */
    public static function initialize()
    {
        $disk = Storage::disk('public');
        $created = [];
        $failed = [];
        
        foreach (self::$requiredFolders as $folder) {
            if (!$disk->exists($folder)) {
                try {
                    $disk->makeDirectory($folder);
                    $created[] = $folder;
                    Log::info("Created storage folder: $folder");
                } catch (\Exception $e) {
                    $failed[$folder] = $e->getMessage();
                    Log::warning("Failed to create storage folder: $folder - " . $e->getMessage());
                }
            }
        }
        
        return [
            'success' => count($failed) === 0,
            'created' => $created,
            'failed' => $failed,
            'message' => count($created) . ' folders created, ' . count($failed) . ' failed'
        ];
    }
    
    /**
     * Verify storage structure is correct
     */
    public static function verify()
    {
        $disk = Storage::disk('public');
        $results = [
            'timestamp' => now(),
            'folders' => [],
            'issues' => [],
        ];
        
        foreach (self::$requiredFolders as $folder) {
            $exists = $disk->exists($folder);
            $results['folders'][$folder] = [
                'exists' => $exists,
                'writable' => $exists && is_writable(storage_path("app/public/$folder")),
            ];
            
            if (!$exists) {
                $results['issues'][] = "Missing folder: $folder";
            }
        }
        
        // Check symlink
        $symlinkExists = is_dir('public/storage') || is_link('public/storage');
        $results['symlink'] = [
            'exists' => $symlinkExists,
            'valid' => $symlinkExists && is_readable('public/storage'),
        ];
        
        if (!$symlinkExists) {
            $results['issues'][] = "Symlink missing: public/storage";
        }
        
        $results['status'] = empty($results['issues']) ? 'HEALTHY' : 'ISSUES_FOUND';
        
        return $results;
    }
    
    /**
     * Auto-fix storage structure issues
     */
    public static function repair()
    {
        $init = self::initialize();
        
        // Check symlink
        if (!is_dir('public/storage') && !is_link('public/storage')) {
            Log::info("Symlink not found, you may need to run: php artisan storage:link");
        }
        
        return $init;
    }
}
