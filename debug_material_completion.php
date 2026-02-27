<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Bootstrap Laravel
require __DIR__.'/bootstrap/app.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Now we can use Laravel
use App\Models\User;
use App\Models\TrainingMaterial;
use App\Models\UserMaterialProgress;
use App\Models\Module;
use App\Models\ModuleProgress;

echo "========== MATERIAL COMPLETION DEBUG ==========\n\n";

// Get test user (assuming user_id = 1 or first available)
$user = User::first();
if (!$user) {
    echo "Error: No users found in database\n";
    exit(1);
}

echo "TEST USER: ID={$user->id}, Name={$user->name}\n";
echo str_repeat("-", 50) . "\n\n";

// 1. Check UserMaterialProgress records
echo "1. USER MATERIAL PROGRESS RECORDS:\n";
$userProgress = UserMaterialProgress::where('user_id', $user->id)
    ->orderBy('training_material_id')
    ->get();

if ($userProgress->isEmpty()) {
    echo "  ⚠️  No records found for this user\n";
} else {
    foreach ($userProgress as $progress) {
        echo "  - Training Material ID: {$progress->training_material_id}, ";
        echo "Completed: " . ($progress->is_completed ? "YES" : "NO") . ", ";
        echo "At: {$progress->completed_at}\n";
    }
}
echo "\n";

// 2. Check if those Training Materials exist
echo "2. VERIFY TRAINING MATERIALS EXIST:\n";
if ($userProgress->isNotEmpty()) {
    $materialIds = $userProgress->pluck('training_material_id')->unique();
    foreach ($materialIds as $id) {
        $material = TrainingMaterial::find($id);
        if ($material) {
            echo "  ✓ Material ID {$id}: {$material->title} (Module: {$material->module_id})\n";
        } else {
            echo "  ✗ Material ID {$id}: NOT FOUND (ForeignKey error!)\n";
        }
    }
} else {
    echo "  (No materials to check)\n";
}
echo "\n";

// 3. Check ModuleProgress
echo "3. MODULE PROGRESS:\n";
$moduleProgresses = ModuleProgress::where('user_id', $user->id)->get();

if ($moduleProgresses->isEmpty()) {
    echo "  ⚠️  No module progress records\n";
} else {
    foreach ($moduleProgresses as $progress) {
        $module = Module::find($progress->module_id);
        echo "  - Module: {$module->title} ({$progress->module_id})\n";
        echo "    Status: {$progress->status}, Progress: {$progress->progress_percentage}%\n";
    }
}
echo "\n";

// 4. Test: Manually mark a material as complete and check response
echo "4. TESTING MATERIAL COMPLETION:\n";

// Get first available training material
$testMaterial = TrainingMaterial::first();
if (!$testMaterial) {
    echo "  No TrainingMaterial found to test\n";
    exit(0);
}

echo "  Test Material: {$testMaterial->title} (ID: {$testMaterial->id}, Module: {$testMaterial->module_id})\n";

// Check if user is enrolled in the module
$isEnrolled = \App\Models\UserTraining::where('user_id', $user->id)
    ->where('module_id', $testMaterial->module_id)
    ->exists();

if (!$isEnrolled) {
    echo "  ⚠️  User not enrolled in this module. Skipping test.\n";
    exit(0);
}

// Manually create progress record like complete() does
$userMaterialProgressBefore = UserMaterialProgress::where('user_id', $user->id)
    ->where('training_material_id', $testMaterial->id)
    ->first();

echo "  Before: " . ($userMaterialProgressBefore ? "Already completed" : "Not completed") . "\n";

// Simulate complete() logic
$trainingMaterial = TrainingMaterial::find($testMaterial->id);
if ($trainingMaterial && $trainingMaterial->module_id == $testMaterial->module_id) {
    UserMaterialProgress::updateOrCreate(
        [
            'user_id' => $user->id,
            'training_material_id' => $testMaterial->id,
        ],
        [
            'is_completed' => true,
            'completed_at' => now(),
            'last_accessed_at' => now()
        ]
    );
    echo "  ✓ Inserted/Updated completion record\n";
}

// Check if it was saved
$userMaterialProgressAfter = UserMaterialProgress::where('user_id', $user->id)
    ->where('training_material_id', $testMaterial->id)
    ->first();

echo "  After: " . ($userMaterialProgressAfter ? "✓ Successfully saved" : "✗ Failed to save") . "\n";
if ($userMaterialProgressAfter) {
    echo "    Completed: {$userMaterialProgressAfter->is_completed}\n";
}
echo "\n";

// 5. Test show() method completion detection
echo "5. TESTING SHOW() COMPLETION DETECTION:\n";

$completedIds = UserMaterialProgress::where('user_id', $user->id)
    ->where('is_completed', true)
    ->whereHas('material', function($q) use ($testMaterial) {
        $q->where('module_id', $testMaterial->module_id);
    })
    ->pluck('training_material_id')
    ->toArray();

echo "  Completed Material IDs: " . implode(", ", $completedIds) . "\n";

if (in_array($testMaterial->id, $completedIds)) {
    echo "  ✓ Material would be detected as completed\n";
} else {
    echo "  ✗ Material would NOT be detected as completed\n";
}

echo "\n========== END DEBUG ==========\n";
