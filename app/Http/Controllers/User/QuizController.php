<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Controllers\User\Traits\ValidatesQuizAccess;
use App\Models\ExamAttempt;
use App\Models\Module;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\UserExamAnswer;
use App\Services\QuizService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class QuizController extends Controller
{
    use ValidatesQuizAccess;

    protected $quizService;

    public function __construct(QuizService $quizService)
    {
        $this->quizService = $quizService;
    }
    /**
     * Render quiz page with questions
     */
    public function take($trainingId, $type)
    {
        try {
            $user = Auth::user();
            $examType = $type === 'pretest' ? 'pre_test' : 'post_test';

            // Validasi full access menggunakan trait
            $validation = $this->validateFullQuizAccess($trainingId, $type, $user->id);
            if (isset($validation['success']) && !$validation['success']) {
                return Inertia::render('User/Quiz/TakeQuiz', array_merge($validation, [
                    'training' => ['id' => $trainingId],
                    'quiz' => ['type' => $type],
                    'questions' => [],
                ]));
            }

            $module = $validation['module'];
            $quiz = $validation['quiz'];

            // Get questions dengan normalized options dari model accessor
            $questions = Question::where('module_id', $trainingId)
                ->where('question_type', $type)
                ->inRandomOrder()
                ->limit($quiz->question_count ?? 5)
                ->get()
                ->map(function($q) {
                    return [
                        'id' => $q->id,
                        'question_text' => $q->question_text,
                        'options' => $q->normalized_options, // Gunakan accessor dari model
                        'difficulty' => $q->difficulty,
                        'points' => $q->points,
                        'image_url' => $this->normalizeImageUrl($q->image_url),
                    ];
                });

            // Create atau get existing attempt
            $attempt = $this->quizService->getOrCreateAttempt($user->id, $trainingId, $examType);

            return Inertia::render('User/Quiz/TakeQuiz', [
                'training' => [
                    'id' => $module->id,
                    'title' => $module->title,
                    'description' => $module->description,
                ],
                'quiz' => [
                    'id' => $quiz->id,
                    'name' => $quiz->name,
                    'type' => $quiz->type,
                    'description' => $quiz->description,
                    'duration' => $quiz->time_limit,
                    'passing_score' => $quiz->passing_score ?? 70,
                ],
                'questions' => $questions,
                'examAttempt' => [
                    'id' => $attempt->id,
                    'started_at' => $attempt->started_at,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error loading quiz page: ' . $e->getMessage());
            return Inertia::render('User/Quiz/TakeQuiz', [
                'training' => ['id' => $trainingId],
                'quiz' => ['type' => $type],
                'questions' => [],
                'error' => 'Gagal memuat quiz: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get quiz details via API
     */
    public function show($trainingId, $type)
    {
        try {
            $user = Auth::user();

            // Validasi full access
            $validation = $this->validateFullQuizAccess($trainingId, $type, $user->id);
            if (isset($validation['success']) && !$validation['success']) {
                return response()->json($validation, 403);
            }

            $module = $validation['module'];
            $quiz = $validation['quiz'];

            // Get questions dengan normalized options
            $questions = Question::where('module_id', $trainingId)
                ->where('question_type', $type)
                ->inRandomOrder()
                ->limit($quiz->question_count ?? 5)
                ->get()
                ->map(function($q) {
                    return [
                        'id' => $q->id,
                        'question_text' => $q->question_text,
                        'options' => $q->normalized_options, // Gunakan accessor
                        'difficulty' => $q->difficulty,
                        'points' => $q->points,
                        'image_url' => $q->image_url,
                    ];
                });

            // Check for existing attempts
            $examType = $type === 'pretest' ? 'pre_test' : 'post_test';
            $lastAttempt = ExamAttempt::where('user_id', $user->id)
                ->where('module_id', $trainingId)
                ->where('exam_type', $examType)
                ->orderBy('created_at', 'desc')
                ->first();

            return response()->json([
                'success' => true,
                'training' => [
                    'id' => $module->id,
                    'title' => $module->title,
                    'description' => $module->description,
                ],
                'quiz' => [
                    'id' => $quiz->id,
                    'name' => $quiz->name,
                    'type' => $quiz->type,
                    'description' => $quiz->description,
                    'time_limit' => $quiz->time_limit,
                    'duration' => $quiz->time_limit,
                    'passing_score' => $quiz->passing_score ?? 70,
                    'question_count' => $questions->count(),
                    'questions_count' => $questions->count(),
                    'show_answers' => $quiz->show_answers ?? true
                ],
                'questions' => $questions,
                'lastAttempt' => $lastAttempt,
                'is_passed' => false,
                'score' => 0,
                'attempts' => 0
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching quiz: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to load quiz',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Normalize stored image references to a public URL.
     */
    private function normalizeImageUrl($imageUrl)
    {
        if (empty($imageUrl)) return null;

        // If already absolute URL, return as-is
        if (filter_var($imageUrl, FILTER_VALIDATE_URL)) {
            return $imageUrl;
        }

        // If starts with /storage, treat as public URL already
        if (str_starts_with($imageUrl, '/storage/')) {
            return $imageUrl;
        }

        // Strip leading public/ or storage/ if present
        $relative = preg_replace('#^public/#', '', ltrim($imageUrl, '/'));
        $relative = preg_replace('#^storage/#', '', $relative);

        try {
            /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
            $disk = Storage::disk('public');
            if ($disk->exists($relative)) {
                return $disk->url($relative);
            }
        } catch (\Exception $e) {
            Log::warning('normalizeImageUrl failed: ' . $e->getMessage());
        }

        // Fallback: return original value
        return $imageUrl;
    }

    /**
     * Start a quiz attempt
     */
    public function start($trainingId, $type)
    {
        try {
            $user = Auth::user();
            $examType = $type === 'pretest' ? 'pre_test' : 'post_test';

            // Validasi full access
            $validation = $this->validateFullQuizAccess($trainingId, $type, $user->id);
            if (isset($validation['success']) && !$validation['success']) {
                return response()->json($validation, 403);
            }

            $quiz = $validation['quiz'];

            // Cek attempt limit menggunakan service (configurable)
            $attemptLimitError = $this->quizService->validateAttemptLimit($user->id, $trainingId, $examType, $quiz);
            if ($attemptLimitError) {
                return response()->json($attemptLimitError, 403);
            }

            // Check if already has ongoing attempt
            $ongoingAttempt = ExamAttempt::where('user_id', $user->id)
                ->where('module_id', $trainingId)
                ->where('exam_type', $examType)
                ->whereNull('finished_at')
                ->first();

            if ($ongoingAttempt) {
                // Resume existing attempt
                return response()->json([
                    'success' => true,
                    'attempt' => [
                        'id' => $ongoingAttempt->id,
                        'started_at' => $ongoingAttempt->started_at,
                    ],
                    'message' => 'Resuming existing attempt'
                ]);
            }

            // Create new attempt
            $attempt = $this->quizService->getOrCreateAttempt($user->id, $trainingId, $examType);

            return response()->json([
                'success' => true,
                'attempt' => [
                    'id' => $attempt->id,
                    'started_at' => $attempt->started_at,
                ],
                'message' => 'New attempt created'
            ]);
        } catch (\Exception $e) {
            Log::error('Error starting quiz: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to start quiz',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Submit quiz answers
     * Delegasi scoring logic ke QuizService
     */
    public function submit(Request $request, $attemptId)
    {
        try {
            $user = Auth::user();
            
            $attempt = ExamAttempt::where('id', $attemptId)
                ->where('user_id', $user->id)
                ->firstOrFail();

            // Check if program is still accessible (not ended)
            $module = Module::find($attempt->module_id);
            if ($module && $module->end_date && now() > $module->end_date) {
                return response()->json([
                    'success' => false,
                    'error' => 'Program telah berakhir',
                    'message' => 'Program ini berakhir pada ' . $module->end_date->format('d M Y H:i') . '. Anda tidak dapat submit jawaban.'
                ], 403);
            }
            
            $answers = $request->input('answers', []);
            
            DB::beginTransaction();
            try {
                // Delegasi ke service - ini sudah fix N+1 query problem
                $result = $this->quizService->processSubmission($attempt, $answers);

                if (!$result['success']) {
                    DB::rollback();
                    return response()->json($result, 400);
                }

                // Handle post-test vs pre-test
                if ($attempt->exam_type === 'post_test') {
                    $this->quizService->handlePostTestResult($attempt, $result['is_passed']);
                } elseif ($attempt->exam_type === 'pre_test') {
                    $this->quizService->handlePreTestResult($attempt);
                }

                DB::commit();

                return response()->json($result);
                
            } catch (\Exception $e) {
                DB::rollback();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('Error submitting quiz: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to submit quiz',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Show quiz result page
     * NOTE: User dapat melihat hasil meskipun program sudah berakhir
     */
    public function showResult($trainingId, $type, $attemptId = null)
    {
        try {
            $user = Auth::user();
            $module = Module::findOrFail($trainingId);
            
            // Get attempt
            $examType = $type === 'pretest' ? 'pre_test' : 'post_test';
            
            if (!$attemptId) {
                // Get latest attempt
                $attempt = ExamAttempt::where('user_id', $user->id)
                    ->where('module_id', $trainingId)
                    ->where('exam_type', $examType)
                    ->whereNotNull('finished_at')
                    ->orderBy('finished_at', 'desc')
                    ->firstOrFail();
            } else {
                $attempt = ExamAttempt::where('id', $attemptId)
                    ->where('user_id', $user->id)
                    ->firstOrFail();
            }
            
            // Get user answers with questions
            $userAnswers = UserExamAnswer::where('exam_attempt_id', $attempt->id)
                ->with('question')
                ->get();
            
            // Format questions with full details
            $questions = $userAnswers->map(function($answer) {
                $question = $answer->question;
                $imageUrl = null;
                if ($question->image_url && Storage::disk('public')->exists(str_replace('/storage/', '', $question->image_url))) {
                    $imageUrl = $question->image_url;
                }
                
                return [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
                    'image_url' => $imageUrl,
                    'option_a' => $question->option_a,
                    'option_b' => $question->option_b,
                    'option_c' => $question->option_c,
                    'option_d' => $question->option_d,
                    'user_answer' => $answer->user_answer,
                    'correct_answer' => $answer->correct_answer,
                    'is_correct' => $answer->is_correct,
                    'explanation' => $question->explanation,
                    'difficulty' => $question->difficulty,
                    'points' => $question->points ?? 10,
                ];
            });
            
            // Find quiz
            $quiz = Quiz::where(function($query) use ($trainingId) {
                $query->where('module_id', $trainingId)
                      ->orWhere('training_program_id', $trainingId);
            })
                ->where('type', $type)
                ->first();
            
            // Calculate stats
            $correctCount = $userAnswers->where('is_correct', true)->count();
            $wrongCount = $userAnswers->where('is_correct', false)->count();
            
            // Check if program has ended
            $isProgramEnded = $module->end_date && now() > $module->end_date;
            $programEndMessage = $isProgramEnded ? 'Program telah berakhir pada ' . $module->end_date->format('d M Y H:i') . ', tetapi Anda masih dapat melihat hasil Anda.' : null;
            
            // Format time spent properly
            // Default to 00:00 instead of '-' so UI can display 0s rather than '-'
            $timeSpent = '00:00';
            if ($attempt->started_at && $attempt->finished_at) {
                $diffInSeconds = $attempt->finished_at->diffInSeconds($attempt->started_at);
                $minutes = floor($diffInSeconds / 60);
                $seconds = $diffInSeconds % 60;
                $timeSpent = sprintf('%02d:%02d', $minutes, $seconds);
            } elseif (isset($attempt->duration_minutes) && $attempt->duration_minutes !== null) {
                $minutes = floor($attempt->duration_minutes);
                $seconds = round(($attempt->duration_minutes - $minutes) * 60);
                $timeSpent = sprintf('%02d:%02d', $minutes, $seconds);
            }
            
            return Inertia::render('User/Quiz/QuizResult', [
                'training' => [
                    'id' => $module->id,
                    'title' => $module->title,
                    'description' => $module->description,
                ],
                'quiz' => [
                    'id' => $quiz ? $quiz->id : null,
                    'type' => $type,
                    'passing_score' => $quiz ? ($quiz->passing_score ?? 70) : 70,
                    'show_review' => $quiz ? ($quiz->show_answers ?? true) : true,
                    'allow_retake' => true,
                ],
                'result' => [
                    'score' => $attempt->percentage,
                    'percentage' => $attempt->percentage,
                    'correct_count' => $correctCount,
                    'wrong_count' => $wrongCount,
                    'time_spent' => $timeSpent,
                    'started_at' => $attempt->started_at?->toISOString(),
                    'finished_at' => $attempt->finished_at?->toISOString(),
                    'is_passed' => $attempt->is_passed,
                    'points_earned' => $attempt->score,
                ],
                'questions' => $questions,
                'program_end_message' => $programEndMessage,
            ]);
        } catch (\Exception $e) {
            Log::error('Error showing quiz result: ' . $e->getMessage());
            return redirect()->route('user.trainings.show', $trainingId)
                ->with('error', 'Gagal memuat hasil quiz');
        }
    }
    
    /**
     * Get quiz result via API
     */
    public function result($attemptId)
    {
        try {
            $user = Auth::user();
            
            $attempt = ExamAttempt::with(['module', 'answers.question'])
                ->where('id', $attemptId)
                ->where('user_id', $user->id)
                ->firstOrFail();
            
            // Format questions with user answers
            $questions = $attempt->answers->map(function($answer) {
                $question = $answer->question;
                $imageUrl = null;
                if ($question->image_url && Storage::disk('public')->exists(str_replace('/storage/', '', $question->image_url))) {
                    $imageUrl = $question->image_url;
                }
                
                return [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
                    'image_url' => $imageUrl,
                    'user_answer' => $answer->answer_text,
                    'correct_answer' => $question->correct_answer,
                    'is_correct' => $answer->is_correct,
                    'points' => $question->points ?? 10,
                    'points_earned' => $answer->points_earned
                ];
            });
            
            // Find quiz
            $quiz = Quiz::where(function($query) use ($attempt) {
                $query->where('module_id', $attempt->module_id)
                      ->orWhere('training_program_id', $attempt->module_id);
            })
                ->where('type', $attempt->exam_type)
                ->first();
            
            $module = $attempt->module;
            
            return response()->json([
                'success' => true,
                'training' => [
                    'id' => $module->id,
                    'title' => $module->title,
                    'description' => $module->description,
                ],
                'quiz' => [
                    'id' => $quiz ? $quiz->id : null,
                    'type' => $attempt->exam_type,
                    'passing_score' => $quiz ? ($quiz->passing_score ?? 70) : 70,
                    'show_review' => $quiz ? ($quiz->show_answers ?? true) : true
                ],
                'result' => [
                    'score' => $attempt->score,
                    'percentage' => $attempt->percentage,
                    'duration_minutes' => $attempt->duration_minutes,
                    'is_passed' => $attempt->is_passed
                ],
                'questions' => $questions
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching quiz result: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to load quiz result',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
