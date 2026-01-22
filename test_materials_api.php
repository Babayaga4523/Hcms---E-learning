<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Module;
use App\Models\UserTraining;
use App\Models\TrainingMaterial;

// Simulate user auth
$user = User::find(3); // Budi Santoso
Auth::setUser($user);

$trainingId = 71;

echo "=== Testing Materials API ===\n";
echo "User ID: " . $user->id . " (" . $user->name . ")\n";
echo "Training ID: {$trainingId}\n\n";

// Check 1: Does training exist?
$training = Module::find($trainingId);
if (!$training) {
    echo "✗ Training {$trainingId} NOT FOUND\n";
    exit(1);
} else {
    echo "✓ Training found: {$training->title}\n";
    echo "  - is_active: " . ($training->is_active ? 'YES' : 'NO') . "\n";
}

// Check 2: Is user enrolled?
$userTraining = UserTraining::where('user_id', $user->id)
    ->where('module_id', $trainingId)
    ->first();

if (!$userTraining) {
    echo "✗ User NOT enrolled in this training\n";
    exit(1);
} else {
    echo "✓ User enrolled with status: {$userTraining->status}\n";
}

// Check 3: Are there materials?
$materials = TrainingMaterial::where('module_id', $trainingId)->get();
echo "✓ Found {$materials->count()} materials:\n";
foreach ($materials as $mat) {
    echo "  - {$mat->title} ({$mat->file_type})\n";
}

// Check 4: Try calling the controller method
try {
    $controller = new \App\Http\Controllers\User\MaterialController();
    $response = $controller->index($trainingId);
    
    echo "\n✓ Controller response:\n";
    echo json_encode($response->getData(), JSON_PRETTY_PRINT) . "\n";
} catch (\Exception $e) {
    echo "\n✗ Controller error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
