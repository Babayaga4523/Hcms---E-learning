<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Module;
use App\Models\Question;
use App\Models\ModuleProgress;
use App\Models\ExamAttempt;
use App\Models\UserTraining;
use Illuminate\Support\Facades\Hash;

class DashboardSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create test users (Karyawan)
        $users = [
            [
                'nip' => '11111110001',
                'name' => 'Budi Santoso',
                'email' => 'budi.santoso@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'department' => 'Divisi Kepatuhan',
            ],
            [
                'nip' => '11111110002',
                'name' => 'Siti Nurhaliza',
                'email' => 'siti.nurhaliza@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'department' => 'Divisi Risiko',
            ],
            [
                'nip' => '11111110003',
                'name' => 'Admin Training',
                'email' => 'admin.training@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'department' => 'HC & Training',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }

        // 2. Create modules (Training Programs)
        $modules = [
            [
                'title' => 'Anti Money Laundering (AML)',
                'description' => 'Program pelatihan compliance tentang pencegahan pencucian uang sesuai regulasi OJK.',
                'passing_grade' => 75,
                'has_pretest' => true,
                'is_active' => true,
            ],
            [
                'title' => 'Know Your Customer (KYC)',
                'description' => 'Pelatihan identifikasi dan verifikasi customer untuk compliance.',
                'passing_grade' => 70,
                'has_pretest' => true,
                'is_active' => true,
            ],
            [
                'title' => 'Manajemen Risiko Operasional',
                'description' => 'Pelatihan tentang identifikasi, penilaian, dan mitigasi risiko operasional.',
                'passing_grade' => 75,
                'has_pretest' => false,
                'is_active' => true,
            ],
            [
                'title' => 'Keamanan Data dan Cyber',
                'description' => 'Program pelatihan tentang security awareness dan best practice keamanan data.',
                'passing_grade' => 80,
                'has_pretest' => true,
                'is_active' => true,
            ],
            [
                'title' => 'Customer Service Excellence',
                'description' => 'Pelatihan soft skill tentang layanan pelanggan yang excellent.',
                'passing_grade' => 70,
                'has_pretest' => false,
                'is_active' => true,
            ],
        ];

        foreach ($modules as $moduleData) {
            Module::firstOrCreate(
                ['title' => $moduleData['title']],
                $moduleData
            );
        }

        // 3. Create questions for modules
        $allModules = Module::all();
        
        foreach ($allModules as $module) {
            // Create 5 questions per module
            for ($i = 1; $i <= 5; $i++) {
                Question::updateOrCreate(
                    ['module_id' => $module->id, 'question_text' => "Pertanyaan {$i} untuk {$module->title}"],
                    [
                        'question_text' => "Pertanyaan {$i} untuk {$module->title}",
                        'option_a' => 'Pilihan A untuk soal ' . $i,
                        'option_b' => 'Pilihan B untuk soal ' . $i,
                        'option_c' => 'Pilihan C untuk soal ' . $i,
                        'option_d' => 'Pilihan D untuk soal ' . $i,
                        'correct_answer' => chr(97 + ($i % 4)), // Randomize between a-d
                    ]
                );
            }
        }

        // 4. Create user training enrollments & progress for first user
        $firstUser = User::where('nip', '11111110001')->first();
        
        // Get first 3 modules
        $trainingsToEnroll = Module::take(3)->get();
        
        foreach ($trainingsToEnroll as $index => $module) {
            // Create user training enrollment
            $status = $index === 0 ? 'completed' : ($index === 1 ? 'in_progress' : 'enrolled');
            $finalScore = $status === 'completed' ? 85 : null;
            $isCertified = $status === 'completed' && $finalScore >= $module->passing_grade;

            UserTraining::updateOrCreate(
                ['user_id' => $firstUser->id, 'module_id' => $module->id],
                [
                    'status' => $status,
                    'final_score' => $finalScore,
                    'is_certified' => $isCertified,
                    'enrolled_at' => now()->subDays(10 - $index),
                    'completed_at' => $status === 'completed' ? now()->subDays(5 - $index) : null,
                ]
            );

            // Create module progress
            $progressStatus = $status === 'enrolled' ? 'locked' : ($status === 'completed' ? 'completed' : 'in_progress');
            $progressPercentage = $status === 'completed' ? 100 : ($status === 'in_progress' ? 60 : 0);

            ModuleProgress::updateOrCreate(
                ['user_id' => $firstUser->id, 'module_id' => $module->id],
                [
                    'status' => $progressStatus,
                    'progress_percentage' => $progressPercentage,
                    'last_accessed_at' => now()->subDays(5 - $index),
                ]
            );

            // Create exam attempts for completed trainings
            if ($status === 'completed') {
                // Pre-test
                if ($module->has_pretest) {
                    ExamAttempt::updateOrCreate(
                        [
                            'user_id' => $firstUser->id,
                            'module_id' => $module->id,
                            'exam_type' => 'pre_test',
                        ],
                        [
                            'score' => 65,
                            'percentage' => 65.0,
                            'is_passed' => false,
                            'started_at' => now()->subDays(8 - $index)->setTime(9, 0),
                            'finished_at' => now()->subDays(8 - $index)->setTime(9, 15),
                            'duration_minutes' => 15,
                        ]
                    );
                }

                // Post-test
                ExamAttempt::updateOrCreate(
                    [
                        'user_id' => $firstUser->id,
                        'module_id' => $module->id,
                        'exam_type' => 'post_test',
                    ],
                    [
                        'score' => 85,
                        'percentage' => 85.0,
                        'is_passed' => true,
                        'started_at' => now()->subDays(5 - $index)->setTime(14, 0),
                        'finished_at' => now()->subDays(5 - $index)->setTime(14, 20),
                        'duration_minutes' => 20,
                    ]
                );
            }
        }

        // 5. Create enrollments for second user
        $secondUser = User::where('nip', '11111110002')->first();
        
        foreach (Module::take(2)->get() as $module) {
            UserTraining::updateOrCreate(
                ['user_id' => $secondUser->id, 'module_id' => $module->id],
                [
                    'status' => 'in_progress',
                    'final_score' => null,
                    'is_certified' => false,
                    'enrolled_at' => now()->subDays(3),
                    'completed_at' => null,
                ]
            );

            ModuleProgress::updateOrCreate(
                ['user_id' => $secondUser->id, 'module_id' => $module->id],
                [
                    'status' => 'in_progress',
                    'progress_percentage' => 45,
                    'last_accessed_at' => now()->subHours(2),
                ]
            );
        }

        $this->command->info('Dashboard seeding completed successfully!');
        $this->command->info('Test User: budi.santoso@bni.co.id | Password: password123');
    }
}
