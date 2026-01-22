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
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class PreTestPostTestController extends Controller
{
    /**
     * Get questions for an active attempt (secure)
     * Note: we DO NOT return full question bank. Only questions assigned to an existing attempt.
     */
    public function getQuestions($moduleId, $examType)
    {
        // Validate exam type
        if (!in_array($examType, ['pre_test', 'post_test'])) {
            return response()->json(['error' => 'Invalid exam type'], 400);
        }

        $user = Auth::user();
        $module = Module::findOrFail($moduleId);

        // Find an active attempt for this user/module/type
        $attempt = ExamAttempt::where('user_id', $user->id)
            ->where('module_id', $moduleId)
            ->where('exam_type', $examType)
            ->whereNull('finished_at')
            ->latest()
            ->first();

        if (!$attempt) {
            return response()->json(['error' => 'No active attempt found. Please start the exam first.'], 404);
        }

        // Return only snapshot questions assigned to this attempt
        $assigned = UserExamAnswer::with('question')
            ->where('exam_attempt_id', $attempt->id)
            ->get();

        $data = $assigned->map(function ($ua) {
            $imageUrl = null;
            if ($ua->question->image_url && Storage::disk('public')->exists(str_replace('/storage/', '', $ua->question->image_url))) {
                $imageUrl = $ua->question->image_url;
            }
            
            return [
                'id' => $ua->question->id,
                'question_text' => $ua->question->question_text,
                'image_url' => $imageUrl,
                'options' => $ua->question->getOptions(),
                'type' => $ua->question->question_type
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'exam_attempt_id' => $attempt->id,
                'started_at' => $attempt->started_at,
                'server_time' => now(),
                'questions' => $data
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

        // Check for an existing active attempt (resume)
        $activeAttempt = ExamAttempt::where('user_id', $user->id)
            ->where('module_id', $moduleId)
            ->where('exam_type', $validated['exam_type'])
            ->whereNull('finished_at')
            ->latest()
            ->first();

        if ($activeAttempt) {
            // if expired, force finish. otherwise return existing attempt
            $maxDuration = $module->duration_minutes ?? 60;
            $expired = Carbon::parse($activeAttempt->started_at)->addMinutes($maxDuration + 2)->isPast();
            if ($expired) {
                $this->forceFinishExam($activeAttempt);
            } else {
                return $this->respondWithExamData($activeAttempt, $module);
            }
        }

        // Create new attempt and snapshot questions
        DB::beginTransaction();
        try {
            $attempt = ExamAttempt::create([
                'user_id' => $user->id,
                'module_id' => $moduleId,
                'exam_type' => $validated['exam_type'],
                'score' => 0,
                'percentage' => 0,
                'is_passed' => false,
                'started_at' => now()
            ]);

            // question limit and randomization
            $limit = $module->questions_limit ?? 20;
            $questions = $module->questions()->inRandomOrder()->take($limit)->get();

            if ($questions->isEmpty()) {
                DB::rollBack();
                return response()->json(['error' => 'No questions available for this module'], 422);
            }

            $insert = [];
            foreach ($questions as $q) {
                $insert[] = [
                    'exam_attempt_id' => $attempt->id,
                    'user_id' => $user->id,
                    'question_id' => $q->id,
                    'created_at' => now(),
                    'updated_at' => now()
                ];
            }
            UserExamAnswer::insert($insert);

            DB::commit();
            return $this->respondWithExamData($attempt, $module);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('startExam error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to start exam'], 500);
        }
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

        // Verify ownership and status
        if ($examAttempt->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($examAttempt->finished_at) {
            return response()->json(['error' => 'Exam already submitted'], 400);
        }

        // Server-side time check (with small grace window)
        $maxMinutes = $examAttempt->module->duration_minutes ?? 60;
        $deadline = Carbon::parse($examAttempt->started_at)->addMinutes($maxMinutes + 2);
        if (now()->greaterThan($deadline)) {
            // Force finish and reject late submissions
            $this->forceFinishExam($examAttempt);
            return response()->json(['error' => 'Time limit exceeded. Exam auto-submitted.'], 408);
        }

        DB::beginTransaction();

        try {
            // Re-fetch assigned questions to avoid trusting client-submitted IDs
            $assigned = UserExamAnswer::where('exam_attempt_id', $examAttempt->id)->get()->keyBy('question_id');

            $totalQuestions = 0;
            $correctAnswers = 0;

            foreach ($assigned as $questionId => $record) {
                $submitted = collect($validated['answers'])->firstWhere('question_id', $questionId);
                $userAnswer = $submitted ? strtolower($submitted['user_answer']) : null;

                $question = Question::findOrFail($questionId);
                $isCorrect = $userAnswer !== null && strtolower($question->correct_answer) === $userAnswer;

                // Update existing record (snapshot) - do not create new rows
                UserExamAnswer::where('id', $record->id)->update([
                    'user_answer' => $userAnswer,
                    'correct_answer' => strtolower($question->correct_answer),
                    'is_correct' => $isCorrect,
                    'updated_at' => now()
                ]);

                $totalQuestions++;
                if ($isCorrect) $correctAnswers++;
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

            // Finalize exam attempt
            $examAttempt->update([
                'score' => $correctAnswers,
                'percentage' => round($percentage, 2),
                'is_passed' => $isPassed,
                'finished_at' => now(),
                'duration_minutes' => $examAttempt->started_at ? ceil($examAttempt->started_at->diffInSeconds(now()) / 60) : 0
            ]);

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
            Log::error('submitExam error: ' . $e->getMessage());
            return response()->json(['error' => 'Submission failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get exam results (owner-only). OK to include correct answers AFTER finishing.
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

        if (!$examAttempt->finished_at) {
            return response()->json(['error' => 'Exam still in progress'], 409);
        }

        $answers = $examAttempt->answers->map(function ($answer) {
            $opts = $answer->question->getOptions();
            return [
                'question_id' => $answer->question_id,
                'question_text' => $answer->question->question_text,
                'user_answer' => $answer->user_answer,
                'correct_answer' => $answer->correct_answer,
                'is_correct' => $answer->is_correct,
                'options' => $opts
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
                    'duration_minutes' => $attempt->duration_minutes,
                    'status' => $attempt->finished_at ? 'finished' : 'in_progress'
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $attempts
        ]);
    }

    // --- Helper methods ---

    private function respondWithExamData($attempt, $module)
    {
        $assigned = UserExamAnswer::with('question')
            ->where('exam_attempt_id', $attempt->id)
            ->get();

        $questions = $assigned->map(function ($ua) {
            $imageUrl = null;
            if ($ua->question->image_url && Storage::disk('public')->exists(str_replace('/storage/', '', $ua->question->image_url))) {
                $imageUrl = $ua->question->image_url;
            }
            
            return [
                'id' => $ua->question->id,
                'question_text' => $ua->question->question_text,
                'image_url' => $imageUrl,
                'options' => $ua->question->getOptions(),
                'type' => $ua->question->question_type
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'exam_attempt_id' => $attempt->id,
                'exam_type' => $attempt->exam_type,
                'duration_minutes' => $module->duration_minutes ?? 60,
                'started_at' => $attempt->started_at,
                'server_time' => now(),
                'questions' => $questions
            ]
        ]);
    }

    private function forceFinishExam($attempt)
    {
        if (!$attempt->finished_at) {
            $attempt->update(['finished_at' => now(), 'is_passed' => false]);
        }
    }
}
