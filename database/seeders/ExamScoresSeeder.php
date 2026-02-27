<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ExamScoresSeeder extends Seeder
{
    /**
     * Run the database seeds - Add comprehensive exam scores and user answers
     */
    public function run(): void
    {
        echo "🌱 Starting Exam Scores Seeder...\n";

        // 1. Seed quiz data
        echo "📝 Creating quizzes for each module...\n";
        $this->seedQuizzes();

        // 2. Seed user exam answers with calculated scores
        echo "❓ Creating user exam answers...\n";
        $this->seedUserExamAnswers();

        // 3. Seed module progress
        echo "📈 Creating module progress data...\n";
        $this->seedModuleProgress();

        // 4. Seed certification data
        echo "🎖️ Creating certification data...\n";
        $this->seedCertifications();

        echo "\n✨ Exam scores seeding completed successfully!\n";
    }

    /**
     * Create quizzes for each module
     */
    private function seedQuizzes()
    {
        $modules = DB::table('modules')->get();
        $adminUser = DB::table('users')->where('role', 'admin')->first();

        foreach ($modules as $module) {
            // Create pre-test and post-test quizzes
            $quizTypes = ['pretest', 'posttest'];
            
            foreach ($quizTypes as $quizType) {
                DB::table('quizzes')->updateOrInsert(
                    [
                        'module_id' => $module->id,
                        'type' => $quizType,
                    ],
                    [
                        'name' => "{$module->title} - " . ($quizType === 'pretest' ? 'Pre-Test' : 'Post-Test'),
                        'title' => "{$module->title} - " . ($quizType === 'pretest' ? 'Pre-Test' : 'Post-Test'),
                        'description' => ($quizType === 'pretest' ? 'Pre-assessment' : 'Post-assessment') . " untuk {$module->title}",
                        'passing_score' => $module->passing_grade,
                        'time_limit' => rand(30, 60),
                        'show_answers' => true,
                        'is_active' => true,
                        'difficulty' => 'medium',
                        'question_count' => rand(5, 10),
                        'status' => 'published',
                        'quality_score' => 95,
                        'coverage_score' => 90,
                        'created_by' => $adminUser->id ?? 1,
                        'published_by' => $adminUser->id ?? 1,
                        'published_at' => now(),
                        'created_at' => now()->subDays(rand(5, 30)),
                        'updated_at' => now(),
                    ]
                );
            }
        }

        echo "  ✓ Created quizzes for all modules\n";
    }

    /**
     * Seed user exam answers - Connect to exam attempts
     */
    private function seedUserExamAnswers()
    {
        // Get exam attempts to create answers for
        $examAttempts = DB::table('exam_attempts')->limit(100)->get();
        $totalAnswers = 0;

        foreach ($examAttempts as $attempt) {
            // Get questions for this module
            $questions = DB::table('questions')
                ->where('module_id', $attempt->module_id)
                ->limit(rand(5, 10))
                ->get();

            $correctCount = 0;
            $totalQuestions = $questions->count();

            foreach ($questions as $question) {
                // Get correct answer from question
                $correctAnswer = DB::table('questions')
                    ->where('id', $question->id)
                    ->value('correct_answer');

                // 70% chance user answers correctly
                $isCorrect = rand(1, 100) <= 70 ? true : false;
                $userAnswer = $isCorrect ? $correctAnswer : chr(65 + rand(0, 3));

                if ($isCorrect) {
                    $correctCount++;
                }

                // Insert into user_exam_answers with exam_attempt_id reference
                DB::table('user_exam_answers')->insertOrIgnore([
                    'exam_attempt_id' => $attempt->id,
                    'user_id' => $attempt->user_id,
                    'question_id' => $question->id,
                    'user_answer' => $userAnswer,
                    'correct_answer' => $correctAnswer,
                    'is_correct' => $isCorrect,
                    'created_at' => $attempt->started_at ?? now(),
                    'updated_at' => now(),
                ]);

                $totalAnswers++;
            }

            // Update exam attempt score based on user answers
            if ($totalQuestions > 0) {
                $percentage = round(($correctCount / $totalQuestions) * 100, 2);
                $score = round(($correctCount / $totalQuestions) * 100);

                DB::table('exam_attempts')
                    ->where('id', $attempt->id)
                    ->update([
                        'score' => min($score, 100),
                        'percentage' => min($percentage, 100),
                        'is_passed' => ($percentage >= 70) ? true : false,
                    ]);
            }
        }

        echo "  ✓ Created $totalAnswers user exam answers\n";
    }

    /**
     * Seed module progress data
     */
    private function seedModuleProgress()
    {
        $userTrainings = DB::table('user_trainings')->limit(100)->get();
        $progressCount = 0;

        foreach ($userTrainings as $userTraining) {
            $totalQuestions = DB::table('questions')
                ->where('module_id', $userTraining->module_id)
                ->count();

            $answeredQuestions = DB::table('user_exam_answers')
                ->where('user_id', $userTraining->user_id)
                ->distinct('question_id')
                ->count();

            $progress = $totalQuestions > 0 
                ? min(round(($answeredQuestions / $totalQuestions) * 100), 100)
                : 0;

            // Determine status based on progress and user training status
            $status = 'locked';
            if ($userTraining->status === 'in_progress' || $progress > 0) {
                $status = 'in_progress';
            }
            if ($userTraining->status === 'completed' || $progress >= 100) {
                $status = 'completed';
            }

            DB::table('module_progress')->updateOrInsert(
                [
                    'user_id' => $userTraining->user_id,
                    'module_id' => $userTraining->module_id,
                ],
                [
                    'status' => $status,
                    'progress_percentage' => $progress,
                    'last_accessed_at' => now()->subDays(rand(0, 5)),
                    'created_at' => $userTraining->enrolled_at,
                    'updated_at' => now(),
                ]
            );

            $progressCount++;
        }

        echo "  ✓ Created module progress for $progressCount users\n";
    }

    /**
     * Seed certification data
     */
    private function seedCertifications()
    {
        $completedTrainings = DB::table('user_trainings')
            ->where('status', 'completed')
            ->where('is_certified', true)
            ->limit(30)
            ->get();

        $certificateCount = 0;

        foreach ($completedTrainings as $training) {
            // Check if certificate already exists
            $existingCert = DB::table('certificates')
                ->where('user_id', $training->user_id)
                ->where('module_id', $training->module_id)
                ->first();

            if (!$existingCert) {
                $completed_at = is_string($training->completed_at) 
                    ? Carbon::parse($training->completed_at)
                    : $training->completed_at;

                // Get user and module info
                $user = DB::table('users')->find($training->user_id);
                $module = DB::table('modules')->find($training->module_id);

                // Get last instructor name from audit logs or use admin
                $instructor = DB::table('users')
                    ->where('role', 'instructor')
                    ->first();

                // Calculate hours (default 20 hours per module)
                $hours = rand(15, 40);

                $certificateId = DB::table('certificates')->insertGetId([
                    'user_id' => $training->user_id,
                    'module_id' => $training->module_id,
                    'certificate_number' => 'CERT-' . strtoupper(uniqid()),
                    'user_name' => $user->name,
                    'training_title' => $module->title,
                    'score' => $training->final_score ?? rand(70, 100),
                    'materials_completed' => rand(8, 12),
                    'hours' => $hours,
                    'issued_at' => $completed_at,
                    'completed_at' => $completed_at,
                    'instructor_name' => $instructor->name ?? 'Admin Instructor',
                    'status' => 'active',
                    'metadata' => json_encode([
                        'completion_percentage' => 100,
                        'learning_path' => $module->title,
                        'issued_by' => 'HCMS Administrator'
                    ]),
                    'created_at' => $completed_at,
                    'updated_at' => now(),
                ]);

                // Update user_trainings with certificate
                DB::table('user_trainings')
                    ->where('id', $training->id)
                    ->update(['certificate_id' => $certificateId]);

                $certificateCount++;
            }
        }

        echo "  ✓ Created $certificateCount certificates\n";
    }
}
