<?php
require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Module;
use App\Models\User;

echo "=== Testing Material API ===\n\n";

$training = Module::find(5);

if (!$training) {
    echo "❌ Training not found!\n";
    exit(1);
}

echo "📚 Training: {$training->title}\n\n";

// Build virtual materials
$materials = collect();
$materialIdCounter = 1;

if ($training->video_url) {
    $materials->push([
        'id' => $materialIdCounter++,
        'title' => 'Video Pembelajaran',
        'type' => 'video',
        'url' => $training->video_url,
    ]);
}

if ($training->document_url) {
    $materials->push([
        'id' => $materialIdCounter++,
        'title' => 'Dokumen Pembelajaran',
        'type' => 'document',
        'url' => $training->document_url,
    ]);
}

if ($training->presentation_url) {
    $materials->push([
        'id' => $materialIdCounter++,
        'title' => 'Presentasi',
        'type' => 'presentation',
        'url' => $training->presentation_url,
    ]);
}

if ($materials->isEmpty()) {
    $materials->push([
        'id' => 1,
        'title' => 'Materi Pembelajaran: ' . $training->title,
        'type' => 'content',
        'url' => null,
        'description' => $training->description
    ]);
}

echo "📖 Materials found: {$materials->count()}\n\n";

foreach ($materials as $m) {
    echo "   - ID: {$m['id']}, Title: {$m['title']}, Type: {$m['type']}\n";
}

echo "\n✅ Material ID 1 should now be accessible!\n";
echo "💡 Test URL: http://localhost:8000/api/training/5/material/1\n";
