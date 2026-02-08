<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

echo "\n╔════════════════════════════════════════════════════════════╗\n";
echo "║     FIX: REMOVE BROKEN IMAGE REFERENCES FROM DB           ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

// Find questions dengan image_url yang file-nya tidak ada
$broken_refs = DB::table('questions')
    ->whereNotNull('image_url')
    ->where('image_url', '!=', '')
    ->get(['id', 'module_id', 'image_url']);

echo "1️⃣  SCANNING DATABASE:\n";
echo str_repeat("─", 60) . "\n";
echo "Total questions with image_url: " . count($broken_refs) . "\n\n";

$disk = Storage::disk('public');
$missing = [];
$ok = [];

foreach ($broken_refs as $ref) {
    $filename = basename($ref->image_url);
    $path = 'questions/' . $filename;
    
    if ($disk->exists($path)) {
        $ok[] = $ref;
    } else {
        $missing[] = $ref;
    }
}

echo "2️⃣  RESULTS:\n";
echo str_repeat("─", 60) . "\n";
echo "✅ Valid references: " . count($ok) . "\n";
echo "❌ Broken references: " . count($missing) . "\n\n";

if (count($missing) > 0) {
    echo "3️⃣  BROKEN REFERENCES:\n";
    echo str_repeat("─", 60) . "\n";
    
    foreach ($missing as $m) {
        echo "ID {$m->id} (Module {$m->module_id}): " . basename($m->image_url) . "\n";
    }
    
    echo "\n4️⃣  FIX OPTIONS:\n";
    echo str_repeat("─", 60) . "\n";
    echo "Option 1: Remove broken references from database\n";
    echo "Option 2: Upload actual image files\n";
    echo "Option 3: Create test images for all questions\n\n";
    
    echo "⚠️  IMPORTANT CHOICE:\n";
    echo "────────────────────────────────────────────────────────────\n";
    echo "What would you like to do?\n\n";
    echo "1) Remove all broken image references (data will be cleared)\n";
    echo "   → Soal akan tampil tanpa gambar, tidak ada 404 error\n\n";
    echo "2) Create dummy test images for all missing references\n";
    echo "   → Soal akan tampil dengan gambar test, debugging lebih mudah\n\n";
    echo "3) Skip - Keep database as is (WILL CAUSE 404 ERRORS)\n\n";
    
    echo "Enter choice (1/2/3): ";
    
    // Read from STDIN (untuk interactive mode)
    // Jika tidak ada input, default option 2 (create test images)
    $handle = fopen("php://stdin", "r");
    $choice = trim(fgets($handle));
    fclose($handle);
    
    if (empty($choice)) {
        $choice = '2';
        echo "2\n";
        echo "Using default: Create test images\n\n";
    }
    
    if ($choice === '1') {
        // Option 1: Remove broken references
        echo "\n5️⃣  REMOVING BROKEN REFERENCES:\n";
        echo str_repeat("─", 60) . "\n";
        
        $removed = 0;
        foreach ($missing as $m) {
            DB::table('questions')
                ->where('id', $m->id)
                ->update(['image_url' => null]);
            echo "✅ ID {$m->id}: Cleared image_url\n";
            $removed++;
        }
        
        echo "\n✅ DONE! Removed {$removed} broken references\n";
        echo "\nResult: Soal akan tampil tanpa gambar (no 404 errors)\n";
        
    } elseif ($choice === '2') {
        // Option 2: Create test images
        echo "\n5️⃣  CREATING TEST IMAGES:\n";
        echo str_repeat("─", 60) . "\n";
        
        // Create a simple test image (1x1 pixel)
        $png_data = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        );
        
        $created = 0;
        foreach ($missing as $m) {
            $filename = basename($m->image_url);
            $path = 'questions/' . $filename;
            
            if ($disk->put($path, $png_data)) {
                echo "✅ Created: {$filename}\n";
                $created++;
            } else {
                echo "❌ Failed: {$filename}\n";
            }
        }
        
        echo "\n✅ DONE! Created {$created} test images\n";
        echo "\nNext: Upload actual images to replace test images\n";
        echo "For now, images will display with test placeholder\n";
        
    } else {
        echo "\n❌ Cancelled. Database unchanged.\n";
        echo "⚠️  WARNING: 404 errors will occur when accessing missing images\n";
    }
} else {
    echo "✅ All image references are valid!\n";
    echo "No missing files detected.\n";
}

echo "\n";
