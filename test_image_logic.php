<?php

require_once 'vendor/autoload.php';

use App\Models\Question;
use Illuminate\Support\Facades\Storage;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Testing image URL handling:\n";

$question = Question::whereNotNull('image_url')->where('image_url', '!=', '')->first();

if ($question) {
    echo "Question ID: {$question->id}\n";
    echo "Stored URL: {$question->image_url}\n";

    $filePath = str_replace('/storage/', '', $question->image_url);
    echo "File path for checking: {$filePath}\n";
    echo "File exists: " . (Storage::disk('public')->exists($filePath) ? 'YES' : 'NO') . "\n";

    // Simulate what PreTestPostTestController does
    $imageUrl = null;
    if ($question->image_url && Storage::disk('public')->exists(str_replace('/storage/', '', $question->image_url))) {
        $imageUrl = $question->image_url;
    }
    echo "API would return image_url: " . ($imageUrl ?: 'null') . "\n";
} else {
    echo "No questions with images found.\n";
}