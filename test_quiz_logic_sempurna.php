<?php
/**
 * Test Pre-Test & Post-Test Logic Sempurna
 * 
 * Tests semua scenario scoring dengan logic baru
 */

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Module;
use App\Models\Question;
use App\Models\ExamAttempt;
use App\Services\QuizService;
use Illuminate\Support\Facades\DB;

$quizService = app(QuizService::class);

echo "=== TESTING PRE-TEST & POST-TEST LOGIC SEMPURNA ===\n\n";

try {
    // Create test user
    $user = User::firstOrCreate([
        'email' => 'test.quiz@example.com'
    ], [
        'name' => 'Quiz Tester',
        'password' => bcrypt('password')
    ]);
    
    echo "Test User: {$user->name} (ID: {$user->id})\n\n";
    
    // Test 1: Single Question - Correct Answer
    echo "TEST 1: Single Question - Correct Answer\n";
    echo "==========================================\n";
    
    $module1 = Module::factory()->create(['title' => 'Module 1 - Single Q']);
    $q1 = Question::create([
        'module_id' => $module1->id,
        'question_text' => 'Test Question 1',
        'option_a' => 'Correct',
        'option_b' => 'Wrong 1',
        'option_c' => 'Wrong 2',
        'option_d' => 'Wrong 3',
        'correct_answer' => 'A',
        'question_type' => 'pretest'
    ]);
    
    $attempt1 = ExamAttempt::create([
        'user_id' => $user->id,
        'module_id' => $module1->id,
        'exam_type' => 'pre_test',
        'score' => 0,
        'percentage' => 0,
        'is_passed' => false,
        'started_at' => now()
    ]);
    
    $result1 = $quizService->processSubmission($attempt1, [
        ['question_id' => $q1->id, 'answer' => 'A']
    ]);
    
    echo "Question: {$q1->question_text}\n";
    echo "User Answer: A (CORRECT)\n";
    echo "Result:\n";
    echo "  Percentage: {$result1['percentage']}%\n";
    echo "  Is Passed: " . ($result1['is_passed'] ? 'YES' : 'NO') . "\n";
    echo "  Status: " . ($result1['percentage'] === 100.0 ? "✓ PASSED" : "✗ FAILED") . "\n";
    echo "\n";
    
    // Test 2: Single Question - Wrong Answer
    echo "TEST 2: Single Question - Wrong Answer\n";
    echo "======================================\n";
    
    $module2 = Module::factory()->create(['title' => 'Module 2 - Single Q Wrong']);
    $q2 = Question::create([
        'module_id' => $module2->id,
        'question_text' => 'Test Question 2',
        'option_a' => 'Correct',
        'option_b' => 'Wrong 1',
        'option_c' => 'Wrong 2',
        'option_d' => 'Wrong 3',
        'correct_answer' => 'A',
        'question_type' => 'pretest'
    ]);
    
    $attempt2 = ExamAttempt::create([
        'user_id' => $user->id,
        'module_id' => $module2->id,
        'exam_type' => 'pre_test',
        'score' => 0,
        'percentage' => 0,
        'is_passed' => false,
        'started_at' => now()
    ]);
    
    $result2 = $quizService->processSubmission($attempt2, [
        ['question_id' => $q2->id, 'answer' => 'B']
    ]);
    
    echo "Question: {$q2->question_text}\n";
    echo "User Answer: B (WRONG)\n";
    echo "Result:\n";
    echo "  Percentage: {$result2['percentage']}%\n";
    echo "  Is Passed: " . ($result2['is_passed'] ? 'YES' : 'NO') . "\n";
    echo "  Status: " . ($result2['percentage'] === 0.0 ? "✓ PASSED" : "✗ FAILED") . "\n";
    echo "\n";
    
    // Test 3: Five Questions - 3 Correct (60%)
    echo "TEST 3: Five Questions - 3 Correct (60%)\n";
    echo "========================================\n";
    
    $module3 = Module::factory()->create(['title' => 'Module 3 - Five Questions']);
    $questions3 = [];
    for ($i = 1; $i <= 5; $i++) {
        $q = Question::create([
            'module_id' => $module3->id,
            'question_text' => "Question $i",
            'option_a' => 'Answer A',
            'option_b' => 'Answer B',
            'option_c' => 'Answer C',
            'option_d' => 'Answer D',
            'correct_answer' => chr(65 + (($i - 1) % 4)),  // A, B, C, D, A
            'question_type' => 'posttest'
        ]);
        $questions3[] = $q;
    }
    
    $attempt3 = ExamAttempt::create([
        'user_id' => $user->id,
        'module_id' => $module3->id,
        'exam_type' => 'post_test',
        'score' => 0,
        'percentage' => 0,
        'is_passed' => false,
        'started_at' => now()
    ]);
    
    // Answers: Correct, Wrong, Correct, Wrong, Correct (3/5)
    $answers3 = [
        ['question_id' => $questions3[0]->id, 'answer' => 'A'],  // ✓
        ['question_id' => $questions3[1]->id, 'answer' => 'A'],  // ✗
        ['question_id' => $questions3[2]->id, 'answer' => 'C'],  // ✓
        ['question_id' => $questions3[3]->id, 'answer' => 'A'],  // ✗
        ['question_id' => $questions3[4]->id, 'answer' => 'A'],  // ✓
    ];
    
    $result3 = $quizService->processSubmission($attempt3, $answers3);
    
    echo "Questions: 5\n";
    echo "Correct Answers: 3\n";
    echo "Result:\n";
    echo "  Percentage: {$result3['percentage']}%\n";
    echo "  Expected: 60%\n";
    echo "  Is Passed: " . ($result3['is_passed'] ? 'YES' : 'NO') . "\n";
    echo "  Status: " . ($result3['percentage'] === 60.0 ? "✓ PASSED" : "✗ FAILED") . "\n";
    echo "\n";
    
    // Test 4: Perfect Score - All Correct
    echo "TEST 4: Perfect Score - All Correct (100%)\n";
    echo "==========================================\n";
    
    $module4 = Module::factory()->create(['title' => 'Module 4 - Perfect Score']);
    $questions4 = [];
    for ($i = 1; $i <= 4; $i++) {
        $q = Question::create([
            'module_id' => $module4->id,
            'question_text' => "Perfect Q$i",
            'option_a' => 'Correct Answer',
            'option_b' => 'Wrong',
            'option_c' => 'Wrong',
            'option_d' => 'Wrong',
            'correct_answer' => 'A',
            'question_type' => 'posttest'
        ]);
        $questions4[] = $q;
    }
    
    $attempt4 = ExamAttempt::create([
        'user_id' => $user->id,
        'module_id' => $module4->id,
        'exam_type' => 'post_test',
        'score' => 0,
        'percentage' => 0,
        'is_passed' => false,
        'started_at' => now()
    ]);
    
    $answers4 = array_map(fn($q) => [
        'question_id' => $q->id,
        'answer' => 'A'
    ], $questions4);
    
    $result4 = $quizService->processSubmission($attempt4, $answers4);
    
    echo "Questions: 4\n";
    echo "Correct Answers: 4\n";
    echo "Result:\n";
    echo "  Percentage: {$result4['percentage']}%\n";
    echo "  Is Passed: " . ($result4['is_passed'] ? 'YES' : 'NO') . "\n";
    echo "  Status: " . ($result4['percentage'] === 100.0 ? "✓ PASSED" : "✗ FAILED") . "\n";
    echo "\n";
    
    // Test 5: Zero Correct (0%)
    echo "TEST 5: Zero Correct (0%)\n";
    echo "========================\n";
    
    $module5 = Module::factory()->create(['title' => 'Module 5 - All Wrong']);
    $questions5 = [];
    for ($i = 1; $i <= 3; $i++) {
        $q = Question::create([
            'module_id' => $module5->id,
            'question_text' => "Wrong Q$i",
            'option_a' => 'Correct',
            'option_b' => 'Wrong',
            'option_c' => 'Wrong',
            'option_d' => 'Wrong',
            'correct_answer' => 'A',
            'question_type' => 'posttest'
        ]);
        $questions5[] = $q;
    }
    
    $attempt5 = ExamAttempt::create([
        'user_id' => $user->id,
        'module_id' => $module5->id,
        'exam_type' => 'post_test',
        'score' => 0,
        'percentage' => 0,
        'is_passed' => false,
        'started_at' => now()
    ]);
    
    $answers5 = array_map(fn($q) => [
        'question_id' => $q->id,
        'answer' => 'B'
    ], $questions5);
    
    $result5 = $quizService->processSubmission($attempt5, $answers5);
    
    echo "Questions: 3\n";
    echo "Correct Answers: 0\n";
    echo "Result:\n";
    echo "  Percentage: {$result5['percentage']}%\n";
    echo "  Is Passed: " . ($result5['is_passed'] ? 'YES' : 'NO') . "\n";
    echo "  Status: " . ($result5['percentage'] === 0.0 ? "✓ PASSED" : "✗ FAILED") . "\n";
    echo "\n";
    
    // Test 6: Edge Case - 1 Correct from 2
    echo "TEST 6: Edge Case - 1 Correct from 2 (50%)\n";
    echo "==========================================\n";
    
    $module6 = Module::factory()->create(['title' => 'Module 6 - Edge Case']);
    $q6_1 = Question::create([
        'module_id' => $module6->id,
        'question_text' => 'Edge Q1',
        'option_a' => 'Correct',
        'option_b' => 'Wrong',
        'correct_answer' => 'A',
        'question_type' => 'posttest'
    ]);
    $q6_2 = Question::create([
        'module_id' => $module6->id,
        'question_text' => 'Edge Q2',
        'option_a' => 'Correct',
        'option_b' => 'Wrong',
        'correct_answer' => 'A',
        'question_type' => 'posttest'
    ]);
    
    $attempt6 = ExamAttempt::create([
        'user_id' => $user->id,
        'module_id' => $module6->id,
        'exam_type' => 'post_test',
        'score' => 0,
        'percentage' => 0,
        'is_passed' => false,
        'started_at' => now()
    ]);
    
    $result6 = $quizService->processSubmission($attempt6, [
        ['question_id' => $q6_1->id, 'answer' => 'A'],  // ✓
        ['question_id' => $q6_2->id, 'answer' => 'B'],  // ✗
    ]);
    
    echo "Questions: 2\n";
    echo "Correct Answers: 1\n";
    echo "Result:\n";
    echo "  Percentage: {$result6['percentage']}%\n";
    echo "  Is Passed: " . ($result6['is_passed'] ? 'YES' : 'NO') . "\n";
    echo "  Status: " . ($result6['percentage'] === 50.0 ? "✓ PASSED" : "✗ FAILED") . "\n";
    echo "\n";
    
    // Summary
    echo "=== SUMMARY ===\n";
    $test1_pass = abs($result1['percentage'] - 100.0) < 0.01;
    $test2_pass = abs($result2['percentage'] - 0.0) < 0.01;
    $test3_pass = abs($result3['percentage'] - 60.0) < 0.01;
    $test4_pass = abs($result4['percentage'] - 100.0) < 0.01;
    $test5_pass = abs($result5['percentage'] - 0.0) < 0.01;
    $test6_pass = abs($result6['percentage'] - 50.0) < 0.01;
    
    echo "✓ Test 1 (Single Q - Correct): " . ($test1_pass ? "PASS" : "FAIL") . "\n";
    echo "✓ Test 2 (Single Q - Wrong): " . ($test2_pass ? "PASS" : "FAIL") . "\n";
    echo "✓ Test 3 (5Q - 3 Correct): " . ($test3_pass ? "PASS" : "FAIL") . "\n";
    echo "✓ Test 4 (Perfect Score): " . ($test4_pass ? "PASS" : "FAIL") . "\n";
    echo "✓ Test 5 (All Wrong): " . ($test5_pass ? "PASS" : "FAIL") . "\n";
    echo "✓ Test 6 (1 from 2): " . ($test6_pass ? "PASS" : "FAIL") . "\n";
    echo "\nAll tests completed!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
