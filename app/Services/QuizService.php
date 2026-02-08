<?php

namespace App\Services;

use App\Models\ExamAttempt;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\UserMaterialProgress;
use App\Models\UserTraining;
use App\Models\Certificate;
use App\Models\Module;
use App\Jobs\GenerateCertificateJob;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * QuizService
 * Menangani business logic ujian: scoring, certification, progress tracking
 * Memisahkan logic kompleks dari controller agar lebih mudah di-test dan di-maintain
 */
class QuizService
{
    /**
     * Process quiz submission dan hitung skor dengan logic yang sempurna
     * 
     * Logic Scoring Sempurna:
     * 1. Jika hanya 1 soal dan jawaban BENAR → 100%
     * 2. Jika hanya 1 soal dan jawaban SALAH → 0%
     * 3. Jika multiple soal → (correct_answers / total_questions) * 100
     * 4. Score berdasarkan points dari setiap soal (jika ada)
     * 
     * @param ExamAttempt $attempt
     * @param array $answers - Format: [['question_id' => 1, 'answer' => 'A'], ...]
     * @return array - ['success' => true, 'score' => 85, 'percentage' => 85, 'is_passed' => true, ...]
     */
    public function processSubmission(ExamAttempt $attempt, array $answers)
    {
        try {
            // Validasi: pastikan ada jawaban yang dikirim
            if (empty($answers)) {
                return [
                    'success' => false,
                    'error' => 'Tidak ada jawaban yang dikirim'
                ];
            }

            // Ambil soal yang dijawab untuk grading
            $questionIds = collect($answers)->pluck('question_id')->unique()->toArray();
            $answeredQuestions = Question::whereIn('id', $questionIds)->get()->keyBy('id');
            
            // Get semua soal di module untuk konteks
            $allQuestions = Question::where('module_id', $attempt->module_id)->get();
            $totalQuestionsInModule = $allQuestions->count();

            $totalScore = 0;
            $correctCount = 0;
            $totalPoints = 0;
            $answeredCount = count($answers);

            // Grade setiap jawaban yang dikirim user
            foreach ($answers as $answerData) {
                $question = $answeredQuestions->get($answerData['question_id']);
                
                if (!$question) continue;

                $userAnswer = strtoupper($answerData['answer']);
                $correctAnswer = strtoupper($question->correct_answer);
                $isCorrect = $userAnswer === $correctAnswer;
                
                // Points per soal (default 10 jika tidak ditentukan)
                $questionPoints = $question->points ?? 10;
                $pointsEarned = $isCorrect ? $questionPoints : 0;

                // Simpan user answer
                $attempt->answers()->create([
                    'user_id' => $attempt->user_id,
                    'question_id' => $question->id,
                    'user_answer' => $userAnswer,
                    'correct_answer' => $correctAnswer,
                    'is_correct' => $isCorrect
                ]);

                if ($isCorrect) {
                    $correctCount++;
                }
                
                $totalPoints += $questionPoints;
                $totalScore += $pointsEarned;
            }

            // ============================================
            // LOGIC SCORING SEMPURNA
            // ============================================
            
            // Hitung persentase berdasarkan jawaban yang dikirim (answered questions)
            // BUKAN total semua soal di modul
            if ($answeredCount === 1 && $correctCount === 1) {
                // Jika hanya 1 soal dan BENAR → 100%
                $percentage = 100;
            } elseif ($answeredCount === 1 && $correctCount === 0) {
                // Jika hanya 1 soal dan SALAH → 0%
                $percentage = 0;
            } elseif ($answeredCount > 1) {
                // Jika multiple soal: (correct / total) * 100
                $percentage = round(($correctCount / $answeredCount) * 100, 2);
            } else {
                // Edge case (seharusnya tidak terjadi)
                $percentage = 0;
            }

            // Alternative calculation: berdasarkan points (jika points dari soal meaningful)
            // Uncomment ini jika ingin scoring berbasis points
            /*
            if ($totalPoints > 0) {
                $percentage = round(($totalScore / $totalPoints) * 100, 2);
            } else {
                $percentage = 0;
            }
            */

            // Get passing score dari quiz
            $quiz = $this->getQuizForAttempt($attempt);
            $passingScore = $quiz ? ($quiz->passing_score ?? 70) : 70;
            $isPassed = $percentage >= $passingScore;

            // Hitung durasi
            $durationMinutes = now()->diffInMinutes($attempt->started_at);

            // Update attempt dengan hasil
            $attempt->update([
                'finished_at' => now(),
                'score' => $totalScore,
                'percentage' => $percentage,
                'is_passed' => $isPassed,
                'duration_minutes' => $durationMinutes
            ]);

            return [
                'success' => true,
                'attempt_id' => $attempt->id,
                'score' => $totalScore,
                'percentage' => $percentage,
                'is_passed' => $isPassed,
                'correct_count' => $correctCount,
                'total_questions' => $answeredCount,
                'duration_minutes' => $durationMinutes,
                'message' => "Quiz selesai. Anda menjawab {$correctCount} dari {$answeredCount} soal dengan benar. Nilai: {$percentage}%"
            ];

        } catch (\Exception $e) {
            Log::error('Error in processSubmission: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Handle post-test result dan update training status
     * Termasuk: generate certificate, update progress, handle retake logic
     */
    public function handlePostTestResult(ExamAttempt $attempt, bool $isPassed)
    {
        try {
            $userTraining = UserTraining::where('user_id', $attempt->user_id)
                ->where('module_id', $attempt->module_id)
                ->first();

            if (!$userTraining) {
                return false;
            }

            if ($isPassed) {
                // User LULUS
                $userTraining->update([
                    'status' => 'completed',
                    'final_score' => $attempt->percentage,
                    'completed_at' => now()
                ]);

                // Cek apakah eligible untuk certificate
                if ($this->isEligibleForCertificate($attempt->user_id, $attempt->module_id)) {
                    $this->generateCertificateIfNotExists($attempt->user_id, $attempt->module_id, $userTraining);
                } else {
                    $userTraining->update(['is_certified' => false]);
                }
            } else {
                // User TIDAK LULUS - allow retake
                $userTraining->update([
                    'status' => 'in_progress',
                    'final_score' => $attempt->percentage,
                    'is_certified' => false
                ]);
            }

            return true;

        } catch (\Exception $e) {
            Log::error('Error in handlePostTestResult: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Handle pre-test result
     * Pre-test hanya untuk assess, tidak mempengaruhi completion
     */
    public function handlePreTestResult(ExamAttempt $attempt)
    {
        try {
            $userTraining = UserTraining::where('user_id', $attempt->user_id)
                ->where('module_id', $attempt->module_id)
                ->first();

            if ($userTraining && $userTraining->status === 'enrolled') {
                // Update status ke in_progress setelah pretest
                $userTraining->update(['status' => 'in_progress']);
            }

            return true;

        } catch (\Exception $e) {
            Log::error('Error in handlePreTestResult: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Cek apakah user eligible untuk certificate
     * Requirements: 
     * 1. Semua materials completed
     * 2. Pretest passed (jika ada)
     */
    protected function isEligibleForCertificate($userId, $moduleId)
    {
        try {
            $module = Module::with(['trainingMaterials', 'questions'])->find($moduleId);

            // Cek semua materials completed
            $materialsTotal = $module->trainingMaterials->count();
            $completedMaterials = UserMaterialProgress::where('user_id', $userId)
                ->whereIn('training_material_id', $module->trainingMaterials->pluck('id')->toArray())
                ->where('is_completed', true)
                ->count();

            $allMaterialsDone = $materialsTotal === $completedMaterials;

            // Cek pretest passed (jika ada)
            $pretestCount = $module->questions->where('question_type', 'pretest')->count();
            $pretestPassed = true;
            
            if ($pretestCount > 0) {
                $pretestPassed = ExamAttempt::where('user_id', $userId)
                    ->where('module_id', $moduleId)
                    ->where('exam_type', 'pre_test')
                    ->where('is_passed', true)
                    ->exists();
            }

            return $allMaterialsDone && $pretestPassed;

        } catch (\Exception $e) {
            Log::error('Error in isEligibleForCertificate: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Generate certificate untuk user (jika belum ada)
     * Menggunakan Queue job agar async dan tidak memblokir user
     */
    protected function generateCertificateIfNotExists($userId, $moduleId, $userTraining)
    {
        try {
            $existingCert = Certificate::where('user_id', $userId)
                ->where('module_id', $moduleId)
                ->first();

            if (!$existingCert) {
                // Dispatch ke queue (async - non-blocking)
                GenerateCertificateJob::dispatch($userId, $moduleId);
                
                // Update user training dengan interim status
                $userTraining->update(['is_certified' => false]);
                
                Log::info('Certificate generation job queued', [
                    'user_id' => $userId,
                    'module_id' => $moduleId
                ]);
            } else {
                $userTraining->update(['is_certified' => true]);
            }

        } catch (\Exception $e) {
            Log::error('Error queueing certificate generation: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get quiz untuk attempt
     */
    protected function getQuizForAttempt(ExamAttempt $attempt)
    {
        return Quiz::where(function($query) use ($attempt) {
            $query->where('module_id', $attempt->module_id)
                  ->orWhere('training_program_id', $attempt->module_id);
        })
            ->where('type', $attempt->exam_type)
            ->first();
    }

    /**
     * Get max attempts untuk quiz type
     * Diambil dari config, fallback ke database column, fallback ke hardcoded
     */
    public function getMaxAttempts(?Quiz $quiz = null)
    {
        // Cek dari config dulu (highest priority)
        if (config('quiz.max_attempts')) {
            return config('quiz.max_attempts');
        }

        // Cek dari database column jika ada di quiz
        if ($quiz && isset($quiz->max_attempts) && $quiz->max_attempts !== null) {
            return $quiz->max_attempts;
        }

        // Fallback ke hardcoded default
        return 3;
    }

    /**
     * Validasi attempt limit
     */
    public function validateAttemptLimit($userId, $moduleId, $examType, ?Quiz $quiz = null)
    {
        $maxAttempts = $this->getMaxAttempts($quiz);
        
        $existingAttempts = ExamAttempt::where('user_id', $userId)
            ->where('module_id', $moduleId)
            ->where('exam_type', $examType)
            ->count();

        if ($existingAttempts >= $maxAttempts) {
            return [
                'success' => false,
                'error' => 'Anda telah mencapai batas maksimal percobaan (' . $maxAttempts . ' kali) untuk quiz ini'
            ];
        }

        return null;
    }

    /**
     * Get atau buat exam attempt baru
     */
    public function getOrCreateAttempt($userId, $moduleId, $examType)
    {
        return ExamAttempt::firstOrCreate([
            'user_id' => $userId,
            'module_id' => $moduleId,
            'exam_type' => $examType,
            'finished_at' => null,
        ], [
            'score' => 0,
            'percentage' => 0,
            'is_passed' => false,
            'started_at' => now()
        ]);
    }
}
