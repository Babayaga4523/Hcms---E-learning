<?php

// Cleanup script untuk memperbaiki referensi gambar yang tidak valid
require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\Question;

echo "=== CLEANUP: Fixing Orphaned Question Image References ===\n\n";

try {
    // Get all questions with image_url
    $questionsWithImages = Question::whereNotNull('image_url')->get();

    echo "Found " . $questionsWithImages->count() . " questions with image references\n\n";

    $fixed = 0;
    $orphaned = 0;

    foreach ($questionsWithImages as $question) {
        $imageUrl = $question->image_url;

        // Extract filename from various possible formats
        $filename = null;

        if (str_starts_with($imageUrl, '/storage/questions/')) {
            $filename = str_replace('/storage/questions/', '', $imageUrl);
        } elseif (str_starts_with($imageUrl, 'questions/')) {
            $filename = str_replace('questions/', '', $imageUrl);
        } elseif (str_starts_with($imageUrl, '/storage/')) {
            $filename = str_replace('/storage/', '', $imageUrl);
        }

        if ($filename) {
            $fullPath = 'public/questions/' . $filename;

            if (Storage::exists($fullPath)) {
                echo "✅ File exists: {$filename} (Question ID: {$question->id})\n";
            } else {
                echo "❌ File missing: {$filename} (Question ID: {$question->id})\n";
                echo "   Removing orphaned reference...\n";

                // Remove the orphaned image reference
                $question->update(['image_url' => null]);
                $orphaned++;
            }
        } else {
            echo "⚠️  Unrecognized format: {$imageUrl} (Question ID: {$question->id})\n";
        }
    }

    echo "\n=== SUMMARY ===\n";
    echo "Total questions with images: " . $questionsWithImages->count() . "\n";
    echo "Orphaned references fixed: {$orphaned}\n";
    echo "Valid references: " . ($questionsWithImages->count() - $orphaned) . "\n";

    if ($orphaned > 0) {
        echo "\n✅ Successfully cleaned up {$orphaned} orphaned image references\n";
    } else {
        echo "\n✅ No orphaned references found\n";
    }

} catch (Exception $e) {
    echo "❌ Error during cleanup: " . $e->getMessage() . "\n";
}

echo "\n=== CLEANUP COMPLETE ===\n";