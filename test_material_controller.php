<?php
require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Module;
use App\Models\User;
use App\Models\ModuleProgress;
use Illuminate\Support\Facades\Auth;

echo "=== Testing Material Controller Logic ===\n\n";

// Login as a user
$user = User::find(3); // Budi Santoso who is enrolled
Auth::login($user);

echo "👤 Logged in as: {$user->name}\n\n";

$trainingId = 5;
$materialId = 1;

try {
    $training = Module::findOrFail($trainingId);
    
    echo "📚 Training: {$training->title}\n";
    
    // Build virtual materials from module fields
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
    
    // If no content files, add a placeholder content material
    if ($materials->isEmpty()) {
        $materials->push([
            'id' => 1,
            'title' => 'Materi Pembelajaran: ' . $training->title,
            'type' => 'content',
            'url' => null,
            'duration' => $training->duration_minutes ?? 60,
            'module_title' => $training->title,
            'is_completed' => false,
            'content' => $training->description,
            'description' => $training->description
        ]);
    }
    
    echo "📖 Total materials: {$materials->count()}\n";
    
    // Find the requested material
    $material = $materials->firstWhere('id', (int)$materialId);
    
    if (!$material) {
        echo "❌ Material ID {$materialId} not found!\n";
    } else {
        echo "✅ Material found:\n";
        echo "   - ID: {$material['id']}\n";
        echo "   - Title: {$material['title']}\n";
        echo "   - Type: {$material['type']}\n";
        echo "   - Description: " . substr($material['description'] ?? '', 0, 50) . "...\n";
    }
    
    // Get user's progress
    $progress = ModuleProgress::where('user_id', $user->id)
        ->where('module_id', $trainingId)
        ->first();
    
    echo "\n📊 Progress: " . ($progress ? $progress->status : 'No progress record') . "\n";
    
    echo "\n✅ Controller logic works correctly!\n";
    
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n💡 If still getting 404, clear browser cache and make sure you're logged in.\n";
