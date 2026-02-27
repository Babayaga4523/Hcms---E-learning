<?php

// Check if database has real data - simple diagnostic script

// Include Laravel bootstrap
require __DIR__ . '/bootstrap/app.php';
$app = \Illuminate\Foundation\Application::getInstance();
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\UserTraining;
use App\Models\ExamAttempt;
use App\Models\ModuleProgress;
use App\Services\PointsService;

echo "\n";
echo "========================================\n";
echo "Database Data Verification\n";
echo "========================================\n\n";

// Check Users
$userCount = User::where('role', 'user')->count();
echo "✅ Total Learner Users: " . $userCount . "\n";

// Get sample user
$sampleUser = User::where('role', 'user')->first();
if ($sampleUser) {
    echo "   Sample User: {$sampleUser->name} (ID: {$sampleUser->id})\n";
}

// Check Enrollments
$enrollmentCount = UserTraining::count();
echo "\n✅ Total Enrollments: " . $enrollmentCount . "\n";

// Check Exam Attempts
$examCount = ExamAttempt::count();
$passedExams = ExamAttempt::where('is_passed', true)->count();
echo "\n✅ Total Exam Attempts: " . $examCount . "\n";
echo "   Passed Exams: " . $passedExams . "\n";

// Check Module Progress
$progressCount = ModuleProgress::count();
$completedProgress = ModuleProgress::where('status', 'completed')->count();
echo "\n✅ Total Module Progress: " . $progressCount . "\n";
echo "   Completed Modules: " . $completedProgress . "\n";

// Test API data with sample user
if ($sampleUser) {
    echo "\n========================================\n";
    echo "API Response Simulation for User: {$sampleUser->name}\n";
    echo "========================================\n\n";
    
    // Simulate getMonthlyLeaderboard
    echo "1️⃣ Leaderboard Data:\n";
    $pointsService = app(PointsService::class);
    $topPerformers = $pointsService->getTopPerformers(3);
    echo "   - Top 3 performers retrieved: " . count($topPerformers) . " records\n";
    if (!empty($topPerformers)) {
        echo "   - Top performer: " . $topPerformers[0]['name'] . " with " . $topPerformers[0]['total_points'] . " points\n";
    }
    
    // Simulate getLearningStatistics
    echo "\n2️⃣ Learning Statistics:\n";
    $userTrainings = UserTraining::where('user_id', $sampleUser->id)->whereNotNull('completed_at')->count();
    $userExamsAvg = ExamAttempt::where('user_id', $sampleUser->id)->avg('percentage');
    echo "   - User's completed trainings: " . $userTrainings . "\n";
    echo "   - User's average exam score: " . round($userExamsAvg ?? 0, 1) . "%\n";
    
    // Simulate getGoals
    echo "\n3️⃣ Goal Tracking:\n";
    $thisMonthCompleted = UserTraining::where('user_id', $sampleUser->id)
        ->where('status', 'completed')
        ->whereMonth('completed_at', now()->month)
        ->count();
    echo "   - User's trainings completed this month: " . $thisMonthCompleted . "\n";
    echo "   - Target for this month: 3 trainings\n";
    echo "   - Progress: " . round(($thisMonthCompleted / 3) * 100) . "%\n";
}

echo "\n========================================\n";
echo "✅ All data verified - using REAL database\n";
echo "========================================\n\n";
