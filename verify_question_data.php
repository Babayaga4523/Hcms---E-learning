<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Just test if we can load and serialize a question
$question = \App\Models\Question::find(31);

if ($question) {
    echo "✓ Question loaded\n";
    echo "✓ ID: " . $question->id . "\n";
    echo "✓ Text: " . substr($question->question_text, 0, 50) . "...\n";
    echo "✓ Can serialize: ";
    
    $array = $question->toArray();
    if (is_array($array) && isset($array['id'])) {
        echo "YES\n";
        echo "✓ All fields present: ";
        $requiredFields = ['id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'difficulty', 'explanation', 'question_type', 'module_id'];
        $allPresent = true;
        foreach ($requiredFields as $field) {
            if (!isset($array[$field])) {
                echo "MISSING: $field";
                $allPresent = false;
            }
        }
        if ($allPresent) {
            echo "YES\n";
            echo "\n✓ Ready to pass to React component\n";
        }
    }
} else {
    echo "✗ Question not found\n";
}
