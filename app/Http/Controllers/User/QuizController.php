<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\Question;
use App\Models\ExamAttempt;
use App\Models\ExamAnswer;
use App\Models\TrainingProgram;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class QuizController extends Controller
{
    /**
     * Get quiz details
     */
    public function show($trainingId, $type)
    {
        $user = Auth::user();
        
        $training = TrainingProgram::findOrFail($trainingId);
        
        // Find quiz by type (pretest/posttest)
        $quiz = Quiz::where('training_program_id', $trainingId)
            ->where('type', $type)
            ->first();
        
        if (!$quiz) {
            return response()->json([
                'error' => 'Quiz not found'
            ], 404);
        }
        
        // Get questions without correct answers
        $questions = Question::where('quiz_id', $quiz->id)
            ->select(['id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'difficulty', 'points', 'image_url'])
            ->inRandomOrder()
            ->get();
        
        // Check for existing attempts
        $lastAttempt = ExamAttempt::where('user_id', $user->id)
            ->where('quiz_id', $quiz->id)
            ->orderBy('created_at', 'desc')
            ->first();
        
        return response()->json([
            'training' => $training,
            'quiz' => $quiz,
            'questions' => $questions,
            'lastAttempt' => $lastAttempt
        ]);
    }
    
    /**
     * Start a quiz attempt
     */
    public function start($trainingId, $type)
    {
        $user = Auth::user();
        
        $quiz = Quiz::where('training_program_id', $trainingId)
            ->where('type', $type)
            ->firstOrFail();
        
        // Check if already has an ongoing attempt
        $ongoingAttempt = ExamAttempt::where('user_id', $user->id)
            ->where('quiz_id', $quiz->id)
            ->whereNull('submitted_at')
            ->first();
        
        if ($ongoingAttempt) {
            return response()->json([
                'attempt' => $ongoingAttempt,
                'message' => 'Resuming existing attempt'
            ]);
        }
        
        // Create new attempt
        $attempt = ExamAttempt::create([
            'user_id' => $user->id,
            'quiz_id' => $quiz->id,
            'training_program_id' => $trainingId,
            'started_at' => now(),
            'status' => 'in_progress'
        ]);
        
        return response()->json([
            'attempt' => $attempt,
            'message' => 'New attempt created'
        ]);
    }
    
    /**
     * Submit quiz answers
     */
    public function submit(Request $request, $attemptId)
    {
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
                
                $isCorrect = strtolower($answerData['answer']) === strtolower($question->correct_answer);
                $pointsEarned = $isCorrect ? ($question->points ?? 10) : 0;
                
                // Save answer
                ExamAnswer::create([
                    'exam_attempt_id' => $attempt->id,
                    'question_id' => $question->id,
                    'answer' => $answerData['answer'],
                    'is_correct' => $isCorrect,
                    'points_earned' => $pointsEarned
                ]);
                
                if ($isCorrect) {
                    $correctCount++;
                }
                $totalPoints += $question->points ?? 10;
                $totalScore += $pointsEarned;
            }
            
            // Calculate percentage score
            $score = $totalPoints > 0 ? round(($totalScore / $totalPoints) * 100) : 0;
            
            // Update attempt
            $quiz = Quiz::find($attempt->quiz_id);
            $isPassed = $score >= ($quiz->passing_score ?? 70);
            
            $attempt->update([
                'submitted_at' => now(),
                'score' => $score,
                'correct_count' => $correctCount,
                'wrong_count' => count($answers) - $correctCount,
                'status' => $isPassed ? 'passed' : 'failed',
                'time_spent' => now()->diffInMinutes($attempt->started_at) . ' menit'
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'attempt_id' => $attempt->id,
                'score' => $score,
                'is_passed' => $isPassed,
                'correct_count' => $correctCount,
                'total_questions' => count($answers)
            ]);
            
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'error' => 'Failed to submit quiz',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get quiz result
     */
    public function result($attemptId)
    {
        $user = Auth::user();
        
        $attempt = ExamAttempt::with(['quiz', 'answers.question'])
            ->where('id', $attemptId)
            ->where('user_id', $user->id)
            ->firstOrFail();
        
        // Format questions with user answers
        $questions = $attempt->answers->map(function($answer) {
            $question = $answer->question;
            return [
                'id' => $question->id,
                'question_text' => $question->question_text,
                'user_answer' => $answer->answer,
                'correct_answer' => $question->correct_answer,
                'is_correct' => $answer->is_correct,
                'points' => $question->points ?? 10,
                'points_earned' => $answer->points_earned
            ];
        });
        
        $quiz = $attempt->quiz;
        $training = TrainingProgram::find($quiz->training_program_id);
        
        return response()->json([
            'training' => $training,
            'quiz' => [
                'id' => $quiz->id,
                'type' => $quiz->type,
                'passing_score' => $quiz->passing_score ?? 70,
                'show_review' => $quiz->show_answers ?? true,
                'allow_retake' => $quiz->allow_retake ?? true
            ],
            'result' => [
                'score' => $attempt->score,
                'correct_count' => $attempt->correct_count,
                'wrong_count' => $attempt->wrong_count,
                'time_spent' => $attempt->time_spent,
                'points_earned' => $attempt->score * 10,
                'is_passed' => $attempt->status === 'passed'
            ],
            'questions' => $questions
        ]);
    }
}
