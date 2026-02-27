<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$user = \App\Models\User::where('email', 'budi.santoso@bni.co.id')->first();
if ($user) {
    echo "=== USER INFO ===\n";
    echo "User ID: " . $user->id . "\n";
    echo "Name: " . $user->name . "\n";
    
    // Get user trainings directly from database
    $trainings = \App\Models\UserTraining::where('user_id', $user->id)
        ->with('module')
        ->get();
    
    echo "\nTotal Trainings in user_trainings table: " . count($trainings) . "\n\n";
    
    foreach ($trainings as $t) {
        echo "Training ID: " . $t->id . "\n";
        echo "  Module: " . ($t->module->title ?? 'N/A') . "\n";
        echo "  Status: " . $t->status . "\n";
        echo "  is_certified (RAW VALUE): " . var_export($t->is_certified, true) . " (type: " . gettype($t->is_certified) . ")\n";
        echo "  completed_at: " . $t->completed_at . "\n";
        echo "  created_at: " . $t->created_at . "\n\n";
    }
    
    // Now test the fixed query
    echo "\n=== TESTING FIXED QUERY ===\n";
    $certs = \App\Models\UserTraining::where('user_id', $user->id)
        ->where('is_certified', 1)
        ->count();
    echo "Certificates with where('is_certified', 1): " . $certs . "\n";
    
} else {
    echo "User not found\n";
}
