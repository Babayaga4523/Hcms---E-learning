<?php

use Illuminate\Support\Facades\DB;
use App\Models\Module;
use App\Models\Quiz;
use App\Models\Question;
use App\Models\User;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Quiz API Response ===\n\n";

// Get a user
$user = User::where('role', 'user')->first();
if (!$user) {
    echo "❌ No user found with role 'user'\n";
    exit;
}
echo "Testing as User: {$user->name} (ID: {$user->id})\n\n";

// Test Module 5
$moduleId = 5;
$module = Module::find($moduleId);
if (!$module) {
    echo "❌ Module 5 not found\n";
    exit;
}
echo "Module: {$module->title}\n\n";

// Check quizzes
echo "1. Checking Quizzes:\n";
$pretest = Quiz::where(function($query) use ($moduleId) {
    $query->where('module_id', $moduleId)
          ->orWhere('training_program_id', $moduleId);
})
->where('type', 'pretest')
->where('is_active', true)
->first();

$posttest = Quiz::where(function($query) use ($moduleId) {
    $query->where('module_id', $moduleId)
          ->orWhere('training_program_id', $moduleId);
})
->where('type', 'posttest')
->where('is_active', true)
->first();

if ($pretest) {
    echo "   ✓ Pretest found (ID: {$pretest->id})\n";
    echo "     Name: {$pretest->name}\n";
    echo "     Active: " . ($pretest->is_active ? 'Yes' : 'No') . "\n";
    echo "     Passing Score: {$pretest->passing_score}%\n";
} else {
    echo "   ❌ Pretest NOT found\n";
}

if ($posttest) {
    echo "   ✓ Posttest found (ID: {$posttest->id})\n";
    echo "     Name: {$posttest->name}\n";
    echo "     Active: " . ($posttest->is_active ? 'Yes' : 'No') . "\n";
    echo "     Passing Score: {$posttest->passing_score}%\n";
} else {
    echo "   ❌ Posttest NOT found\n";
}

echo "\n2. Checking Questions:\n";
$questions = Question::where('module_id', $moduleId)->get();
echo "   Total questions: {$questions->count()}\n";
if ($questions->count() > 0) {
    echo "   First 3 questions:\n";
    foreach ($questions->take(3) as $q) {
        echo "   - Q{$q->id}: " . substr($q->question_text, 0, 50) . "...\n";
    }
}

echo "\n3. Checking User Enrollment:\n";
$enrollment = DB::table('user_trainings')
    ->where('user_id', $user->id)
    ->where('module_id', $moduleId)
    ->select('id', 'status')
    ->first();

if ($enrollment) {
    echo "   ✓ User enrolled (ID: {$enrollment->id})\n";
    echo "     Status: {$enrollment->status}\n";
} else {
    echo "   ❌ User NOT enrolled in this module\n";
    echo "   Creating enrollment...\n";
    
    $enrollmentId = DB::table('user_trainings')->insertGetId([
        'user_id' => $user->id,
        'module_id' => $moduleId,
        'status' => 'in_progress',
        'enrolled_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    
    echo "   ✓ Enrollment created (ID: {$enrollmentId})\n";
}

echo "\n4. Simulating API Response:\n";
echo "   GET /api/training/{$moduleId}/quiz/pretest\n";

if ($pretest) {
    $pretestQuestions = Question::where('module_id', $moduleId)
        ->where('question_type', 'pretest')
        ->select(['id', 'question_text', 'options', 'difficulty', 'points'])
        ->limit($pretest->question_count ?? 5)
        ->get();
    
    $response = [
        'success' => true,
        'training' => [
            'id' => $module->id,
            'title' => $module->title,
            'description' => $module->description,
        ],
        'quiz' => [
            'id' => $pretest->id,
            'name' => $pretest->name,
            'type' => $pretest->type,
            'description' => $pretest->description,
            'time_limit' => $pretest->time_limit,
            'passing_score' => $pretest->passing_score ?? 70,
            'question_count' => $pretestQuestions->count(),
            'show_answers' => $pretest->show_answers ?? true
        ],
        'questions' => $pretestQuestions->map(function($q) {
            // Normalize options like QuizController does
            $opts = [];
            if ($q->options) {
                $opts = is_string($q->options) ? json_decode($q->options, true) : $q->options;
                if ($opts instanceof \Illuminate\Support\Collection) {
                    $opts = $opts->toArray();
                }
            }
            if (!$opts || !is_array($opts) || count($opts) === 0) {
                // Legacy fallback
                $opts = [];
                foreach (['a','b','c','d'] as $label) {
                    $field = 'option_' . $label;
                    if (isset($q->$field)) {
                        $opts[] = ['label' => $label, 'text' => $q->$field];
                    }
                }
            }

            // Shuffle options like QuizController does
            shuffle($opts);

            return [
                'id' => $q->id,
                'question_text' => $q->question_text,
                'options' => $opts
            ];
        })->take(2), // Show only first 2 for brevity
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

echo "\n\n✅ Diagnostic complete!\n";
