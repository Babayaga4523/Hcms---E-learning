<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

echo "\n╔════════════════════════════════════════════════════════════╗\n";
echo "║        IMAGE UPLOAD FIX - VERIFY & REPAIR                 ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

// 1. Verify Storage Structure
echo "1️⃣  STORAGE STRUCTURE CHECK:\n";
echo str_repeat("─", 60) . "\n";

$storage_disk = Storage::disk('public');
$questions_path = 'questions';

// Create questions directory if not exists
if (!$storage_disk->exists($questions_path)) {
    $storage_disk->makeDirectory($questions_path);
    echo "✅ Created questions directory\n";
} else {
    echo "✅ Questions directory exists\n";
}

// Get file list
$files = $storage_disk->files($questions_path);
echo "Total files in questions folder: " . count($files) . "\n\n";

// 2. Analyze Database Image References
echo "2️⃣  DATABASE IMAGE ANALYSIS:\n";
echo str_repeat("─", 60) . "\n";

$all_questions = DB::table('questions')->count();
$with_images = DB::table('questions')
    ->whereNotNull('image_url')
    ->where('image_url', '!=', '')
    ->count();

echo "Total questions: {$all_questions}\n";
echo "With image references: {$with_images}\n\n";

// 3. Verify Each Reference
echo "3️⃣  VERIFICATION RESULTS:\n";
echo str_repeat("─", 60) . "\n";

$problems = [];
$ok_count = 0;
$missing_count = 0;
$wrong_format_count = 0;

$db_refs = DB::table('questions')
    ->whereNotNull('image_url')
    ->where('image_url', '!=', '')
    ->get(['id', 'module_id', 'image_url']);

foreach ($db_refs as $ref) {
    // Extract filename from various possible URL formats
    $filename = basename($ref->image_url);
    $check_path = 'questions/' . $filename;
    
    // Check if file exists
    if (!$storage_disk->exists($check_path)) {
        $missing_count++;
        $problems[] = [
            'id' => $ref->id,
            'module' => $ref->module_id,
            'url' => $ref->image_url,
            'filename' => $filename,
            'issue' => 'FILE_MISSING'
        ];
    } else {
        $ok_count++;
        $size = $storage_disk->size($check_path);
        echo "✅ ID {$ref->id}: {$filename} ({$size} bytes)\n";
    }
}

echo "\n4️⃣  PROBLEM SUMMARY:\n";
echo str_repeat("─", 60) . "\n";
echo "✅ Valid references: {$ok_count}\n";
echo "❌ Missing files: {$missing_count}\n";

if ($missing_count > 0) {
    echo "\n⚠️  PROBLEMS DETECTED:\n";
    foreach ($problems as $p) {
        echo "  • ID {$p['id']} (Module {$p['module']})\n";
        echo "    File: {$p['filename']}\n";
        echo "    URL: {$p['url']}\n";
    }
}

// 5. Test Upload Path Structure
echo "\n5️⃣  UPLOAD PATH STRUCTURE:\n";
echo str_repeat("─", 60) . "\n";

$base_path = storage_path('app/public/questions');
echo "Base Path: {$base_path}\n";
echo "Is Directory: " . (is_dir($base_path) ? "Yes ✅" : "No ❌") . "\n";
echo "Is Writable: " . (is_writable($base_path) ? "Yes ✅" : "No ❌") . "\n";
echo "Is Readable: " . (is_readable($base_path) ? "Yes ✅" : "No ❌") . "\n";

// Check symlink
$symlink_path = public_path('storage');
echo "\nSymlink Check:\n";
if (is_link($symlink_path)) {
    $target = readlink($symlink_path);
    echo "✅ Symlink exists: public/storage → {$target}\n";
} else {
    echo "❌ Symlink missing or broken\n";
}

// 6. URL Generation Test
echo "\n6️⃣  URL GENERATION TEST:\n";
echo str_repeat("─", 60) . "\n";

if (count($files) > 0) {
    $test_file = $files[0];
    $test_url = $storage_disk->url($test_file);
    echo "Sample file: {$test_file}\n";
    echo "Generated URL: {$test_url}\n";
} else {
    echo "⚠️  No files in storage to test\n";
}

// 7. Recommendations
echo "\n7️⃣  RECOMMENDATIONS:\n";
echo str_repeat("─", 60) . "\n";

if ($missing_count > 0) {
    echo "ACTION REQUIRED:\n";
    echo "1. Run: php fix_image_references.php\n";
    echo "   (To remove broken database references)\n\n";
}

echo "BEST PRACTICES FOR IMAGE UPLOAD:\n";
echo "1. Upload via form using file input (not URL string)\n";
echo "2. Validate file before saving to database\n";
echo "3. Store path relative to storage/app/public/\n";
echo "4. Always verify file exists before saving URL to DB\n";
echo "5. Log all upload attempts for debugging\n\n";

// 8. Create Sample Test
echo "8️⃣  SAMPLE TEST FILE CREATION:\n";
echo str_repeat("─", 60) . "\n";

try {
    // Create a simple test image (1x1 pixel transparent PNG)
    $png_data = base64_decode(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    );
    
    $test_filename = 'test_' . time() . '.png';
    $test_path = 'questions/' . $test_filename;
    
    if ($storage_disk->put($test_path, $png_data)) {
        $test_url = $storage_disk->url($test_path);
        echo "✅ Created test image: {$test_filename}\n";
        echo "   URL: {$test_url}\n";
        echo "\n   To add to database:\n";
        echo "   INSERT INTO questions (image_url, ...) VALUES ('{$test_url}', ...);\n";
    }
} catch (\Exception $e) {
    echo "❌ Failed to create test image: " . $e->getMessage() . "\n";
}

echo "\n";
