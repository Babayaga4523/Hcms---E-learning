<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$question = \App\Models\Question::where('question_type', 'pretest')->first();

if ($question) {
    echo "✓ Soal ditemukan\n";
    echo "ID: " . $question->id . "\n";
    echo "Text: " . $question->question_text . "\n";
    echo "Type: " . $question->question_type . "\n";
    echo "Option A: " . $question->option_a . "\n";
    echo "Correct: " . $question->correct_answer . "\n";
} else {
    echo "✗ Soal tidak ditemukan\n";
}
