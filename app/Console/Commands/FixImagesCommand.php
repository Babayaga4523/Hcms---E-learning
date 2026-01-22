<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FixImagesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fix:images {--create-placeholders : Create placeholder images for missing files} {--move-private : Try to move files from storage/app/questions to public}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for missing question images, export CSV report, and optionally fix issues';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking question images...');

        $questions = DB::table('questions')
            ->whereNotNull('image_url')
            ->where('image_url', 'like', 'storage/questions/%')
            ->get();

        $missing = [];
        $existing = [];
        $moved = [];
        $placeholders = [];

        foreach ($questions as $question) {
            $path = str_replace('storage/', '', $question->image_url); // e.g., questions/filename.png
            $fullPath = storage_path('app/public/' . $path);

            if (file_exists($fullPath)) {
                $existing[] = $question;
            } else {
                $missing[] = $question;

                // Try to move from private if option enabled
                if ($this->option('move-private')) {
                    $privatePath = storage_path('app/questions/' . basename($path));
                    if (file_exists($privatePath)) {
                        if (!is_dir(dirname($fullPath))) {
                            mkdir(dirname($fullPath), 0755, true);
                        }
                        if (rename($privatePath, $fullPath)) {
                            $moved[] = $question;
                            $this->line("Moved: {$question->id} - {$question->image_url}");
                        }
                    }
                }

                // Create placeholder if option enabled
                if ($this->option('create-placeholders') && !file_exists($fullPath)) {
                    if (!is_dir(dirname($fullPath))) {
                        mkdir(dirname($fullPath), 0755, true);
                    }
                    // Small 1x1 PNG placeholder
                    file_put_contents($fullPath, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgV8Z7dMAAAAASUVORK5CYII='));
                    $placeholders[] = $question;
                    $this->line("Created placeholder: {$question->id} - {$question->image_url}");
                }
            }
        }

        // Export CSV
        $csvPath = storage_path('app/missing_images_report.csv');
        $handle = fopen($csvPath, 'w');
        fputcsv($handle, ['id', 'image_url', 'status']);
        foreach ($missing as $q) {
            fputcsv($handle, [$q->id, $q->image_url, 'missing']);
        }
        foreach ($moved as $q) {
            fputcsv($handle, [$q->id, $q->image_url, 'moved_from_private']);
        }
        foreach ($placeholders as $q) {
            fputcsv($handle, [$q->id, $q->image_url, 'placeholder_created']);
        }
        fclose($handle);

        $this->info("Report exported to: {$csvPath}");
        $this->info("Total questions with images: " . count($questions));
        $this->info("Existing: " . count($existing));
        $this->info("Missing: " . count($missing));
        $this->info("Moved from private: " . count($moved));
        $this->info("Placeholders created: " . count($placeholders));

        return 0;
    }
}