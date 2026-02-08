<?php
/**
 * QUICK REFERENCE: Pre-Test & Post-Test Scoring Logic
 * 
 * Copy-paste ready code snippets for understanding the fix
 */

// ============================================
// ❌ BEFORE (SALAH)
// ============================================

$percentageBefore = function($correctCount, $totalQuestionsInQuiz) {
    // MASALAH: Menghitung berdasarkan SEMUA soal di modul
    // Bukan soal yang dijawab user
    $percentage = $totalQuestionsInQuiz > 0 
        ? round(($correctCount / $totalQuestionsInQuiz) * 100, 2) 
        : 0;
    
    return $percentage;
};

// Contoh dengan 1 soal:
// correctCount = 1 (user jawab benar)
// totalQuestionsInQuiz = 5 (ada 5 soal di modul)
// Result: (1/5) * 100 = 20%  ❌ SALAH! Seharusnya 100%

echo "BEFORE Logic:\n";
echo "1 soal benar dari 5 soal modul = " . $percentageBefore(1, 5) . "% ❌ SALAH\n";
echo "\n";

// ============================================
// ✅ AFTER (SEMPURNA)
// ============================================

$percentageAfter = function($correctCount, $answeredCount) {
    // BENAR: Menghitung berdasarkan soal yang DIJAWAB user
    
    if ($answeredCount === 1 && $correctCount === 1) {
        // Rule 1: 1 soal dijawab benar = 100%
        $percentage = 100;
    } elseif ($answeredCount === 1 && $correctCount === 0) {
        // Rule 2: 1 soal dijawab salah = 0%
        $percentage = 0;
    } elseif ($answeredCount > 1) {
        // Rule 3: Multiple soal = (correct/total) * 100
        $percentage = round(($correctCount / $answeredCount) * 100, 2);
    } else {
        // Edge case
        $percentage = 0;
    }
    
    return $percentage;
};

// Contoh dengan 1 soal:
// correctCount = 1 (user jawab benar)
// answeredCount = 1 (user hanya menjawab 1 soal)
// Result: 100% ✅ BENAR!

echo "AFTER Logic:\n";
echo "1 soal benar dari 1 soal dijawab = " . $percentageAfter(1, 1) . "% ✅ BENAR\n";
echo "\n";

// ============================================
// COMPARISON TABLE
// ============================================

echo "COMPARISON:\n";
echo "==========================================================================\n";
echo "Scenario                      | BEFORE (❌) | AFTER (✅) | Correct? \n";
echo "==========================================================================\n";

$scenarios = [
    ['desc' => '1 benar dari 1 (solo)', 'correct' => 1, 'answered' => 1, 'in_module' => 5],
    ['desc' => '2 benar dari 5 (multiple)', 'correct' => 2, 'answered' => 5, 'in_module' => 5],
    ['desc' => '3 benar dari 5 (multiple)', 'correct' => 3, 'answered' => 5, 'in_module' => 5],
    ['desc' => '0 benar dari 5 (multiple)', 'correct' => 0, 'answered' => 5, 'in_module' => 5],
    ['desc' => '1 salah dari 1 (solo)', 'correct' => 0, 'answered' => 1, 'in_module' => 5],
];

foreach ($scenarios as $s) {
    $before = $percentageBefore($s['correct'], $s['in_module']);
    $after = $percentageAfter($s['correct'], $s['answered']);
    
    $correct = ($s['correct'] === $s['answered']) ? '100%' : 'varies';
    if ($s['answered'] === 1) {
        $correct = ($s['correct'] === 1) ? '100%' : '0%';
    } else {
        $correct = round(($s['correct'] / $s['answered']) * 100) . '%';
    }
    
    printf("%-30s | %10.0f%% | %9.0f%% | %s\n", 
        $s['desc'], $before, $after, $correct);
}

echo "==========================================================================\n";
echo "\n";

// ============================================
// PASS/FAIL LOGIC
// ============================================

function checkPass($percentage, $passingScore = 70) {
    return $percentage >= $passingScore;
}

echo "PASS/FAIL DECISION (Passing Score = 70%):\n";
echo "========================================\n";

$testScores = [100, 80, 75, 70, 60, 50, 0];

foreach ($testScores as $score) {
    $passed = checkPass($score);
    $status = $passed ? '✅ PASS' : '❌ FAIL';
    printf("Score %3d%% → %s\n", $score, $status);
}

echo "\n";

// ============================================
// IMPLEMENTATION CODE
// ============================================

echo "IMPLEMENTATION IN QuizService.php:\n";
echo "==================================\n";

$code = <<<'PHP'
public function processSubmission(ExamAttempt $attempt, array $answers)
{
    // ... grading logic ...
    
    // PERFECT SCORING LOGIC
    $answeredCount = count($answers);
    
    if ($answeredCount === 1 && $correctCount === 1) {
        $percentage = 100;  // 1 soal benar = 100%
    } elseif ($answeredCount === 1 && $correctCount === 0) {
        $percentage = 0;    // 1 soal salah = 0%
    } elseif ($answeredCount > 1) {
        $percentage = round(($correctCount / $answeredCount) * 100, 2);
    } else {
        $percentage = 0;
    }
    
    $passingScore = $quiz->passing_score ?? 70;
    $isPassed = $percentage >= $passingScore;
    
    // ... update attempt ...
}
PHP;

echo $code;
echo "\n";

// ============================================
// FORMULA SUMMARY
// ============================================

echo "FORMULA SUMMARY:\n";
echo "================\n";
echo "IF answered_count == 1 AND correct == 1\n";
echo "  → percentage = 100%\n";
echo "\n";
echo "IF answered_count == 1 AND correct == 0\n";
echo "  → percentage = 0%\n";
echo "\n";
echo "IF answered_count > 1\n";
echo "  → percentage = (correct / answered_count) * 100\n";
echo "\n";
echo "IF percentage >= passing_score\n";
echo "  → is_passed = true\n";
echo "ELSE\n";
echo "  → is_passed = false\n";
echo "\n";

echo "✅ COMPLETE!\n";
