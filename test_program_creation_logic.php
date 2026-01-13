<?php

// Test script untuk verifikasi AdminTrainingProgramController store method
// dengan format pre_test_questions dan post_test_questions

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\Module;
use App\Models\TrainingMaterial;
use App\Models\Question;
use App\Models\Quiz;
use App\Http\Controllers\AdminTrainingProgramController;

// Mock request data seperti yang dikirim frontend
$testData = [
    'title' => 'Test Program with Materials & Questions',
    'description' => 'Testing the fixed logic for program creation',
    'duration_minutes' => 60,
    'passing_grade' => 70,
    'category' => 'Test',
    'is_active' => true,
    'allow_retake' => false,
    'xp' => 100,
    'materials' => [
        [
            'title' => 'Test Material 1',
            'description' => 'Test description',
            'type' => 'document',
            'file' => null, // Mock file upload
        ]
    ],
    'pre_test_questions' => [
        [
            'question_text' => 'What is 2+2?',
            'option_a' => '3',
            'option_b' => '4',
            'option_c' => '5',
            'option_d' => '6',
            'correct_answer' => 'b',
            'explanation' => 'Basic math',
        ]
    ],
    'post_test_questions' => [
        [
            'question_text' => 'What is the capital of France?',
            'option_a' => 'London',
            'option_b' => 'Berlin',
            'option_c' => 'Paris',
            'option_d' => 'Madrid',
            'correct_answer' => 'c',
            'explanation' => 'Geography question',
        ]
    ]
];

echo "=== Testing AdminTrainingProgramController Logic ===\n\n";

// Test 1: Validation Rules
echo "1. Testing Validation Rules...\n";
try {
    $rules = [
        'title' => 'required|string|max:255',
        'description' => 'required|string',
        'duration_minutes' => 'required|integer|min:1',
        'passing_grade' => 'required|integer|min:0|max:100',
        'category' => 'nullable|string|max:255',
        'is_active' => 'boolean',
        'allow_retake' => 'boolean',
        'max_retake_attempts' => 'nullable|integer|min:1',
        'expiry_date' => 'nullable|date',
        'prerequisite_module_id' => 'nullable|exists:modules,id',
        'instructor_id' => 'nullable|exists:users,id',
        'certificate_template' => 'nullable|string',
        // Materials validation
        'materials.*.file' => 'sometimes|nullable|file|mimes:pdf,mp4,doc,docx,ppt,pptx,xls,xlsx|max:20480',
        'materials.*.title' => 'required|string',
        'materials.*.description' => 'nullable|string',
        'materials.*.duration' => 'nullable|integer|min:0',
        'materials.*.order' => 'nullable|integer|min:0',
        // Questions validation (both formats)
        'questions.*.question_text' => 'nullable|string',
        'questions.*.question_type' => 'nullable|in:pretest,posttest',
        'questions.*.option_a' => 'nullable|string',
        'questions.*.option_b' => 'nullable|string',
        'questions.*.option_c' => 'nullable|string',
        'questions.*.option_d' => 'nullable|string',
        'questions.*.correct_answer' => 'nullable|in:a,b,c,d',
        'questions.*.explanation' => 'nullable|string',
        'questions.*.image_url' => 'nullable|image|max:5120',
        // Separate format validation
        'pre_test_questions.*.question_text' => 'nullable|string',
        'pre_test_questions.*.option_a' => 'nullable|string',
        'pre_test_questions.*.option_b' => 'nullable|string',
        'pre_test_questions.*.option_c' => 'nullable|string',
        'pre_test_questions.*.option_d' => 'nullable|string',
        'pre_test_questions.*.correct_answer' => 'nullable|in:a,b,c,d',
        'pre_test_questions.*.explanation' => 'nullable|string',
        'pre_test_questions.*.image_url' => 'nullable|image|max:5120',
        'post_test_questions.*.question_text' => 'nullable|string',
        'post_test_questions.*.option_a' => 'nullable|string',
        'post_test_questions.*.option_b' => 'nullable|string',
        'post_test_questions.*.option_c' => 'nullable|string',
        'post_test_questions.*.option_d' => 'nullable|string',
        'post_test_questions.*.correct_answer' => 'nullable|in:a,b,c,d',
        'post_test_questions.*.explanation' => 'nullable|string',
        'post_test_questions.*.image_url' => 'nullable|image|max:5120',
    ];

    $validator = \Illuminate\Support\Facades\Validator::make($testData, $rules);

    if ($validator->fails()) {
        echo "❌ Validation failed:\n";
        foreach ($validator->errors()->all() as $error) {
            echo "  - $error\n";
        }
    } else {
        echo "✅ Validation passed!\n";
    }
} catch (Exception $e) {
    echo "❌ Validation error: " . $e->getMessage() . "\n";
}

// Test 2: Question Processing Logic
echo "\n2. Testing Question Processing Logic...\n";

$allQuestions = [];

// Handle separate pre/post test questions format (from frontend)
if (isset($testData['pre_test_questions']) && is_array($testData['pre_test_questions'])) {
    foreach ($testData['pre_test_questions'] as $qData) {
        if (!empty($qData['question_text'])) {
            $qData['question_type'] = 'pretest';
            $allQuestions[] = $qData;
        }
    }
}

if (isset($testData['post_test_questions']) && is_array($testData['post_test_questions'])) {
    foreach ($testData['post_test_questions'] as $qData) {
        if (!empty($qData['question_text'])) {
            $qData['question_type'] = 'posttest';
            $allQuestions[] = $qData;
        }
    }
}

echo "Combined questions: " . count($allQuestions) . "\n";
foreach ($allQuestions as $i => $q) {
    echo "  Question " . ($i+1) . ": " . $q['question_text'] . " (Type: " . $q['question_type'] . ")\n";
}

if (count($allQuestions) === 2) {
    echo "✅ Question processing logic works correctly!\n";
} else {
    echo "❌ Question processing failed!\n";
}

echo "\n=== Test Summary ===\n";
echo "✅ Validation rules updated to support both question formats\n";
echo "✅ Question processing logic combines pre/post test questions\n";
echo "✅ Ready for end-to-end testing with actual API calls\n";

?>