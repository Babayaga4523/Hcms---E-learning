<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\Question;
use App\Models\ExamAttempt;
use App\Models\UserExamAnswer;
use App\Models\Module;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class QuizController extends Controller
{
    /**
     * Render quiz page with questions
     */
    public function take($trainingId, $type)
    {
        try {
            $user = Auth::user();

            $module = Module::findOrFail($trainingId);

            // Check if user is assigned to this training
            $userTraining = \App\Models\UserTraining::where('user_id', $user->id)
                ->where('module_id', $trainingId)
                ->first();

            if (!$userTraining) {
                return Inertia::render('User/Quiz/TakeQuiz', [
                    'training' => [
                        'id' => $module->id,
                        'title' => $module->title,
                    ],
                    'quiz' => [
                        'type' => $type,
                    ],
                    'questions' => [],
                    'error' => 'You are not assigned to this training'
                ]);
            }

            // Find quiz
            $quiz = Quiz::where(function($query) use ($trainingId) {
                $query->where('module_id', $trainingId)
                      ->orWhere('training_program_id', $trainingId);
            })
                ->where('type', $type)
                ->where('is_active', true)
                ->first();
            
            if (!$quiz) {
                return Inertia::render('User/Quiz/TakeQuiz', [
                    'training' => [
                        'id' => $module->id,
                        'title' => $module->title,
                    ],
                    'quiz' => [
                        'type' => $type,
                    ],
                    'questions' => [],
                    'error' => 'Quiz tidak tersedia'
                ]);
            }
            
            // Get questions from module
            $questions = Question::where('module_id', $trainingId)
                ->where('question_type', $type)
                ->select(['id', 'question_text', 'options', 'difficulty', 'points', 'image_url'])
                ->inRandomOrder()
                ->limit($quiz->question_count ?? 5)
                ->get()
                ->map(function($q) {
                    // Normalize options: prefer JSON 'options', fallback to legacy fields if present
                    $opts = [];
                    if ($q->options) {
                        $opts = is_string($q->options) ? json_decode($q->options, true) : $q->options;
                        if ($opts instanceof \Illuminate\Support\Collection) {
                            $opts = $opts->toArray();
                        }
                    }
                    if (!$opts || !is_array($opts) || count($opts) === 0) {
                        // Legacy fallback: attempt to read option_a..d if available
                        $opts = [];
                        foreach (['a','b','c','d'] as $label) {
                            $field = 'option_' . $label;
                            if (isset($q->$field)) {
                                $opts[] = ['label' => $label, 'text' => $q->$field];
                            }
                        }
                    }

                    // Shuffle options within each question for additional security
                    shuffle($opts);

                    return [
                        'id' => $q->id,
                        'question_text' => $q->question_text,
                        'options' => $opts,
                        'difficulty' => $q->difficulty,
                        'points' => $q->points,
                        'image_url' => $q->image_url,
                    ];
                });
            
            // Create or get existing attempt
            $examType = $type === 'pretest' ? 'pre_test' : 'post_test'; // Convert to database format
            
            $attempt = ExamAttempt::firstOrCreate([
                'user_id' => $user->id,
                'module_id' => $trainingId,
                'exam_type' => $examType,
                'finished_at' => null, // Only unfinished attempts
            ], [
                'score' => 0,
                'percentage' => 0,
                'is_passed' => false,
                'started_at' => now()
            ]);
            
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
     * Get quiz details
     */
    public function show($trainingId, $type)
    {
        try {
            $user = Auth::user();

            $module = Module::findOrFail($trainingId);

            // Check if user is assigned to this training
            $userTraining = \App\Models\UserTraining::where('user_id', $user->id)
                ->where('module_id', $trainingId)
                ->first();

            if (!$userTraining) {
                return response()->json([
                    'success' => false,
                    'error' => 'You are not assigned to this training'
                ], 403);
            }

            // Find quiz by type (pretest/posttest)
            // Try module_id first, then training_program_id (legacy support)
            $quiz = Quiz::where(function($query) use ($trainingId) {
                $query->where('module_id', $trainingId)
                      ->orWhere('training_program_id', $trainingId);
            })
                ->where('type', $type)
                ->where('is_active', true)
                ->first();
            
            if (!$quiz) {
                return response()->json([
                    'success' => false,
                    'error' => 'Quiz not found',
                    'message' => ucfirst($type) . ' quiz belum tersedia untuk training ini'
                ], 404);
            }
            
            // Get questions from module (not from quiz directly since questions table uses module_id)
            $questions = Question::where('module_id', $trainingId)
                ->where('question_type', $type)
                ->select(['id', 'question_text', 'options', 'difficulty', 'points', 'image_url'])
                ->inRandomOrder() // Shuffle questions for security
                ->limit($quiz->question_count ?? 5)
                ->get()
                ->map(function($q) {
                    $opts = [];
                    if ($q->options) {
                        $opts = is_string($q->options) ? json_decode($q->options, true) : $q->options;
                        if ($opts instanceof \Illuminate\Support\Collection) {
                            $opts = $opts->toArray();
                        }
                    }
                    if (!$opts || !is_array($opts) || count($opts) === 0) {
                        $opts = [];
                        foreach (['a','b','c','d'] as $label) {
                            $field = 'option_' . $label;
                            if (isset($q->$field)) {
                                $opts[] = ['label' => $label, 'text' => $q->$field];
                            }
                        }
                    }

                    // Shuffle options within each question for additional security
                    shuffle($opts);

                    return [
                        'id' => $q->id,
                        'question_text' => $q->question_text,
                        'options' => $opts,
                        'difficulty' => $q->difficulty,
                        'points' => $q->points,
                        'image_url' => $q->image_url,
                        // Intentionally exclude correct_answer for security
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
                    'duration' => $quiz->time_limit, // For frontend compatibility
                    'passing_score' => $quiz->passing_score ?? 70,
                    'question_count' => $questions->count(),
                    'questions_count' => $questions->count(), // For frontend compatibility
                    'show_answers' => $quiz->show_answers ?? true
                ],
                'questions' => $questions,
                'lastAttempt' => $lastAttempt,
                // Frontend expects these fields at root level
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
     * Start a quiz attempt
     */
    public function start($trainingId, $type)
    {
        try {
            $user = Auth::user();

            // Check if user is assigned to this training
            $userTraining = \App\Models\UserTraining::where('user_id', $user->id)
                ->where('module_id', $trainingId)
                ->first();

            if (!$userTraining) {
                return response()->json([
                    'success' => false,
                    'error' => 'You are not assigned to this training'
                ], 403);
            }

            // Find quiz by module_id or training_program_id (legacy support)
            $quiz = Quiz::where(function($query) use ($trainingId) {
                $query->where('module_id', $trainingId)
                      ->orWhere('training_program_id', $trainingId);
            })
                ->where('type', $type)
                ->where('is_active', true)
                ->firstOrFail();

            // Define exam type
            $examType = $type === 'pretest' ? 'pre_test' : 'post_test';

            // Check attempt limit (max 3 attempts per quiz type)
            $existingAttempts = ExamAttempt::where('user_id', $user->id)
                ->where('module_id', $trainingId)
                ->where('exam_type', $examType)
                ->count();

            if ($existingAttempts >= 3) {
                return response()->json([
                    'success' => false,
                    'error' => 'Anda telah mencapai batas maksimal percobaan (3 kali) untuk quiz ini'
                ], 403);
            }

            // Check if already has an ongoing attempt
            $ongoingAttempt = ExamAttempt::where('user_id', $user->id)
                ->where('module_id', $trainingId)
                ->where('exam_type', $examType)
                ->whereNull('finished_at')
                ->first();

            if ($ongoingAttempt) {
                // Cache quiz draft for this attempt
                $cacheKey = "quiz_draft_{$user->id}_{$trainingId}_{$type}_{$ongoingAttempt->id}";
                Cache::put($cacheKey, [
                    'attempt_id' => $ongoingAttempt->id,
                    'started_at' => $ongoingAttempt->started_at,
                    'time_limit' => $quiz->time_limit
                ], 3600); // Cache for 1 hour

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
            $attempt = ExamAttempt::create([
                'user_id' => $user->id,
                'module_id' => $trainingId,
                'exam_type' => $examType,
                'score' => 0,
                'percentage' => 0,
                'is_passed' => false,
                'started_at' => now()
            ]);

            // Cache quiz draft for new attempt
            $cacheKey = "quiz_draft_{$user->id}_{$trainingId}_{$type}_{$attempt->id}";
            Cache::put($cacheKey, [
                'attempt_id' => $attempt->id,
                'started_at' => $attempt->started_at,
                'time_limit' => $quiz->time_limit
            ], 3600); // Cache for 1 hour

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
     */
    public function submit(Request $request, $attemptId)
    {
        try {
            $user = Auth::user();
            
            $attempt = ExamAttempt::where('id', $attemptId)
                ->where('user_id', $user->id)
                ->firstOrFail();
            
            $answers = $request->input('answers', []);
            
            DB::beginTransaction();
            try {
                $totalScore = 0;
                $correctCount = 0;
                $totalPoints = 0;
                
                foreach ($answers as $answerData) {
                    $question = Question::find($answerData['question_id']);
                    
                    if (!$question) continue;
                    
                    $userAnswer = strtoupper($answerData['answer']);
                    $correctAnswer = strtoupper($question->correct_answer);
                    $isCorrect = $userAnswer === $correctAnswer;
                    $pointsEarned = $isCorrect ? ($question->points ?? 10) : 0;
                    
                    // Save answer using UserExamAnswer model
                    UserExamAnswer::create([
                        'exam_attempt_id' => $attempt->id,
                        'user_id' => $user->id,
                        'question_id' => $question->id,
                        'user_answer' => $userAnswer,
                        'correct_answer' => $correctAnswer,
                        'is_correct' => $isCorrect
                    ]);
                    
                    if ($isCorrect) {
                        $correctCount++;
                    }
                    $totalPoints += $question->points ?? 10;
                    $totalScore += $pointsEarned;
                }
                
                // Calculate percentage score
                $percentage = $totalPoints > 0 ? round(($totalScore / $totalPoints) * 100, 2) : 0;
                
                // Find quiz to get passing score
                $quiz = Quiz::where(function($query) use ($attempt) {
                    $query->where('module_id', $attempt->module_id)
                          ->orWhere('training_program_id', $attempt->module_id);
                })
                    ->where('type', $attempt->exam_type)
                    ->first();
                
                $passingScore = $quiz ? ($quiz->passing_score ?? 70) : 70;
                $isPassed = $percentage >= $passingScore;
                
                // Calculate duration
                $durationMinutes = now()->diffInMinutes($attempt->started_at);
                
                $attempt->update([
                    'finished_at' => now(),
                    'score' => $totalScore,
                    'percentage' => $percentage,
                    'is_passed' => $isPassed,
                    'duration_minutes' => $durationMinutes
                ]);
                
                // Handle post-test results
                if ($attempt->exam_type === 'post_test') {
                    $userTraining = \App\Models\UserTraining::where('user_id', $user->id)
                        ->where('module_id', $attempt->module_id)
                        ->first();
                    
                    if ($userTraining) {
                        if ($isPassed) {
                            // PASSED: Update status to completed and create certificate
                            $userTraining->update([
                                'status' => 'completed',
                                'final_score' => $percentage,
                                'is_certified' => true,
                                'completed_at' => now()
                            ]);
                            
                            // Create certificate if not exists
                            $existingCert = \App\Models\Certificate::where('user_id', $user->id)
                                ->where('module_id', $attempt->module_id)
                                ->first();
                            
                            if (!$existingCert) {
                                $certificate = \App\Models\Certificate::createForUser($user->id, $attempt->module_id);
                                if ($certificate) {
                                    $userTraining->update(['certificate_id' => $certificate->id]);
                                }
                            }
                        } else {
                            // FAILED: Keep status as in_progress, allow retake
                            // Update final_score to track latest attempt but don't complete
                            $userTraining->update([
                                'status' => 'in_progress',
                                'final_score' => $percentage, // Track latest score
                                'is_certified' => false
                            ]);
                        }
                    }
                }
                
                // Handle pre-test results (just track the score, don't affect status)
                if ($attempt->exam_type === 'pre_test') {
                    $userTraining = \App\Models\UserTraining::where('user_id', $user->id)
                        ->where('module_id', $attempt->module_id)
                        ->first();
                    
                    if ($userTraining && $userTraining->status === 'enrolled') {
                        // Update status to in_progress after completing pre-test
                        $userTraining->update([
                            'status' => 'in_progress'
                        ]);
                    }
                }
                
                DB::commit();
                
                return response()->json([
                    'success' => true,
                    'attempt_id' => $attempt->id,
                    'score' => $totalScore,
                    'percentage' => $percentage,
                    'is_passed' => $isPassed,
                    'correct_count' => $correctCount,
                    'total_questions' => count($answers)
                ]);
                
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
                return [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
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
            
            // Format time spent properly
            $timeSpent = '-';
            if ($attempt->started_at && $attempt->finished_at) {
                $diffInSeconds = $attempt->finished_at->diffInSeconds($attempt->started_at);
                $minutes = floor($diffInSeconds / 60);
                $seconds = $diffInSeconds % 60;
                $timeSpent = sprintf('%02d:%02d', $minutes, $seconds);
            } elseif ($attempt->duration_minutes) {
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
                return [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
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
