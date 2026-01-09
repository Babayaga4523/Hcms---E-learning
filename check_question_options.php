<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Question;

echo "=== CHECKING QUESTION OPTIONS DATA ===\n\n";

$questions = Question::where('module_id', 5)->select('id', 'question_text', 'options')->take(3)->get();

foreach ($questions as $q) {
    echo "ID: {$q->id}\n";
    echo "Question: " . substr($q->question_text, 0, 50) . "...\n";
    echo "Options Raw: {$q->options}\n";

    if ($q->options) {
        $decoded = json_decode($q->options, true);
        echo "Options Decoded: " . json_encode($decoded, JSON_PRETTY_PRINT) . "\n";
    } else {
        echo "Options: NULL/EMPTY\n";
    }

    echo "------------------------\n";
}

echo "\n=== CHECKING QUESTION MODEL CAST ===\n";
$question = Question::find(41);
if ($question) {
    echo "Question ID 41 options (after cast): ";
    var_dump($question->options);
}