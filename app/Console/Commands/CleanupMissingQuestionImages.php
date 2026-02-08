<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class CleanupMissingQuestionImages extends Command
{
    protected $signature = 'questions:cleanup-missing-images {--report-only : Only show report, do not delete}';
    protected $description = 'Find and cleanup questions with missing image files';

    public function handle()
    {
        $this->info('=== Question Images Cleanup ===');
        $reportOnly = $this->option('report-only');

        // 1. Get all questions with image_url
        $questionsWithImages = DB::table('questions')
            ->whereNotNull('image_url')
            ->where('image_url', '!=', '')
            ->get(['id', 'module_id', 'image_url', 'question_text']);

        $this->info("\nTotal questions with image_url: " . count($questionsWithImages));

        // 2. Check which files are missing
        $missing = [];
        $disk = Storage::disk('public');

        foreach ($questionsWithImages as $q) {
            // Extract filename from URL
            $filename = basename(parse_url($q->image_url, PHP_URL_PATH));
            $storagePath = 'questions/' . $filename;

            if (!$disk->exists($storagePath)) {
                $missing[] = $q;
            }
        }

        if (count($missing) > 0) {
            $this->error("\n❌ Found " . count($missing) . " questions with MISSING image files:\n");
            
            foreach ($missing as $m) {
                $filename = basename(parse_url($m->image_url, PHP_URL_PATH));
                $this->line("  Q#{$m->id} (Module {$m->module_id}): {$filename}");
                $this->line("    Text: " . substr($m->question_text, 0, 50) . "...");
                $this->line("    URL:  {$m->image_url}");
            }

            if (!$reportOnly) {
                if ($this->confirm("\nDelete image_url from these questions?")) {
                    $ids = array_map(fn($q) => $q->id, $missing);
                    DB::table('questions')
                        ->whereIn('id', $ids)
                        ->update(['image_url' => null]);

                    $this->info("\n✅ Cleared image_url for " . count($missing) . " questions");
                    Log::info('Cleaned up missing question images', ['count' => count($missing), 'ids' => $ids]);
                }
            }
        } else {
            $this->info("\n✅ All question images found in storage");
        }

        // 3. Summary
        $this->info("\n=== Summary ===");
        $this->line("Total questions with images: " . count($questionsWithImages));
        $this->line("Valid (file exists): " . (count($questionsWithImages) - count($missing)));
        $this->line("Missing (file not found): " . count($missing));

        if ($reportOnly) {
            $this->line("\n(Running in report-only mode. Use without --report-only to clean up)");
        }
    }
}
?>
