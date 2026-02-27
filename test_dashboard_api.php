<?php

/**
 * Test script for new Dashboard API endpoints
 * PHP artisan tinker compatible - dapat di-run dengan: php artisan tinker < test_dashboard_api.php
 * Atau direct: php test_dashboard_api.php
 */

// Get the Laravel application
$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Http\Controllers\User\DashboardController;

echo "\n" . str_repeat("=", 80) . "\n";
echo "Testing New Dashboard API Endpoints\n";
echo str_repeat("=", 80) . "\n\n";

// Get a test user (preferably a learner/user role)
$testUser = User::where('role', 'user')->first();

if (!$testUser) {
    echo "❌ No test user found. Please ensure users are seeded.\n";
    exit(1);
}

echo "✅ Using test user: {$testUser->name} (ID: {$testUser->id})\n\n";

// Create controller instance
$controller = new DashboardController();

// Test 1: getMonthlyLeaderboard
echo "Test 1: GET /api/user/leaderboard/monthly\n";
echo str_repeat("-", 80) . "\n";
try {
    \Illuminate\Support\Facades\Auth::setUser($testUser);
    $response = $controller->getMonthlyLeaderboard();
    if ($response && isset($response['leaderboard'])) {
        echo "✅ Leaderboard data retrieved\n";
        echo "   - Top performers count: " . count($response['leaderboard']) . "\n";
        echo "   - User rank position: #" . $response['user_rank']['rank'] . "\n";
        echo "   - User points: " . $response['user_rank']['points'] . "\n";
    } else {
        echo "❌ Invalid response structure\n";
    }
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 2: getLearningStatistics
echo "Test 2: GET /api/user/dashboard/statistics\n";
echo str_repeat("-", 80) . "\n";
try {
    \Illuminate\Support\Facades\Auth::setUser($testUser);
    $response = $controller->getLearningStatistics();
    if ($response) {
        echo "✅ Learning statistics retrieved\n";
        if (isset($response['learning_hours'])) {
            echo "   - Total hours: " . $response['learning_hours']['value'] . " " . $response['learning_hours']['unit'] . "\n";
        }
        if (isset($response['materials_studied'])) {
            echo "   - Materials studied: " . $response['materials_studied']['value'] . "\n";
        }
        if (isset($response['quiz_success'])) {
            echo "   - Quiz success rate: " . $response['quiz_success']['percentage'] . "%\n";
        }
        if (isset($response['average_score'])) {
            echo "   - Average score: " . $response['average_score']['value'] . "\n";
        }
    } else {
        echo "❌ Invalid response structure\n";
    }
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
echo "\n";

// Test 3: getGoals
echo "Test 3: GET /api/user/dashboard/goals\n";
echo str_repeat("-", 80) . "\n";
try {
    \Illuminate\Support\Facades\Auth::setUser($testUser);
    $response = $controller->getGoals();
    if ($response && isset($response['monthly_target'])) {
        echo "✅ Goal data retrieved\n";
        echo "   - Target: " . $response['monthly_target']['target'] . " trainings\n";
        echo "   - Completed: " . $response['monthly_target']['completed'] . "\n";
        echo "   - Progress: " . $response['monthly_target']['progress_percentage'] . "%\n";
        echo "   - Days remaining: " . $response['monthly_target']['days_remaining'] . "\n";
        if ($response['completion_bonus']['awarded']) {
            echo "   - ✨ Goal achieved! Bonus unlocked\n";
        }
    } else {
        echo "❌ Invalid response structure\n";
    }
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n" . str_repeat("=", 80) . "\n";
echo "All tests completed!\n";
echo str_repeat("=", 80) . "\n\n";
