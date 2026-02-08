<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CleanupMissingImages extends Command
{
    protected $signature = 'cleanup:missing-images';
    protected $description = 'Remove image_url references for questions where the image file does not exist';

    public function handle()
    {
        $this->line('=== Cleaning Up Missing Question Images ===');
        $this->newLine();

        // Get all questions with image URLs
        $questions = DB::table('questions')
            ->whereNotNull('image_url')
            ->get(['id', 'module_id', 'image_url']);

        $this->line("Total questions with image_url: " . count($questions));

        $missing = 0;
        $found = 0;
        $details = [];

        foreach ($questions as $question) {
            // Extract filename from URL
            if (str_contains($question->image_url, '/storage/')) {
                $filename = basename($question->image_url);
                $paths = [
                    'questions/' . $filename,
                    'questions/' . ltrim(str_replace('/storage/questions/', '', $question->image_url), '/'),
                ];

                $fileExists = false;
                foreach ($paths as $path) {
                    if (@Storage::disk('public')->exists($path)) {
                        $fileExists = true;
                        break;
                    }
                }

                if (!$fileExists) {
                    $missing++;
                    $details[] = [
                        'id' => $question->id,
                        'module' => $question->module_id,
                        'filename' => $filename,
                        'url' => $question->image_url
                    ];
                } else {
                    $found++;
                }
            }
        }

        $this->line("Files that exist: $found ✓");
        $this->line("Files that are missing: $missing ✗");
        $this->newLine();

        if ($missing > 0) {
            $this->warn("Missing Image Details:");
            foreach ($details as $detail) {
                $this->line("  Q#{$detail['id']} (Module {$detail['module']}): {$detail['filename']}");
            }

            $this->newLine();
            $this->question('Do you want to clear these broken references? (yes/no)');
            
            if ($this->confirm('Clear missing image references?')) {
                $cleared = 0;
                foreach ($details as $detail) {
                    DB::table('questions')
                        ->where('id', $detail['id'])
                        ->update(['image_url' => null]);
                    $cleared++;
                }

                $this->info("\n✓ Cleared $cleared broken image references from database");
                $this->line("\nNEXT STEPS:");
                $this->line("1. Questions without images will display without image placeholders");
                $this->line("2. Users can re-upload images using the question editor");
                $this->line("3. Images will be saved to: storage/app/public/questions/");
                $this->line("4. And be accessible via: /storage/questions/{filename}");
            } else {
                $this->line("No changes made.");
            }
        } else {
            $this->info("\n✓ All question image references have corresponding files!");
        }

        $this->newLine();
    }
}
