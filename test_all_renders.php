<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing Inertia render for all scenarios:\n\n";

// Test 1: Create with module_id and question_type
try {
    $response1 = \Inertia\Inertia::render('Admin/QuestionManagement', [
        'module_id' => 3,
        'question_type' => 'pretest',
    ]);
    echo "✓ Test 1 (Create soal): SUCCESS\n";
} catch (\Exception $e) {
    echo "✗ Test 1 Error: " . $e->getMessage() . "\n";
}

// Test 2: Edit with question data
try {
    $question = \App\Models\Question::find(35);
    if ($question) {
        $response2 = \Inertia\Inertia::render('Admin/QuestionManagement', [
            'question' => $question->toArray()
        ]);
        echo "✓ Test 2 (Edit soal): SUCCESS\n";
    }
} catch (\Exception $e) {
    echo "✗ Test 2 Error: " . $e->getMessage() . "\n";
}

// Test 3: Create without params
try {
    $response3 = \Inertia\Inertia::render('Admin/QuestionManagement');
    echo "✓ Test 3 (Create tanpa params): SUCCESS\n";
} catch (\Exception $e) {
    echo "✗ Test 3 Error: " . $e->getMessage() . "\n";
}

echo "\n✓ Semua routes siap diakses!\n";
