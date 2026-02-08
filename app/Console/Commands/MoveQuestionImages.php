<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class MoveQuestionImages extends Command
{
    protected $signature = 'move:question-images';
    protected $description = 'Move question images from private/public to public storage location';

    public function handle()
    {
        $this->line('=== Moving Question Images ===');

        $sourceDir = storage_path('app/private/public/questions');
        $targetDir = storage_path('app/public/questions');

        $this->line('Source: ' . $sourceDir);
        $this->line('Target: ' . $targetDir);

        if (!is_dir($sourceDir)) {
            $this->error('Source directory does not exist!');
            return 1;
        }

        // Ensure target directory exists
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
            $this->line('Created target directory');
        }

        // Get all files from source
        $files = File::allFiles($sourceDir);
        $this->line("\nFound " . count($files) . " files to move");

        $moved = 0;
        $failed = 0;

        foreach ($files as $file) {
            try {
                $filename = $file->getBasename();
                $targetPath = $targetDir . '/' . $filename;
                
                // Copy file to new location
                copy($file->getPathname(), $targetPath);
                
                // Verify copy
                if (file_exists($targetPath)) {
                    $this->line('✓ Moved: ' . $filename);
                    $moved++;
                } else {
                    $this->line('✗ Failed to verify: ' . $filename);
                    $failed++;
                }
            } catch (\Exception $e) {
                $this->error('Error moving ' . $filename . ': ' . $e->getMessage());
                $failed++;
            }
        }

        // Check for materials
        $sourceMaterials = storage_path('app/private/public/materials');
        $targetMaterials = storage_path('app/public/materials');
        
        if (is_dir($sourceMaterials)) {
            $this->line("\nMoving materials...");
            
            if (!is_dir($targetMaterials)) {
                mkdir($targetMaterials, 0755, true);
            }

            $materialFiles = File::allFiles($sourceMaterials);
            $this->line("Found " . count($materialFiles) . " material files");

            foreach ($materialFiles as $file) {
                try {
                    $filename = $file->getBasename();
                    $targetPath = $targetMaterials . '/' . $filename;
                    
                    copy($file->getPathname(), $targetPath);
                    
                    if (file_exists($targetPath)) {
                        $this->line('✓ Moved: ' . $filename);
                        $moved++;
                    } else {
                        $this->line('✗ Failed to verify: ' . $filename);
                        $failed++;
                    }
                } catch (\Exception $e) {
                    $this->error('Error moving ' . $filename . ': ' . $e->getMessage());
                    $failed++;
                }
            }
        }

        $this->newLine();
        $this->info("Successfully moved: {$moved} files");
        if ($failed > 0) {
            $this->warn("Failed: {$failed} files");
        }

        $this->info("\nNEXT STEP: Test by refreshing the page");
        
        return 0;
    }
}
