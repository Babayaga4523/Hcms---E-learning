<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Check question 35
$question = \App\Models\Question::find(35);

if ($question) {
    echo "✓ Question 35 found\n";
    echo "Text: " . $question->question_text . "\n";
    echo "Type: " . $question->question_type . "\n";
    echo "Data:\n";
    echo json_encode($question->toArray(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} else {
    // List all questions
    echo "✗ Question 35 not found\n";
    echo "\nAll questions:\n";
    $allQuestions = \App\Models\Question::select('id', 'question_text', 'question_type')->get();
    foreach ($allQuestions as $q) {
        echo "ID {$q->id}: {$q->question_text} ({$q->question_type})\n";
    }
}
