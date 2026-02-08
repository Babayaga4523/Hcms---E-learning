<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Question;
use Illuminate\Support\Facades\Storage;

$missingFile = 'quiz_15_1770190786_6982f7c260f97.png';

// Find questions with this image reference
$questions = Question::where('image_url', 'like', '%' . $missingFile . '%')->get();

if ($questions->isEmpty()) {
    echo "No questions found with image: $missingFile\n";
} else {
    foreach ($questions as $q) {
        echo "=== FOUND BROKEN REFERENCE ===\n";
        echo "Question ID: {$q->id}\n";
        echo "Module ID: {$q->module_id}\n";
        echo "Quiz ID: {$q->quiz_id}\n";
        echo "Question Text: {$q->question_text}\n";
        echo "Image URL: {$q->image_url}\n";
        echo "Physical file exists: " . (file_exists('storage/app/public/questions/' . $missingFile) ? 'YES' : 'NO') . "\n";
    }
}

// Check if storage link exists
echo "\n=== STORAGE LINK STATUS ===\n";
if (is_link('public/storage')) {
    echo "Symlink EXISTS at public/storage\n";
    echo "Points to: " . readlink('public/storage') . "\n";
} else {
    echo "Symlink MISSING - need to run: php artisan storage:link\n";
}

// List all files in storage
echo "\n=== ALL FILES IN STORAGE ===\n";
$disk = Storage::disk('public');
$files = $disk->files('questions');
echo "Total files: " . count($files) . "\n";
foreach ($files as $file) {
    echo "- " . basename($file) . "\n";
}
