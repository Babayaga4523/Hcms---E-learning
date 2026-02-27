<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Carbon\Carbon;

class AdminTestDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "🌱 Starting Admin Test Data Seeder...\n";

        // 1. Create test users with different roles
        echo "📝 Creating test users...\n";
        $this->seedUsers();

        // 2. Create modules (training programs)
        echo "📚 Creating modules (training programs)...\n";
        $this->seedModules();

        // 3. Create quiz questions
        echo "❓ Creating quiz questions...\n";
        $this->seedQuestions();

        // 4. Create user training enrollments
        echo "✅ Creating user training enrollments...\n";
        $this->seedUserTrainings();

        // 5. Create system settings
        echo "⚙️ Creating system settings...\n";
        $this->seedSystemSettings();

        // 6. Create audit logs
        echo "📋 Creating audit logs...\n";
        $this->seedAuditLogs();

        // 7. Create exam attempts
        echo "📊 Creating exam attempts...\n";
        $this->seedExamAttempts();

        echo "\n✨ Test data seeding completed successfully!\n";
        echo "📊 Admin user: admin@hcms.test (password: password)\n";
        echo "📊 Learner samples: learner1@hcms.test - learner50@hcms.test\n";
    }

    /**
     * Seed users with different roles and departments
     */
    private function seedUsers()
    {
        $departments = ['HR', 'IT', 'Sales', 'Marketing', 'Operations', 'Finance', 'Compliance'];
        
        // Admin user
        User::firstOrCreate(
            ['email' => 'admin@hcms.test'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
            ]
        );
        echo "  ✓ Created admin user: admin@hcms.test\n";

        // Instructor users
        for ($i = 1; $i <= 3; $i++) {
            User::firstOrCreate(
                ['email' => "instructor{$i}@hcms.test"],
                [
                    'name' => "Instructor {$i}",
                    'password' => Hash::make('password'),
                    'role' => 'instructor',
                    'status' => 'active',
                    'email_verified_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
        echo "  ✓ Created 3 instructor users\n";

        // Learner users with varied departments and statuses
        for ($i = 1; $i <= 50; $i++) {
            $department = $departments[array_rand($departments)];
            $status = ['active', 'inactive'][array_rand(['active', 'inactive'])];
            
            User::firstOrCreate(
                ['email' => "learner{$i}@hcms.test"],
                [
                    'name' => $this->generateRandomName(),
                    'password' => Hash::make('password'),
                    'role' => 'user', // Learners have 'user' role
                    'department' => $department,
                    'status' => $status,
                    'email_verified_at' => now(),
                    'created_at' => now()->subDays(rand(0, 90)),
                ]
            );
        }
        echo "  ✓ Created 50 learner users with departments\n";
    }

    /**
     * Seed modules (these are training programs)
     */
    private function seedModules()
    {
        $categories = [
            'Core Business & Product',
            'Credit & Risk Management',
            'Collection & Recovery',
            'Compliance & Regulatory',
            'Sales & Marketing',
            'Service Excellence',
            'Leadership & Soft Skills',
            'IT & Digital Security',
            'Onboarding'
        ];

        $modules = [
            [
                'title' => 'Wondr Service Excellence',
                'category' => 'Service Excellence',
                'description' => 'Comprehensive training on delivering excellent customer service',
                'xp' => 150,
                'passing_grade' => 80,
            ],
            [
                'title' => 'Mastering Wondr Financial Suite',
                'category' => 'Core Business & Product',
                'description' => 'In-depth course on financial management using Wondr system',
                'xp' => 200,
                'passing_grade' => 85,
            ],
            [
                'title' => 'Credit Risk Management Fundamentals',
                'category' => 'Credit & Risk Management',
                'description' => 'Learn to identify and manage credit risks',
                'xp' => 120,
                'passing_grade' => 75,
            ],
            [
                'title' => 'Compliance and Regulations 2026',
                'category' => 'Compliance & Regulatory',
                'description' => 'Updated compliance training for 2026',
                'xp' => 140,
                'passing_grade' => 80,
            ],
            [
                'title' => 'Digital Security Essentials',
                'category' => 'IT & Digital Security',
                'description' => 'Protect data and systems from cyber threats',
                'xp' => 130,
                'passing_grade' => 78,
            ],
            [
                'title' => 'Leadership Skills for Managers',
                'category' => 'Leadership & Soft Skills',
                'description' => 'Develop leadership and team management skills',
                'xp' => 180,
                'passing_grade' => 75,
            ],
            [
                'title' => 'Sales Excellence Program',
                'category' => 'Sales & Marketing',
                'description' => 'Advanced sales techniques and strategies',
                'xp' => 190,
                'passing_grade' => 80,
            ],
            [
                'title' => 'Employee Onboarding Guide',
                'category' => 'Onboarding',
                'description' => 'Complete onboarding process for new employees',
                'xp' => 100,
                'passing_grade' => 70,
            ],
        ];

        foreach ($modules as $moduleData) {
            DB::table('modules')->updateOrInsert(
                ['title' => $moduleData['title']],
                [
                    'description' => $moduleData['description'],
                    'xp' => $moduleData['xp'],
                    'passing_grade' => $moduleData['passing_grade'],
                    'is_active' => true,
                    'has_pretest' => rand(0, 1),
                    'has_posttest' => 1,
                    'created_at' => now()->subDays(rand(10, 120)),
                    'updated_at' => now(),
                ]
            );
        }

        echo "  ✓ Created " . count($modules) . " modules (training programs)\n";
    }

    /**
     * Seed quiz questions
     */
    private function seedQuestions()
    {
        $modules = DB::table('modules')->get();

        foreach ($modules as $module) {
            // Create 5-10 questions per module
            $questionCount = rand(5, 10);
            for ($q = 1; $q <= $questionCount; $q++) {
                $options = [
                    'Option A: Answer choice 1',
                    'Option B: Answer choice 2',
                    'Option C: Answer choice 3',
                    'Option D: Answer choice 4'
                ];
                
                $correctOption = ['A', 'B', 'C', 'D'][array_rand(['A', 'B', 'C', 'D'])];

                DB::table('questions')->insert([
                    'module_id' => $module->id,
                    'question_text' => "Question {$q}: What is the correct answer about {$module->title}?",
                    'option_a' => $options[0],
                    'option_b' => $options[1],
                    'option_c' => $options[2],
                    'option_d' => $options[3],
                    'correct_answer' => $correctOption,
                    'question_type' => ['multiple_choice', 'multiple_choice', 'true_false'][array_rand(['multiple_choice', 'multiple_choice', 'true_false'])],
                    'difficulty' => ['easy', 'medium', 'hard'][array_rand(['easy', 'medium', 'hard'])],
                    'points' => 10,
                    'explanation' => "The correct answer is {$correctOption}. This is the explanation for why this answer is correct.",
                    'order' => $q,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        echo "  ✓ Created questions for all modules\n";
    }

    /**
     * Seed user training enrollments
     */
    private function seedUserTrainings()
    {
        $learners = User::where('role', 'user')->get();
        $modules = DB::table('modules')->get();

        foreach ($learners as $learner) {
            // Each learner enrolls in 2-5 modules
            $enrollCount = rand(2, 5);
            $selectedModules = $modules->random(min($enrollCount, $modules->count()));

            foreach ($selectedModules as $module) {
                $enrolledDate = now()->subDays(rand(1, 60));
                $status = ['enrolled', 'in_progress', 'completed'][array_rand(['enrolled', 'in_progress', 'completed'])];
                
                $completedDate = null;
                $finalScore = null;
                $isCertified = false;
                
                if ($status === 'completed') {
                    $completedDate = $enrolledDate->copy()->addDays(rand(1, 30));
                    $finalScore = rand(70, 95);
                    $isCertified = ($finalScore >= $module->passing_grade) ? true : false;
                }

                DB::table('user_trainings')->insertOrIgnore([
                    'user_id' => $learner->id,
                    'module_id' => $module->id,
                    'status' => $status,
                    'progress' => $status === 'completed' ? 100 : rand(0, 80),
                    'final_score' => $finalScore,
                    'passing_grade' => $module->passing_grade,
                    'is_certified' => $isCertified,
                    'enrolled_at' => $enrolledDate,
                    'completed_at' => $completedDate,
                    'created_at' => $enrolledDate,
                    'updated_at' => $completedDate ?? now(),
                ]);
            }
        }

        $totalEnrollments = DB::table('user_trainings')->count();
        echo "  ✓ Created $totalEnrollments user training enrollments\n";
    }

    /**
     * Seed system settings
     */
    private function seedSystemSettings()
    {
        $settings = [
            ['key' => 'app_name', 'value' => 'Wondr HCMS E-Learning', 'type' => 'string', 'group' => 'general'],
            ['key' => 'app_url', 'value' => 'http://localhost:8000', 'type' => 'string', 'group' => 'general'],
            ['key' => 'timezone', 'value' => 'Asia/Jakarta', 'type' => 'string', 'group' => 'general'],
            ['key' => 'locale', 'value' => 'id', 'type' => 'string', 'group' => 'general'],
            ['key' => 'max_upload_size', 'value' => '50', 'type' => 'integer', 'group' => 'data'],
            ['key' => 'session_timeout', 'value' => '30', 'type' => 'integer', 'group' => 'security'],
            ['key' => 'enable_two_factor', 'value' => 'true', 'type' => 'boolean', 'group' => 'security'],
            ['key' => 'enable_api', 'value' => 'true', 'type' => 'boolean', 'group' => 'api'],
            ['key' => 'api_rate_limit', 'value' => '1000', 'type' => 'integer', 'group' => 'api'],
            ['key' => 'maintenance_mode', 'value' => 'false', 'type' => 'boolean', 'group' => 'general'],
            ['key' => 'backup_enabled', 'value' => 'true', 'type' => 'boolean', 'group' => 'data'],
            ['key' => 'backup_frequency', 'value' => 'daily', 'type' => 'string', 'group' => 'data'],
        ];

        foreach ($settings as $setting) {
            DB::table('system_settings')->updateOrInsert(
                ['key' => $setting['key']],
                array_merge($setting, ['updated_at' => now()])
            );
        }

        echo "  ✓ Created " . count($settings) . " system settings\n";
    }

    /**
     * Seed audit logs
     */
    private function seedAuditLogs()
    {
        $admin = User::where('email', 'admin@hcms.test')->first();
        $adminId = $admin?->id ?? 1;

        $actions = [
            'update_setting', 'create_program', 'edit_program', 'delete_program',
            'create_user', 'edit_user', 'assign_training', 'view_report',
            'export_data', 'backup_created'
        ];

        $startDate = now()->subDays(30);
        
        for ($i = 0; $i < 60; $i++) {
            $action = $actions[array_rand($actions)];
            $entityTypes = ['setting', 'program', 'user', 'training', 'report'];
            $entityType = $entityTypes[array_rand($entityTypes)];

            DB::table('audit_logs')->insert([
                'user_id' => $adminId,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => rand(1, 100),
                'changes' => json_encode([
                    'field' => 'field_' . rand(1, 10),
                    'old_value' => 'old_value_' . rand(1, 100),
                    'new_value' => 'new_value_' . rand(1, 100),
                    'reason' => 'System maintenance'
                ]),
                'ip_address' => '127.0.0.1',
                'logged_at' => $startDate->copy()->addHours(rand(0, 720)),
            ]);
        }

        echo "  ✓ Created 60 audit log entries\n";
    }

    /**
     * Seed exam attempts
     */
    private function seedExamAttempts()
    {
        $userTrainings = DB::table('user_trainings')
            ->where('status', 'completed')
            ->orWhere('status', 'in_progress')
            ->limit(50) // Limit to avoid too many inserts
            ->get();

        foreach ($userTrainings as $userTraining) {
            // Create pre-test and post-test attempts
            $examTypes = ['pre_test', 'post_test'];
            
            foreach ($examTypes as $examType) {
                $score = rand(40, 95);
                $percentage = round(($score / 100) * 100, 2);
                $isPassed = ($percentage >= 70) ? 1 : 0;
                
                $attemptDate = Carbon::createFromTimestamp(strtotime($userTraining->enrolled_at))
                    ->addDays(rand(1, 15));

                DB::table('exam_attempts')->insertOrIgnore([
                    'user_id' => $userTraining->user_id,
                    'module_id' => $userTraining->module_id,
                    'exam_type' => $examType,
                    'score' => $score,
                    'percentage' => $percentage,
                    'is_passed' => $isPassed,
                    'duration_minutes' => rand(10, 50),
                    'started_at' => $attemptDate,
                    'finished_at' => $attemptDate->copy()->addMinutes(rand(10, 50)),
                    'created_at' => $attemptDate,
                    'updated_at' => $attemptDate,
                ]);
            }
        }

        $totalAttempts = DB::table('exam_attempts')->count();
        echo "  ✓ Created $totalAttempts exam attempts\n";
    }

    /**
     * Generate random Indonesian names
     */
    private function generateRandomName()
    {
        $firstNames = [
            'Budi', 'Siti', 'Agus', 'Dewi', 'Rendra', 'Sasha', 'Bambang', 'Ratna',
            'Dedi', 'Nina', 'Hendra', 'Putri', 'Joni', 'Sri', 'Andhika', 'Fitri',
            'Boby', 'Diana', 'Erwin', 'Eka', 'Ferry', 'Gita', 'Guntur', 'Hanin'
        ];

        $lastNames = [
            'Wijaya', 'Santoso', 'Pratama', 'Kusuma', 'Setiawan', 'Rahman',
            'Atmaja', 'Gunawan', 'Hermawan', 'Indrato', 'Junaedi', 'Karjadi',
            'Suryanto', 'Utama', 'Vandi', 'Wibowo', 'Yunus', 'Zainudin'
        ];

        return $firstNames[array_rand($firstNames)] . ' ' . $lastNames[array_rand($lastNames)];
    }
}
