<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CleanupOrphanedMaterials extends Command
{
    protected $signature = 'cleanup:orphaned-materials';
    protected $description = 'Remove training materials that reference non-existent files';

    public function handle()
    {
        $this->line('=== Cleaning Up Orphaned Training Materials ===');
        $this->newLine();

        // Get all materials with file paths
        $materials = DB::table('training_materials')
            ->whereNotNull('file_path')
            ->get(['id', 'module_id', 'title', 'file_path']);

        $orphaned = [];

        foreach ($materials as $material) {
            $exists = @Storage::disk('public')->exists($material->file_path);
            
            if (!$exists) {
                // Also check if the file exists by any name
                $filename = basename($material->file_path);
                $files = Storage::disk('public')->files('materials');
                
                $found = false;
                foreach ($files as $file) {
                    $fileBasename = basename($file);
                    $fileBase = preg_replace('/^\d+_/', '', $fileBasename);
                    $materialBase = preg_replace('/^\d+_/', '', $filename);
                    
                    if ($fileBase === $materialBase) {
                        $found = true;
                        break;
                    }
                }
                
                if (!$found) {
                    $orphaned[] = [
                        'id' => $material->id,
                        'module_id' => $material->module_id,
                        'title' => $material->title,
                        'path' => $material->file_path
                    ];
                }
            }
        }

        if (empty($orphaned)) {
            $this->info("✓ No orphaned materials found!");
            return 0;
        }

        $this->warn("Found " . count($orphaned) . " orphaned materials:");
        foreach ($orphaned as $mat) {
            $this->line("  M#{$mat['id']} (Module {$mat['module_id']}): {$mat['title']}");
            $this->line("     Path: {$mat['path']}");
        }

        $this->newLine();
        if ($this->confirm('Delete these orphaned material records?')) {
            $deleted = 0;
            foreach ($orphaned as $mat) {
                DB::table('training_materials')->where('id', $mat['id'])->delete();
                $deleted++;
            }

            $this->info("\n✓ Deleted $deleted orphaned material records");
        } else {
            $this->line("No changes made.");
        }
    }
}
