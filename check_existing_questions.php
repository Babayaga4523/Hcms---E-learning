<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    $questions = \App\Models\Question::where('module_id', 5)->take(2)->get();
    echo "Questions for module 5 (existing):\n";
    foreach ($questions as $question) {
        echo "\nQuestion ID: {$question->id}\n";
        echo "Text: {$question->question_text}\n";
        echo "Options: {$question->options}\n";
        echo "Option A: {$question->option_a}\n";
        echo "Option B: {$question->option_b}\n";
        echo "---\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}