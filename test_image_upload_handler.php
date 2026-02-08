<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Services\ImageUploadHandler;

echo "\n╔════════════════════════════════════════════════════════════╗\n";
echo "║     TEST IMAGE UPLOAD HANDLER                             ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

$handler = new ImageUploadHandler();

// Test 1: Base64 Image
echo "Test 1: Base64 Image Upload\n";
echo str_repeat("─", 60) . "\n";

$base64_image = 'data:image/png;base64,' . base64_encode(
    base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
);

$result = $handler->handle($base64_image, ['module_id' => 99, 'test' => 'base64']);
if ($result) {
    echo "✅ Success: {$result}\n";
} else {
    echo "❌ Failed\n";
}

// Test 2: Storage Path Reference
echo "\nTest 2: Storage Path Reference\n";
echo str_repeat("─", 60) . "\n";

// Get existing file
$files = Storage::disk('public')->files('questions');
if (count($files) > 0) {
    $test_path = $files[0];
    echo "Testing path: {$test_path}\n";
    
    $result = $handler->handle($test_path, ['module_id' => 99, 'test' => 'path']);
    if ($result) {
        echo "✅ Success: {$result}\n";
    } else {
        echo "❌ Failed\n";
    }
} else {
    echo "⚠️  No files in storage to test\n";
}

// Test 3: Get Image Info
echo "\nTest 3: Image Info Retrieval\n";
echo str_repeat("─", 60) . "\n";

$test_images = DB::table('questions')
    ->whereNotNull('image_url')
    ->where('image_url', '!=', '')
    ->limit(1)
    ->pluck('image_url')
    ->first();

if ($test_images) {
    echo "Image URL: {$test_images}\n";
    $info = $handler->getImageInfo($test_images);
    
    if ($info) {
        echo "✅ Image Info:\n";
        echo "   Exists: " . ($info['exists'] ? 'Yes' : 'No') . "\n";
        echo "   Size: " . $info['size'] . " bytes\n";
        echo "   MIME: " . ($info['mime'] ?? 'unknown') . "\n";
    } else {
        echo "❌ Failed to retrieve info (file missing)\n";
    }
} else {
    echo "⚠️  No images in database to test\n";
}

// Test 4: Validate Existing References
echo "\nTest 4: Validate All DB References\n";
echo str_repeat("─", 60) . "\n";

$all_refs = DB::table('questions')
    ->whereNotNull('image_url')
    ->where('image_url', '!=', '')
    ->count();

$valid = 0;
$invalid = 0;

DB::table('questions')
    ->whereNotNull('image_url')
    ->where('image_url', '!=', '')
    ->each(function($q) use ($handler, &$valid, &$invalid) {
        $info = $handler->getImageInfo($q->image_url);
        if ($info && $info['exists']) {
            $valid++;
        } else {
            $invalid++;
            echo "❌ ID {$q->id}: " . basename($q->image_url) . " (missing)\n";
        }
    });

echo "Total: {$all_refs}\n";
echo "✅ Valid: {$valid}\n";
echo "❌ Invalid: {$invalid}\n";

echo "\n";
