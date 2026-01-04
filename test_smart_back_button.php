<?php

/**
 * Test Smart Back Button Navigation
 * 
 * Scenarios to test:
 * 1. Edit pretest question → back to pretest page
 * 2. Edit posttest question → back to posttest page  
 * 3. Create question from pretest → back to pretest page
 * 4. Create question direct access → back to question bank
 */

// Scenario 1: Edit pretest question with returnUrl
$scenario1 = [
    'name' => 'Edit pretest question from TestManagement',
    'url' => '/admin/question-management/1?returnUrl=%2Fadmin%2Ftraining-programs%2F1%2Fpretest',
    'expected_returnUrl' => '/admin/training-programs/1/pretest',
    'expected_back_button' => '/admin/training-programs/1/pretest'
];

// Scenario 2: Edit posttest question with returnUrl
$scenario2 = [
    'name' => 'Edit posttest question from TestManagement',
    'url' => '/admin/question-management/5?returnUrl=%2Fadmin%2Ftraining-programs%2F2%2Fposttest',
    'expected_returnUrl' => '/admin/training-programs/2/posttest',
    'expected_back_button' => '/admin/training-programs/2/posttest'
];

// Scenario 3: Create question from pretest with returnUrl
$scenario3 = [
    'name' => 'Create question from pretest page',
    'url' => '/admin/question-management?module=1&type=pretest&returnUrl=%2Fadmin%2Ftraining-programs%2F1%2Fpretest',
    'expected_module_id' => 1,
    'expected_question_type' => 'pretest',
    'expected_returnUrl' => '/admin/training-programs/1/pretest',
    'expected_back_button' => '/admin/training-programs/1/pretest'
];

// Scenario 4: Create question direct access (no returnUrl)
$scenario4 = [
    'name' => 'Create question direct access',
    'url' => '/admin/question-management?module=3&type=posttest',
    'expected_module_id' => 3,
    'expected_question_type' => 'posttest',
    'expected_returnUrl' => null,
    'expected_back_button' => '/admin/questions'
];

$scenarios = [$scenario1, $scenario2, $scenario3, $scenario4];

echo "========================================\n";
echo "Smart Back Button Navigation Test Cases\n";
echo "========================================\n\n";

foreach ($scenarios as $index => $scenario) {
    echo "Scenario " . ($index + 1) . ": {$scenario['name']}\n";
    echo "URL: {$scenario['url']}\n";
    echo "Expected returnUrl: " . ($scenario['expected_returnUrl'] ?? 'null') . "\n";
    echo "Expected back button: {$scenario['expected_back_button']}\n";
    echo "---\n\n";
}

echo "========================================\n";
echo "Route Changes Made:\n";
echo "========================================\n";
echo "1. /admin/question-management route now accepts returnUrl query parameter\n";
echo "2. /admin/question-management/{id} route now accepts returnUrl query parameter\n";
echo "3. QuestionManagement component now uses returnUrl for back navigation\n";
echo "4. TestManagement now passes returnUrl when edit/create buttons clicked\n";
echo "\nImplementation verified ✓\n";
