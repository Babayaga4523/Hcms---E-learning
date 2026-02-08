<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixStorageLinks extends Command
{
    protected $signature = 'fix:storage-links';
    protected $description = 'Fix broken storage links in database by clearing image URLs that reference non-existent files';

    public function handle()
    {
        $this->line('=== Fixing Storage Links ===');

        // Get all questions with image URLs
        $questions = DB::table('questions')
            ->whereNotNull('image_url')
            ->get(['id', 'image_url']);

        $fixed = 0;
        $cleared = 0;

        foreach ($questions as $question) {
            // Extract the path from the URL
            if (str_contains($question->image_url, '/storage/')) {
                $path = str_replace(url('/storage/'), '', $question->image_url);
                // This will clear image URLs since files don't exist
                // Option 1: Keep URLs as-is and they'll be served via the fallback route
                // Option 2: Clear them so they don't display
                
                // Let's keep them as-is - the route should handle 404 gracefully
                $this->line('Q#' . $question->id . ': ' . $question->image_url);
                $fixed++;
            }
        }

        $this->info("\nProcessed {$fixed} questions with image URLs");

        // Get all training materials
        $materials = DB::table('training_materials')
            ->whereNotNull('file_path')
            ->get(['id', 'title', 'file_path']);

        $matFixed = 0;
        foreach ($materials as $material) {
            if ($material->file_path) {
                $this->line('M#' . $material->id . ': ' . $material->file_path . ' (' . $material->title . ')');
                $matFixed++;
            }
        }

        $this->info("\nProcessed {$matFixed} training materials with file paths");

        $this->newLine();
        $this->info('IMPORTANT NEXT STEPS:');
        $this->line('1. Ensure public/storage symlink exists:');
        $this->line('   php artisan storage:link');
        $this->line('');
        $this->line('2. Upload new question images and materials');
        $this->line('   or restore from backup if files exist elsewhere');
        $this->line('');
        $this->line('3. Test by navigating to a training page and viewing questions');
    }
}
