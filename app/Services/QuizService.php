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
     * ============================================
     * LOGIC SEMPURNA - ANTI CHEAT & AKURAT
     * ============================================
     * 
     * Filosofi: Nilai didasarkan pada TOTAL SOAL DI DATABASE, bukan jawaban yang dikirim
     * 
     * Formula Sempurna:
     * Nilai Akhir = (Jumlah Jawaban Benar / TOTAL SOAL DI DATABASE) × 100
     * 
     * Skenario Praktis:
     * - Ada 10 soal di bank
     * - User hanya menjawab 1 (benar) dan biarkan 9 kosong
     * - Logic Lama: 1/1 × 100 = 100% (LULUS CURANG) ❌
     * - Logic Baru: 1/10 × 100 = 10% (GAGAL TELAK) ✅
     * 
     * Keuntungan:
     * ✓ Anti-cheat: Tidak bisa curang dengan hanya menjawab 1 soal
     * ✓ Akurat: Soal kosong otomatis dihitung SALAH
     * ✓ Fleksibel: Soal acak (random order) tetap adil
     * ✓ Konsisten: Untuk semua user dan semua ujian
     * 
     * @param ExamAttempt $attempt - Database exam attempt record
     * @param array $answers - Frontend answer format: [['question_id' => 1, 'answer' => 'A'], ...]
     * @return array - ['success' => true, 'percentage' => 85, 'is_passed' => true, ...]
     */
    public function processSubmission(ExamAttempt $attempt, array $answers)
    {
        try {
            // ============================================
            // STEP 1: AMBIL TOTAL SOAL SEBENARNYA DARI DATABASE
            // KUNCI UTAMA ANTI-CHEAT
            // ============================================
            // Normalize exam type: convert pre_test -> pretest, post_test -> posttest
            $normalizedExamType = str_replace('_', '', $attempt->exam_type);
            
            $allModuleQuestions = Question::where('module_id', $attempt->module_id)
                ->where('question_type', $normalizedExamType) // Pastikan tipe soal sama (pre/post)
                ->get();
            
            $totalQuestionsReal = $allModuleQuestions->count();

            // Validasi: Jika bank soal kosong (Edge Case)
            if ($totalQuestionsReal === 0) {
                return [
                    'success' => false,
                    'error' => 'Data soal tidak ditemukan di sistem.',
                    'message' => "Module {$attempt->module_id} tidak memiliki soal jenis {$attempt->exam_type}. Hubungi admin untuk menambahkan soal."
                ];
            }

            // Jika tidak ada jawaban yang dikirim, treat sebagai 0 jawaban benar
            if (empty($answers)) {
                $correctCount = 0;
            } else {
                // ============================================
                // STEP 2: MAPPING JAWABAN (Ubah jadi Key-Value)
                // Ini membuat pencarian jawaban lebih cepat O(1)
                // ============================================
                $userAnswersMap = collect($answers)->pluck('answer', 'question_id');
                
                $correctCount = 0;

                // ============================================
                // STEP 3: LOOPING BERDASARKAN SOAL DI DATABASE
                // BUKAN BERDASARKAN JAWABAN USER
                // Ini memastikan soal yang TIDAK dijawab tetap terhitung SALAH
                // ============================================
                foreach ($allModuleQuestions as $question) {
                    
                    // Cek apakah user menjawab soal ini?
                    $userAnswerChar = isset($userAnswersMap[$question->id]) 
                        ? strtoupper($userAnswersMap[$question->id]) 
                        : null; // Null jika tidak dijawab (skip)

                    $correctAnswer = strtoupper($question->correct_answer);
                    
                    // Logic Penilaian Per Soal
                    $isCorrect = ($userAnswerChar === $correctAnswer);

                    if ($isCorrect) {
                        $correctCount++;
                    }

                    // Simpan detail jawaban ke database (History)
                    // Kita tetap simpan meskipun user tidak menjawab
                    $attempt->answers()->updateOrCreate(
                        ['question_id' => $question->id],
                        [
                            'user_id' => $attempt->user_id,
                            'user_answer' => $userAnswerChar,
                            'correct_answer' => $correctAnswer,
                            'is_correct' => $isCorrect
                        ]
                    );
                }
            }

            // ============================================
            // STEP 4: HITUNG SKOR AKHIR (THE PERFECT FORMULA)
            // ============================================
            $percentage = round(($correctCount / $totalQuestionsReal) * 100, 2);

            // ============================================
            // STEP 5: TENTUKAN KELULUSAN
            // Ambil dari: Quiz Setting -> Config Global -> Default 70
            // ============================================
            $quiz = $this->getQuizForAttempt($attempt);
            
            // Prioritas: Setting di Quiz DB -> Config Global -> Default 70
            $passingScore = $quiz 
                ? ($quiz->passing_score ?? config('quiz.passing_score', 70)) 
                : config('quiz.passing_score', 70);
            
            $isPassed = $percentage >= $passingScore;

            // ============================================
            // STEP 6: HITUNG DURASI DENGAN AKURASI TINGGI
            // ============================================
            // Set finished_at explicitly saat ini jika belum ada
            if (!$attempt->finished_at) {
                $attempt->finished_at = now();
            }
            
            // Hitung durasi dari started_at ke finished_at dengan akurasi seconds
            // NOTE: Carbon diffInSeconds() menghitung dari argument ke current,
            // jadi kita hitung: finished_timestamp - started_timestamp
            $durationSeconds = max(0, $attempt->finished_at->getTimestamp() - $attempt->started_at->getTimestamp());
            $durationMinutes = $durationSeconds / 60; // Simpan sebagai desimal untuk presisi

            // ============================================
            // STEP 7: UPDATE DATA ATTEMPT
            // ============================================
            $attempt->update([
                'finished_at' => now(),
                'score' => $percentage, // Samakan score dan percentage agar konsisten
                'percentage' => $percentage,
                'is_passed' => $isPassed,
                'duration_minutes' => $durationMinutes
            ]);

            // ============================================
            // STEP 8: RETURN HASIL DENGAN INFO LENGKAP
            // ============================================
            return [
                'success' => true,
                'attempt_id' => $attempt->id,
                'score' => $percentage,
                'percentage' => $percentage,
                'is_passed' => $isPassed,
                'correct_count' => $correctCount,
                'total_questions' => $totalQuestionsReal, // Info ke user: "Benar X dari Y soal"
                'duration_minutes' => $durationMinutes,
                'message' => $isPassed 
                    ? "Selamat! Anda berhasil menjawab {$correctCount} dari {$totalQuestionsReal} soal dengan benar. Nilai: {$percentage}%"
                    : "Maaf, Anda menjawab {$correctCount} dari {$totalQuestionsReal} soal dengan benar. Nilai: {$percentage}% (Belum mencapai KKM {$passingScore}%)"
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
                    ->whereIn('exam_type', ['pre_test', 'pretest'])  // Support both formats
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

    /**
     * =============================================
     * COMPREHENSIVE PROGRESS CALCULATION
     * =============================================
     * 
     * Menghitung progress SEMPURNA dengan 3 komponen:
     * 1. Materials Completion (40% weight)
     * 2. Pretest Score (30% weight)
     * 3. Posttest Score (30% weight)
     * 
     * Formula:
     * Total Progress = (Materials × 0.4) + (Pretest × 0.3) + (Posttest × 0.3)
     * 
     * @param int $userId
     * @param int $moduleId
     * @return array [
     *     'total_progress' => 65,
     *     'materials_progress' => 100,
     *     'pretest_progress' => 60,
     *     'posttest_progress' => 0,
     *     'breakdown' => [...]
     * ]
     */
    public function calculateComprehensiveProgress($userId, $moduleId)
    {
        try {
            $module = Module::find($moduleId);
            if (!$module) {
                return [
                    'total_progress' => 0,
                    'materials_progress' => 0,
                    'pretest_progress' => 0,
                    'posttest_progress' => 0,
                    'breakdown' => []
                ];
            }

            // ==========================================
            // 1. MATERIALS COMPLETION PROGRESS
            // ==========================================
            // Get all materials (legacy + training_materials)
            $legacyMaterials = [];
            $legacyId = 1;
            if ($module->video_url) $legacyMaterials[] = $legacyId++;
            if ($module->document_url) $legacyMaterials[] = $legacyId++;
            if ($module->presentation_url) $legacyMaterials[] = $legacyId++;

            $trainingMaterialIds = $module->trainingMaterials->pluck('id')->toArray();
            $allMaterialIds = array_merge($legacyMaterials, $trainingMaterialIds);

            $totalMaterials = count($allMaterialIds);
            $completedMaterials = 0;

            if ($totalMaterials > 0) {
                $completedMaterials = UserMaterialProgress::where('user_id', $userId)
                    ->whereIn('training_material_id', $allMaterialIds)
                    ->where('is_completed', true)
                    ->count();
            }

            $materialsProgress = $totalMaterials > 0 ? round(($completedMaterials / $totalMaterials) * 100) : 0;

            // ==========================================
            // 2. PRETEST PROGRESS
            // ==========================================
            $pretestAttempt = ExamAttempt::where('user_id', $userId)
                ->where('module_id', $moduleId)
                ->where(function($q) {
                    $q->where('exam_type', 'pre_test')
                      ->orWhere('exam_type', 'pretest');
                })
                ->where('finished_at', '!=', null)
                ->orderBy('finished_at', 'desc')
                ->first();

            $pretestProgress = 0;
            $pretestExists = false;
            $pretestPassed = false;
            $pretestScore = 0;

            if ($pretestAttempt) {
                $pretestExists = true;
                $pretestProgress = (int)$pretestAttempt->percentage ?? 0;
                $pretestPassed = $pretestAttempt->is_passed ?? false;
                $pretestScore = $pretestAttempt->score ?? 0;
            } else {
                // Check if pretest exists in database
                $pretestCount = Question::where('module_id', $moduleId)
                    ->where('question_type', 'pretest')
                    ->count();
                $pretestExists = $pretestCount > 0;
            }

            // ==========================================
            // 3. POSTTEST PROGRESS
            // ==========================================
            $posttestAttempt = ExamAttempt::where('user_id', $userId)
                ->where('module_id', $moduleId)
                ->where(function($q) {
                    $q->where('exam_type', 'post_test')
                      ->orWhere('exam_type', 'posttest');
                })
                ->where('finished_at', '!=', null)
                ->orderBy('finished_at', 'desc')
                ->first();

            $posttestProgress = 0;
            $posttestExists = false;
            $posttestPassed = false;
            $posttestScore = 0;

            if ($posttestAttempt) {
                $posttestExists = true;
                $posttestProgress = (int)$posttestAttempt->percentage ?? 0;
                $posttestPassed = $posttestAttempt->is_passed ?? false;
                $posttestScore = $posttestAttempt->score ?? 0;
            } else {
                // Check if posttest exists in database
                $posttestCount = Question::where('module_id', $moduleId)
                    ->where('question_type', 'posttest')
                    ->count();
                $posttestExists = $posttestCount > 0;
            }

            // ==========================================
            // 4. CALCULATE TOTAL PROGRESS
            // ==========================================
            // Weights: Materials 40%, Pretest 30%, Posttest 30%
            $materialsWeight = 0.40;
            $pretestWeight = 0.30;
            $posttestWeight = 0.30;

            $totalProgress = 0;

            // Always include materials (always required)
            $totalProgress += $materialsProgress * $materialsWeight;

            // Include pretest if exists
            if ($pretestExists) {
                $totalProgress += $pretestProgress * $pretestWeight;
            } else {
                // If pretest doesn't exist, redistribute its weight to materials & posttest
                $totalProgress += $materialsProgress * ($pretestWeight * 0.5);
            }

            // Include posttest if exists
            if ($posttestExists) {
                $totalProgress += $posttestProgress * $posttestWeight;
            } else {
                // If posttest doesn't exist, redistribute its weight to materials
                $totalProgress += $materialsProgress * ($posttestWeight * 0.5);
            }

            $totalProgress = round($totalProgress);

            return [
                'total_progress' => $totalProgress,
                'materials_progress' => $materialsProgress,
                'pretest_progress' => $pretestProgress,
                'posttest_progress' => $posttestProgress,
                'breakdown' => [
                    'materials' => [
                        'progress' => $materialsProgress,
                        'weight' => '40%',
                        'completed' => $completedMaterials,
                        'total' => $totalMaterials,
                        'status' => $materialsProgress === 100 ? 'completed' : ($materialsProgress > 0 ? 'in_progress' : 'not_started')
                    ],
                    'pretest' => [
                        'progress' => $pretestProgress,
                        'weight' => '30%',
                        'exists' => $pretestExists,
                        'passed' => $pretestPassed,
                        'score' => $pretestScore,
                        'status' => !$pretestExists ? 'not_applicable' : ($pretestAttempt ? 'completed' : 'not_started')
                    ],
                    'posttest' => [
                        'progress' => $posttestProgress,
                        'weight' => '30%',
                        'exists' => $posttestExists,
                        'passed' => $posttestPassed,
                        'score' => $posttestScore,
                        'status' => !$posttestExists ? 'not_applicable' : ($posttestAttempt ? 'completed' : 'not_started')
                    ]
                ]
            ];

        } catch (\Exception $e) {
            Log::error('Error calculating comprehensive progress: ' . $e->getMessage());
            return [
                'total_progress' => 0,
                'materials_progress' => 0,
                'pretest_progress' => 0,
                'posttest_progress' => 0,
                'breakdown' => []
            ];
        }
    }
}

