<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    $questions = \App\Models\Question::where('module_id', 44)->get();
    echo "Questions for module kskksksks:\n";
    foreach ($questions as $question) {
        echo "\nQuestion ID: {$question->id}\n";
        echo "Text: {$question->question_text}\n";
        echo "Type: {$question->question_type}\n";
        echo "Options: {$question->options}\n";
        echo "Correct Answer: {$question->correct_answer}\n";
        echo "Quiz ID: {$question->quiz_id}\n";
        echo "---\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}