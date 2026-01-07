<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\TrainingMaterial;
use App\Models\UserBookmark;
use App\Models\User;
use App\Models\Module;

// Get test user (role=user) and modules
$user = User::where('role', 'user')->first();
$modules = Module::all();

if (!$user) {
    echo "No user found!\n";
    exit(1);
}

echo "User: {$user->name} (ID: {$user->id})\n";
echo "Modules: " . $modules->count() . "\n";

// Create sample materials if not exist
if (TrainingMaterial::count() == 0) {
    echo "Creating sample training materials...\n";
    
    $module1 = $modules->first();
    $module2 = $modules->skip(1)->first() ?? $module1;
    
    $materials = [
        [
            'module_id' => $module1->id,
            'title' => 'Pengenalan Manajemen Risiko',
            'description' => 'Dokumen pengenalan tentang manajemen risiko operasional di perusahaan',
            'file_type' => 'pdf',
            'file_path' => '/materials/risiko-intro.pdf',
            'file_name' => 'risiko-intro.pdf',
            'file_size' => 1024000,
            'duration_minutes' => 15,
            'order' => 1,
            'uploaded_by' => $user->id,
        ],
        [
            'module_id' => $module1->id,
            'title' => 'Video: Identifikasi Risiko',
            'description' => 'Video tutorial cara mengidentifikasi risiko dalam proses operasional',
            'file_type' => 'video',
            'file_path' => '/materials/identifikasi-risiko.mp4',
            'file_name' => 'identifikasi-risiko.mp4',
            'file_size' => 50000000,
            'duration_minutes' => 20,
            'order' => 2,
            'uploaded_by' => $user->id,
        ],
        [
            'module_id' => $module2->id,
            'title' => 'Panduan Customer Service',
            'description' => 'Panduan lengkap tentang customer service excellence',
            'file_type' => 'pdf',
            'file_path' => '/materials/cs-guide.pdf',
            'file_name' => 'cs-guide.pdf',
            'file_size' => 2048000,
            'duration_minutes' => 30,
            'order' => 1,
            'uploaded_by' => $user->id,
        ],
        [
            'module_id' => $module2->id,
            'title' => 'Video: Handling Complaints',
            'description' => 'Video tutorial menangani keluhan pelanggan dengan baik',
            'file_type' => 'video',
            'file_path' => '/materials/handling-complaints.mp4',
            'file_name' => 'handling-complaints.mp4',
            'file_size' => 75000000,
            'duration_minutes' => 25,
            'order' => 2,
            'uploaded_by' => $user->id,
        ],
    ];
    
    foreach ($materials as $mat) {
        TrainingMaterial::create($mat);
        echo "  Created: {$mat['title']}\n";
    }
}

// Create sample bookmarks
$materials = TrainingMaterial::all();
echo "\nCreating sample bookmarks...\n";

// Clear existing bookmarks for this user
UserBookmark::where('user_id', $user->id)->delete();

foreach ($materials->take(3) as $material) {
    $bookmark = UserBookmark::create([
        'user_id' => $user->id,
        'material_id' => $material->id,
        'module_id' => $material->module_id,
        'bookmarked_at' => now()->subDays(rand(1, 7)),
    ]);
    echo "  Bookmarked: {$material->title}\n";
}

echo "\nDone! Total bookmarks: " . UserBookmark::where('user_id', $user->id)->count() . "\n";
