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

    // Display options properly
    if ($question->options) {
        $opts = is_string($question->options) ? json_decode($question->options, true) : $question->options;
        if ($opts instanceof \Illuminate\Support\Collection) {
            $opts = $opts->toArray();
        }

        echo "Options:\n";
        foreach ($opts as $opt) {
            echo "  " . strtoupper($opt['label']) . ": " . $opt['text'] . "\n";
        }
    } else {
        echo "Options: (empty)\n";
    }

    echo "Correct: " . $question->correct_answer . "\n";
} else {
    echo "✗ Soal tidak ditemukan\n";
}
