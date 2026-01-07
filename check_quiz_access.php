<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Quiz;
use App\Models\Module;
use App\Models\Question;
use App\Models\ModuleAssignment;
use App\Models\UserTraining;

$moduleId = 5;
$userId = 3; // Test user

echo "=== Quiz Access Check for Module $moduleId, User $userId ===\n\n";

// Check module exists
$module = Module::find($moduleId);
if (!$module) {
    echo "Module not found!\n";
    exit;
}
echo "Module: {$module->title}\n\n";

// Check user assignment
$assignment = ModuleAssignment::where('module_id', $moduleId)->where('user_id', $userId)->first();
echo "User Assignment: " . ($assignment ? "YES (ID: {$assignment->id})" : "NO") . "\n";

// Check user training
$userTraining = UserTraining::where('module_id', $moduleId)->where('user_id', $userId)->first();
echo "User Training: " . ($userTraining ? "YES (Status: {$userTraining->status})" : "NO") . "\n\n";

// Check quizzes
$quizzes = Quiz::where('module_id', $moduleId)->get();
echo "Quizzes found: " . count($quizzes) . "\n";

foreach ($quizzes as $quiz) {
    echo "- Quiz ID: {$quiz->id}\n";
    echo "  Type: {$quiz->type}\n";
    echo "  Title: {$quiz->title}\n";
    echo "  is_active: " . ($quiz->is_active ? 'YES' : 'NO') . "\n";
    echo "  question_count: {$quiz->question_count}\n\n";
}

// Check questions
$questions = Question::where('module_id', $moduleId)->get();
echo "Total Questions for module: " . count($questions) . "\n";

// Check by question_type
$pretestQ = $questions->filter(fn($q) => $q->question_type === 'pretest')->count();
$posttestQ = $questions->filter(fn($q) => $q->question_type === 'posttest')->count();
echo "- Pretest questions: $pretestQ\n";
echo "- Posttest questions: $posttestQ\n";
echo "- Other/null type: " . ($questions->count() - $pretestQ - $posttestQ) . "\n";
