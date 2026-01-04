<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Get first pretest question
$question = \App\Models\Question::where('question_type', 'pretest')->first();

if ($question) {
    echo "Found question ID: " . $question->id . "\n";
    echo "URL to test: /admin/question-management/" . $question->id . "\n";
    echo "\nQuestion data:\n";
    echo json_encode($question->toArray(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} else {
    echo "No pretest question found\n";
}
