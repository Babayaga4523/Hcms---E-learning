<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class FixMaterialFilePaths extends Command
{
    protected $signature = 'fix:material-paths';
    protected $description = 'Fix material file paths in database to match actual files in storage';

    public function handle()
    {
        $this->line('=== Fixing Material File Paths ===');
        $this->newLine();

        // Get all materials with file paths
        $materials = DB::table('training_materials')
            ->whereNotNull('file_path')
            ->get(['id', 'title', 'file_path']);

        $this->line("Total materials with file_path: " . count($materials));
        $this->newLine();

        $fixed = 0;
        $missing = [];

        foreach ($materials as $material) {
            // Check if file exists
            $exists = @Storage::disk('public')->exists($material->file_path);
            
            if (!$exists) {
                // Try to find the file by filename alone
                $filename = basename($material->file_path);
                $files = Storage::disk('public')->files('materials');
                
                $found = false;
                foreach ($files as $file) {
                    if (str_ends_with($file, $filename)) {
                        // Found it!
                        DB::table('training_materials')
                            ->where('id', $material->id)
                            ->update(['file_path' => $file]);
                        
                        $this->line("✓ Fixed: {$material->title}");
                        $this->line("  From: {$material->file_path}");
                        $this->line("  To:   {$file}");
                        $fixed++;
                        $found = true;
                        break;
                    }
                }
                
                if (!$found) {
                    // Try by just matching the filename without timestamp
                    $baseFilename = preg_replace('/^\d+_/', '', $filename);
                    foreach ($files as $file) {
                        $fileBasename = basename($file);
                        $fileBase = preg_replace('/^\d+_/', '', $fileBasename);
                        
                        if ($fileBase === $baseFilename) {
                            DB::table('training_materials')
                                ->where('id', $material->id)
                                ->update(['file_path' => $file]);
                            
                            $this->line("✓ Fixed (by name): {$material->title}");
                            $this->line("  From: {$material->file_path}");
                            $this->line("  To:   {$file}");
                            $fixed++;
                            $found = true;
                            break;
                        }
                    }
                }
                
                if (!$found) {
                    $missing[] = [
                        'id' => $material->id,
                        'title' => $material->title,
                        'path' => $material->file_path
                    ];
                }
            }
        }

        $this->newLine();
        $this->info("✓ Fixed: $fixed materials");

        if (!empty($missing)) {
            $this->warn("\n✗ Still Missing " . count($missing) . " materials:");
            foreach ($missing as $m) {
                $this->line("  M#{$m['id']}: {$m['title']}");
                $this->line("     Path: {$m['path']}");
            }
        } else {
            $this->info("\n✓ All material files are now properly linked!");
        }
    }
}
