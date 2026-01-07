<?php

require_once 'vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;

// Setup database
$capsule = new Capsule;
$capsule->addConnection([
    'driver' => 'sqlite',
    'database' => __DIR__ . '/database/database.sqlite',
]);
$capsule->setAsGlobal();
$capsule->bootEloquent();

echo "=== CERTIFICATE DATA VERIFICATION ===\n\n";

// Get certificate
$certificate = Capsule::table('certificates')
    ->where('user_id', 3)
    ->where('module_id', 5)
    ->first();

if ($certificate) {
    echo "✅ CERTIFICATE FOUND IN DATABASE:\n";
    echo "================================\n";
    echo "ID: {$certificate->id}\n";
    echo "Certificate Number: {$certificate->certificate_number}\n";
    echo "User Name: {$certificate->user_name}\n";
    echo "Training Title: {$certificate->training_title}\n";
    echo "Score: {$certificate->score}\n";
    echo "Materials Completed: {$certificate->materials_completed}\n";
    echo "Hours: {$certificate->hours}\n";
    echo "Instructor: {$certificate->instructor_name}\n";
    echo "Issued At: {$certificate->issued_at}\n";
    echo "Status: {$certificate->status}\n";
} else {
    echo "❌ No certificate found for Budi (user_id: 3, module_id: 5)\n";
}

// Get training info
echo "\n\n=== TRAINING DATA ===\n";
$module = Capsule::table('modules')->where('id', 5)->first();
if ($module) {
    echo "ID: {$module->id}\n";
    echo "Title: {$module->title}\n";
}

// Get enrollment status
echo "\n\n=== ENROLLMENT STATUS ===\n";
$enrollment = Capsule::table('user_trainings')
    ->where('user_id', 3)
    ->where('module_id', 5)
    ->first();

if ($enrollment) {
    echo "Status: {$enrollment->status}\n";
    echo "Certificate ID: " . ($enrollment->certificate_id ?? 'null') . "\n";
    echo "Completed At: " . ($enrollment->completed_at ?? 'null') . "\n";
}

// Get exam attempts for scoring reference
echo "\n\n=== EXAM ATTEMPTS (Score Source) ===\n";
$attempts = Capsule::table('exam_attempts')
    ->where('user_id', 3)
    ->where('module_id', 5)
    ->get();

foreach ($attempts as $a) {
    echo "Type: {$a->exam_type}, Score: {$a->score}\n";
}

echo "\n✅ All data is from real database!\n";
