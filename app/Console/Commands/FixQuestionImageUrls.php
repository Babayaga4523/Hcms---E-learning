<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Question;
use Illuminate\Support\Facades\Storage;

class FixQuestionImageUrls extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:fix-question-image-urls';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix question image URLs to use public storage paths';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Fixing question image URLs...');

        $questions = Question::whereNotNull('image_url')->get();
        $updated = 0;

        foreach ($questions as $question) {
            $oldUrl = $question->image_url;
            $newUrl = null;

            // If it starts with 'private/questions/', change to public URL
            if (str_starts_with($oldUrl, 'private/questions/')) {
                $filename = str_replace('private/questions/', '', $oldUrl);
                $newUrl = '/storage/questions/' . $filename;
            }
            // If it's already a full URL but wrong path
            elseif (str_contains($oldUrl, '/storage/questions/private/questions/')) {
                $filename = basename($oldUrl);
                $newUrl = '/storage/questions/' . $filename;
            }
            // If it's just a filename, assume it's in questions/
            elseif (!str_contains($oldUrl, '/storage/') && !str_contains($oldUrl, 'http')) {
                $newUrl = '/storage/questions/' . $oldUrl;
            }
            // If it's an absolute URL, make it relative
            elseif (str_contains($oldUrl, 'http') && str_contains($oldUrl, '/storage/questions/')) {
                $filename = basename($oldUrl);
                $newUrl = '/storage/questions/' . $filename;
            }

            if ($newUrl && $newUrl !== $oldUrl) {
                $question->update(['image_url' => $newUrl]);
                $updated++;
                $this->line("Updated: {$oldUrl} -> {$newUrl}");
            }
        }

        $this->info("Updated {$updated} question image URLs.");
    }
}
