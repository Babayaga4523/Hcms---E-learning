<?php

use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Quiz Data ===\n\n";

echo "1. Quizzes for Module 5:\n";
$quizzes = DB::table('quizzes')->where('module_id', 5)->get();
foreach ($quizzes as $quiz) {
    echo "   - {$quiz->type}: {$quiz->name} (ID: {$quiz->id})\n";
    echo "     Passing Score: {$quiz->passing_score}%\n";
    echo "     Time Limit: {$quiz->time_limit} minutes\n";
}

echo "\n2. Questions for Module 5:\n";
$questions = DB::table('questions')->where('module_id', 5)->get();
echo "   Total: " . $questions->count() . " questions\n";
foreach ($questions as $q) {
    echo "   - Q{$q->id}: " . substr($q->question_text, 0, 60) . "...\n";
    echo "     Answer: {$q->correct_answer} | Difficulty: {$q->difficulty} | Points: {$q->points}\n";
}

echo "\n3. User Trainings for Module 5:\n";
$enrollments = DB::table('user_trainings')->where('module_id', 5)->get();
echo "   Total enrollments: " . $enrollments->count() . "\n";

echo "\n✅ Data verification complete!\n";
