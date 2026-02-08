<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

echo "\n╔════════════════════════════════════════════════════════════╗\n";
echo "║     AUDIT: IMAGE UPLOAD PROCESS & DATABASE                ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

// 1. Check Storage Files
echo "1️⃣  FILE STORAGE CHECK:\n";
echo str_repeat("─", 60) . "\n";

$storage_path = storage_path('app/public/questions');
$files = array_diff(scandir($storage_path), ['.', '..']);
$file_count = count($files);

echo "Total files in storage: {$file_count}\n";
echo "Path: {$storage_path}\n\n";

// 2. Check Database References
echo "2️⃣  DATABASE IMAGE REFERENCES:\n";
echo str_repeat("─", 60) . "\n";

$all_questions = DB::table('questions')->count();
$with_images = DB::table('questions')
    ->whereNotNull('image_url')
    ->where('image_url', '!=', '')
    ->count();

echo "Total questions: {$all_questions}\n";
echo "Questions with image_url: {$with_images}\n\n";

// 3. Verify Each Image Reference
echo "3️⃣  VERIFICATION - DATABASE vs STORAGE:\n";
echo str_repeat("─", 60) . "\n";

$db_questions = DB::table('questions')
    ->whereNotNull('image_url')
    ->where('image_url', '!=', '')
    ->get(['id', 'module_id', 'image_url']);

$disk = Storage::disk('public');
$ok_count = 0;
$missing_count = 0;
$wrong_path_count = 0;

foreach ($db_questions as $q) {
    $filename = basename($q->image_url);
    $check_path = "questions/{$filename}";
    
    $exists = $disk->exists($check_path);
    
    if ($exists) {
        $ok_count++;
    } else {
        $missing_count++;
        echo "❌ ID {$q->id} (Module {$q->module_id}): Missing file\n";
        echo "   Expected: {$filename}\n";
        echo "   URL: {$q->image_url}\n\n";
    }
}

echo "\n4️⃣  SUMMARY:\n";
echo str_repeat("─", 60) . "\n";
echo "✅ Valid references: {$ok_count}\n";
echo "❌ Missing files: {$missing_count}\n";
echo "⚠️  Wrong path format: {$wrong_path_count}\n\n";

if ($missing_count > 0) {
    echo "ACTION REQUIRED:\n";
    echo "Run: php cleanup_image_errors.php\n";
}

// 5. Sample Valid Images
echo "\n5️⃣  SAMPLE VALID IMAGE REFERENCES:\n";
echo str_repeat("─", 60) . "\n";

$samples = DB::table('questions')
    ->whereNotNull('image_url')
    ->where('image_url', '!=', '')
    ->limit(3)
    ->get(['id', 'image_url']);

foreach ($samples as $s) {
    echo "ID {$s->id}: " . basename($s->image_url) . "\n";
}

echo "\n";
