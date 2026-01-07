<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\ExamAttempt;
use App\Models\Quiz;
use Illuminate\Support\Facades\DB;

echo "=== Checking Quiz Progress for Module 5 ===\n\n";

// Check if Quiz table exists and has data
$hasQuizzesTable = \Illuminate\Support\Facades\Schema::hasTable('quizzes');
echo "Quizzes table exists: " . ($hasQuizzesTable ? 'Yes' : 'No') . "\n";

if ($hasQuizzesTable) {
    $quizzes = Quiz::where('module_id', 5)->get();
    echo "Quizzes for module 5: " . $quizzes->count() . "\n";
    foreach ($quizzes as $q) {
        echo "  - Quiz ID: {$q->id} | Type: {$q->type}\n";
    }
}

echo "\n--- All Exam Attempts ---\n";
$attempts = ExamAttempt::all();
echo "Total attempts: " . $attempts->count() . "\n";

foreach ($attempts as $a) {
    echo "  ID: {$a->id} | Module: {$a->module_id} | User: {$a->user_id} | Type: {$a->exam_type} | Score: {$a->score} | Passed: " . ($a->is_passed ? 'Yes' : 'No') . "\n";
}

// Check all users
echo "\n--- All Users ---\n";
$users = DB::table('users')->get();
foreach ($users as $u) {
    echo "  ID: {$u->id} | Name: {$u->name} | Email: {$u->email} | Role: {$u->role}\n";
}

echo "\n=== Done ===\n";
