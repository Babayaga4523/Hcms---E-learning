<?php

require_once __DIR__ . '/bootstrap/app.php';

use App\Models\Question;
use Illuminate\Support\Facades\Storage;

echo "=== CLEANUP: Fixing Orphaned Question Image References ===\n\n";

try {
    $questions = Question::whereNotNull('image_url')->get();
    echo "Found {$questions->count()} questions with images\n\n";

    $orphaned = 0;
    foreach ($questions as $question) {
        $imageUrl = $question->image_url;
        $filename = null;

        if (str_starts_with($imageUrl, '/storage/questions/')) {
            $filename = str_replace('/storage/questions/', '', $imageUrl);
        } elseif (str_starts_with($imageUrl, 'questions/')) {
            $filename = str_replace('questions/', '', $imageUrl);
        }

        if ($filename && !Storage::exists('public/questions/' . $filename)) {
            echo "❌ Removing orphaned reference for question ID: {$question->id}\n";
            $question->update(['image_url' => null]);
            $orphaned++;
        } else {
            echo "✅ Valid reference for question ID: {$question->id}\n";
        }
    }

    echo "\n=== SUMMARY ===\n";
    echo "Fixed {$orphaned} orphaned references\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}