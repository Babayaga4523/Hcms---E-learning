<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\Question;
use App\Models\ExamAttempt;
use App\Models\UserExamAnswer;
use App\Models\ModuleProgress;
use App\Models\UserTraining;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PreTestPostTestController extends Controller
{
    /**
     * Get all questions for a module
     */
    public function getQuestions($moduleId, $examType)
    {
        // Validate exam type
        if (!in_array($examType, ['pre_test', 'post_test'])) {
            return response()->json(['error' => 'Invalid exam type'], 400);
        }

        $module = Module::findOrFail($moduleId);
        $questions = $module->questions()->get();

        if ($questions->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No questions available for this module'
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'module' => $module,
                'exam_type' => $examType,
                'total_questions' => $questions->count(),
                'questions' => $questions->map(function ($q) {
                    return [
                        'id' => $q->id,
                        'question_text' => $q->question_text,
                        'options' => [
                            'a' => $q->option_a,
                            'b' => $q->option_b,
                            'c' => $q->option_c,
                            'd' => $q->option_d,
                        ]
                    ];
                })
            ]
        ]);
    }

    /**
     * Start an exam (create exam attempt)
     */
    public function startExam(Request $request, $moduleId)
    {
        $validated = $request->validate([
            'exam_type' => 'required|in:pre_test,post_test'
        ]);

        $user = Auth::user();
        $module = Module::findOrFail($moduleId);

        // Check if user is enrolled (admins can bypass this)
        if ($user->role !== 'admin') {
            $enrollment = UserTraining::where('user_id', $user->id)
                ->where('module_id', $moduleId)
                ->first();

            if (!$enrollment) {
                return response()->json([
                    'error' => 'User not enrolled in this module'
                ], 403);
            }
        }

        // Create exam attempt
        $examAttempt = ExamAttempt::create([
            'user_id' => $user->id,
            'module_id' => $moduleId,
            'exam_type' => $validated['exam_type'],
            'score' => 0,
            'percentage' => 0,
            'is_passed' => false,
            'started_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'exam_attempt_id' => $examAttempt->id,
                'module_id' => $moduleId,
                'exam_type' => $validated['exam_type'],
                'started_at' => $examAttempt->started_at
            ]
        ]);
    }

    /**
     * Submit exam answers
     */
    public function submitExam(Request $request, $examAttemptId)
    {
        $validated = $request->validate([
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|integer',
            'answers.*.user_answer' => 'required|in:a,b,c,d'
        ]);

        $user = Auth::user();
        $examAttempt = ExamAttempt::findOrFail($examAttemptId);

        // Verify ownership
        if ($examAttempt->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $totalQuestions = 0;
        $correctAnswers = 0;

        DB::beginTransaction();

        try {
            foreach ($validated['answers'] as $answer) {
                $question = Question::findOrFail($answer['question_id']);
                $isCorrect = strtolower($answer['user_answer']) === strtolower($question->correct_answer);

                UserExamAnswer::create([
                    'exam_attempt_id' => $examAttempt->id,
                    'user_id' => $user->id,
                    'question_id' => $question->id,
                    'user_answer' => strtolower($answer['user_answer']),
                    'correct_answer' => strtolower($question->correct_answer),
                    'is_correct' => $isCorrect
                ]);

                $totalQuestions++;
                if ($isCorrect) {
                    $correctAnswers++;
                }
            }

            // Calculate score and percentage
            $percentage = $totalQuestions > 0 ? ($correctAnswers / $totalQuestions) * 100 : 0;
            $passingGrade = $examAttempt->module->passing_grade ?? 70;
            $isPassed = $percentage >= $passingGrade;

            // Update exam attempt
            $examAttempt->update([
                'score' => $correctAnswers,
                'percentage' => round($percentage, 2),
                'is_passed' => $isPassed,
                'finished_at' => now(),
                'duration_minutes' => $examAttempt->started_at ? 
                    ceil($examAttempt->started_at->diffInSeconds(now()) / 60) : 0
            ]);

            // Update module progress if post-test
            if ($examAttempt->exam_type === 'post_test' && $isPassed) {
                ModuleProgress::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'module_id' => $examAttempt->module_id
                    ],
                    [
                        'status' => 'completed',
                        'progress_percentage' => 100
                    ]
                );

                // Update user training
                $userTraining = UserTraining::where('user_id', $user->id)
                    ->where('module_id', $examAttempt->module_id)
                    ->first();

                if ($userTraining) {
                    $userTraining->update([
                        'status' => 'completed',
                        'final_score' => (int)$percentage,
                        'is_certified' => true,
                        'completed_at' => now()
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'exam_attempt_id' => $examAttempt->id,
                    'score' => $examAttempt->score,
                    'percentage' => $examAttempt->percentage,
                    'is_passed' => $examAttempt->is_passed,
                    'total_questions' => $totalQuestions,
                    'correct_answers' => $correctAnswers,
                    'passing_grade' => $passingGrade,
                    'exam_type' => $examAttempt->exam_type
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get exam results
     */
    public function getExamResult($examAttemptId)
    {
        $user = Auth::user();
        $examAttempt = ExamAttempt::with(['module', 'answers.question'])
            ->findOrFail($examAttemptId);

        // Verify ownership
        if ($examAttempt->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $answers = $examAttempt->answers->map(function ($answer) {
            return [
                'question_id' => $answer->question_id,
                'question_text' => $answer->question->question_text,
                'user_answer' => $answer->user_answer,
                'correct_answer' => $answer->correct_answer,
                'is_correct' => $answer->is_correct,
                'option' => [
                    'a' => $answer->question->option_a,
                    'b' => $answer->question->option_b,
                    'c' => $answer->question->option_c,
                    'd' => $answer->question->option_d,
                ]
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'exam_attempt_id' => $examAttempt->id,
                'module_id' => $examAttempt->module_id,
                'module_title' => $examAttempt->module->title,
                'exam_type' => $examAttempt->exam_type,
                'score' => $examAttempt->score,
                'percentage' => $examAttempt->percentage,
                'is_passed' => $examAttempt->is_passed,
                'passing_grade' => $examAttempt->module->passing_grade,
                'total_questions' => $answers->count(),
                'correct_answers' => $answers->where('is_correct', true)->count(),
                'duration_minutes' => $examAttempt->duration_minutes,
                'started_at' => $examAttempt->started_at,
                'finished_at' => $examAttempt->finished_at,
                'answers' => $answers
            ]
        ]);
    }

    /**
     * Get user's module progress
     */
    public function getModuleProgress($moduleId)
    {
        $user = Auth::user();
        
        $progress = ModuleProgress::where('user_id', $user->id)
            ->where('module_id', $moduleId)
            ->first();

        $preTestAttempt = ExamAttempt::where('user_id', $user->id)
            ->where('module_id', $moduleId)
            ->where('exam_type', 'pre_test')
            ->latest()
            ->first();

        $postTestAttempt = ExamAttempt::where('user_id', $user->id)
            ->where('module_id', $moduleId)
            ->where('exam_type', 'post_test')
            ->latest()
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'module_id' => $moduleId,
                'progress_status' => $progress?->status ?? 'locked',
                'progress_percentage' => $progress?->progress_percentage ?? 0,
                'pre_test' => $preTestAttempt ? [
                    'attempt_id' => $preTestAttempt->id,
                    'score' => $preTestAttempt->score,
                    'percentage' => $preTestAttempt->percentage,
                    'is_passed' => $preTestAttempt->is_passed,
                    'taken_at' => $preTestAttempt->started_at,
                    'duration_minutes' => $preTestAttempt->duration_minutes
                ] : null,
                'post_test' => $postTestAttempt ? [
                    'attempt_id' => $postTestAttempt->id,
                    'score' => $postTestAttempt->score,
                    'percentage' => $postTestAttempt->percentage,
                    'is_passed' => $postTestAttempt->is_passed,
                    'taken_at' => $postTestAttempt->started_at,
                    'duration_minutes' => $postTestAttempt->duration_minutes
                ] : null,
                'can_take_pre_test' => !$preTestAttempt,
                'can_take_post_test' => $postTestAttempt === null || $progress?->status === 'completed'
            ]
        ]);
    }

    /**
     * Get all attempts for a module
     */
    public function getModuleAttempts($moduleId)
    {
        $user = Auth::user();

        $attempts = ExamAttempt::where('user_id', $user->id)
            ->where('module_id', $moduleId)
            ->with('module')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($attempt) {
                return [
                    'id' => $attempt->id,
                    'exam_type' => $attempt->exam_type,
                    'score' => $attempt->score,
                    'percentage' => $attempt->percentage,
                    'is_passed' => $attempt->is_passed,
                    'started_at' => $attempt->started_at,
                    'finished_at' => $attempt->finished_at,
                    'duration_minutes' => $attempt->duration_minutes
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $attempts
        ]);
    }
}
