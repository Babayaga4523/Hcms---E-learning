<?php
require __DIR__ . '/bootstrap/app.php';
$app->boot();

use App\Models\User;
use App\Models\Certificate;
use App\Models\UserTraining;

$user = User::first();
if (!$user) { echo "No users found\n"; die; }

echo "=== USER INFO ===\n";
echo "User ID: " . $user->id . "\n";
echo "User Name: " . $user->name . "\n";

// Check certificates count
$certs = Certificate::where('user_id', $user->id)->get();
echo "\n=== CERTIFICATES ===\n";
echo "Total Certificates: " . count($certs) . "\n";
foreach ($certs as $cert) {
    echo "  - ID: {$cert->id}, Module: {$cert->module_id}, Title: {$cert->training_title}, Created: {$cert->created_at}\n";
}

// Check user_trainings with is_certified flag
echo "\n=== USER TRAININGS ===\n";
$trainings = UserTraining::where('user_id', $user->id)->get();
echo "Total Trainings: " . count($trainings) . "\n";
foreach ($trainings as $training) {
    echo "  - Module: {$training->module_id}, Status: {$training->status}, is_certified: {$training->is_certified}, final_score: {$training->final_score}\n";
}

echo "\n";
