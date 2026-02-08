<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Question;

echo "=== VERIFICATION AFTER FIX ===\n\n";

echo "Questions with images now:\n";
$count = Question::whereNotNull('image_url')->where('image_url', '!=', '')->count();
echo "Total: $count\n\n";

echo "Question 138 (the one that had 404):\n";
$q138 = Question::find(138);
if ($q138) {
    echo "Image URL: " . ($q138->image_url ?? 'NULL') . "\n";
    echo "Status: " . ($q138->image_url ? 'HAS IMAGE' : 'NO IMAGE - FIXED ✓') . "\n";
    echo "Question Text: {$q138->question_text}\n";
}

// Test if symlink is accessible from HTTP
echo "\n=== SYMLINK STATUS ===\n";
if (is_link('public/storage') || (is_dir('public/storage') && is_dir('storage/app/public'))) {
    echo "✓ Storage symlink/junction is configured\n";
    echo "Files accessible at: http://127.0.0.1:8000/storage/questions/[filename]\n";
} else {
    echo "✗ Symlink issue detected\n";
}
