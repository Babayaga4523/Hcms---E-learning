<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Module;
use App\Models\User;
use App\Models\UserTraining;
use App\Models\ModuleProgress;
use App\Models\Quiz;
use App\Models\ExamAttempt;

echo "=== Testing Training Detail Data ===\n\n";

// Get module 5
$module = Module::with(['questions'])->find(5);

if (!$module) {
    echo "❌ Module 5 not found!\n";
    exit(1);
}

echo "✅ Module found: {$module->title}\n";
echo "   - Duration: {$module->duration_minutes} minutes\n";
echo "   - Category: {$module->category}\n";
echo "   - Questions: " . $module->questions->count() . "\n";
echo "   - Pretest questions: " . $module->questions->where('question_type', 'pretest')->count() . "\n";
echo "   - Posttest questions: " . $module->questions->where('question_type', 'posttest')->count() . "\n\n";

// Get enrollments
$enrollments = UserTraining::where('module_id', 5)->get();
echo "📊 Total enrollments: " . $enrollments->count() . "\n";

if ($enrollments->isEmpty()) {
    echo "\n⚠️  No enrollments found. Creating test enrollment for user 1...\n";
    
    $user = User::find(1);
    if (!$user) {
        echo "❌ User 1 not found!\n";
        exit(1);
    }
    
    // Create enrollment
    $enrollment = UserTraining::create([
        'user_id' => 1,
        'module_id' => 5,
        'status' => 'in_progress',
        'enrolled_at' => now(),
    ]);
    
    // Create progress
    $progress = ModuleProgress::create([
        'user_id' => 1,
        'module_id' => 5,
        'status' => 'in_progress',
        'progress_percentage' => 25,
    ]);
    
    echo "✅ Created enrollment for {$user->name}\n";
    echo "   - Status: {$enrollment->status}\n";
    echo "   - Progress: {$progress->progress_percentage}%\n\n";
} else {
    echo "\n📋 Existing enrollments:\n";
    foreach ($enrollments as $enrollment) {
        $user = User::find($enrollment->user_id);
        $progress = ModuleProgress::where('user_id', $enrollment->user_id)
            ->where('module_id', 5)
            ->first();
            
        echo "   - User: {$user->name} (ID: {$user->id})\n";
        echo "     Status: {$enrollment->status}\n";
        echo "     Progress: " . ($progress ? $progress->progress_percentage : 0) . "%\n";
        
        // Check quiz attempts
        $pretestAttempt = ExamAttempt::where('user_id', $user->id)
            ->where('module_id', 5)
            ->where('exam_type', 'pre_test')
            ->orderBy('created_at', 'desc')
            ->first();
            
        $posttestAttempt = ExamAttempt::where('user_id', $user->id)
            ->where('module_id', 5)
            ->where('exam_type', 'post_test')
            ->orderBy('created_at', 'desc')
            ->first();
            
        echo "     Pretest: " . ($pretestAttempt ? "✓ Score: {$pretestAttempt->score}" : "✗ Not taken") . "\n";
        echo "     Posttest: " . ($posttestAttempt ? "✓ Score: {$posttestAttempt->score}" : "✗ Not taken") . "\n\n";
    }
}

// Get quizzes
$quizzes = Quiz::where('module_id', 5)->get();
echo "📝 Quizzes found: " . $quizzes->count() . "\n";
foreach ($quizzes as $quiz) {
    echo "   - {$quiz->type}: {$quiz->passing_score}% passing score, {$quiz->time_limit} minutes\n";
}

echo "\n✅ Training detail data check complete!\n";
echo "\n💡 You can now access: http://localhost:8000/training/5\n";
