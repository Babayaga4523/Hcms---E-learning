<?php

use Illuminate\Support\Facades\DB;
use App\Models\Module;
use App\Models\Quiz;
use App\Models\Question;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Final Quiz Verification ===\n\n";

$moduleId = 5;
$types = ['pretest', 'posttest'];

foreach ($types as $type) {
    echo "Testing {$type}:\n";
    
    // Check quiz exists
    $quiz = Quiz::where(function($query) use ($moduleId) {
        $query->where('module_id', $moduleId)
              ->orWhere('training_program_id', $moduleId);
    })
    ->where('type', $type)
    ->where('is_active', true)
    ->first();
    
    if (!$quiz) {
        echo "  ❌ Quiz not found\n\n";
        continue;
    }
    
    echo "  ✓ Quiz found: {$quiz->name}\n";
    echo "    - ID: {$quiz->id}\n";
    echo "    - Time limit: {$quiz->time_limit} minutes\n";
    echo "    - Passing score: {$quiz->passing_score}%\n";
    echo "    - Active: " . ($quiz->is_active ? 'Yes' : 'No') . "\n";
    
    // Check questions
    $questions = Question::where('module_id', $moduleId)
        ->limit($quiz->question_count ?? 5)
        ->get();
    
    echo "    - Questions available: {$questions->count()}\n";
    
    if ($questions->count() > 0) {
        echo "    ✓ Sample questions:\n";
        foreach ($questions->take(2) as $q) {
            echo "      • " . substr($q->question_text, 0, 50) . "...\n";
        }
    } else {
        echo "    ❌ No questions found!\n";
    }
    
    echo "\n";
}

echo "=== Test Quiz Load URL ===\n";
echo "Visit: http://127.0.0.1:8000/training/5/quiz/pretest\n";
echo "Visit: http://127.0.0.1:8000/training/5/quiz/posttest\n";

echo "\n✅ Verification complete!\n";
