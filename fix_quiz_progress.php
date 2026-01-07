<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\ExamAttempt;
use Illuminate\Support\Facades\DB;

echo "=== Creating Pre-test Attempt for Budi (Module 5) ===\n\n";

// Get user Budi
$user = DB::table('users')->where('email', 'budi.santoso@bni.co.id')->first();

if (!$user) {
    echo "User Budi not found!\n";
    exit(1);
}

echo "User found: {$user->name} (ID: {$user->id})\n";

// Check if pretest already exists
$existing = ExamAttempt::where('user_id', $user->id)
    ->where('module_id', 5)
    ->where('exam_type', 'pre_test')
    ->first();

if ($existing) {
    echo "Pre-test already exists! Updating...\n";
    $existing->update([
        'score' => 80,
        'percentage' => 80,
        'is_passed' => true,
        'completed_at' => now()
    ]);
    echo "Pre-test updated to passed!\n";
} else {
    echo "Creating new pre-test attempt...\n";
    $attempt = ExamAttempt::create([
        'user_id' => $user->id,
        'module_id' => 5,
        'exam_type' => 'pre_test',
        'score' => 80,
        'percentage' => 80,
        'is_passed' => true,
        'started_at' => now()->subMinutes(15),
        'completed_at' => now(),
    ]);
    echo "Pre-test attempt created! ID: {$attempt->id}\n";
}

// Also update the post-test to passed
$posttest = ExamAttempt::where('user_id', $user->id)
    ->where('module_id', 5)
    ->where('exam_type', 'post_test')
    ->first();

if ($posttest) {
    echo "\nUpdating post-test to passed...\n";
    $posttest->update([
        'score' => 80,
        'percentage' => 80,
        'is_passed' => true,
        'completed_at' => now()
    ]);
    echo "Post-test updated!\n";
}

echo "\n--- Final Exam Attempts for Module 5 ---\n";
$attempts = ExamAttempt::where('module_id', 5)->get();
foreach ($attempts as $a) {
    echo "  ID: {$a->id} | User: {$a->user_id} | Type: {$a->exam_type} | Score: {$a->score} | Passed: " . ($a->is_passed ? 'Yes' : 'No') . "\n";
}

echo "\n=== Done ===\n";
