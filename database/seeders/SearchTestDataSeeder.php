<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Module;
use App\Models\UserTraining;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class SearchTestDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create test users with "budi" in their name
        $users = [
            [
                'name' => 'Budi Santoso',
                'email' => 'budi.santoso@bni.co.id',
                'nip' => '2024001',
                'password' => bcrypt('password'),
                'role' => 'user',
                'department' => 'Digital Banking',
            ],
            [
                'name' => 'Ahmad Budiman',
                'email' => 'ahmad.budiman@bni.co.id',
                'nip' => '2024002',
                'password' => bcrypt('password'),
                'role' => 'user',
                'department' => 'IT Security',
            ],
            [
                'name' => 'Budiyono Irawan',
                'email' => 'budiyono.irawan@bni.co.id',
                'nip' => '2024003',
                'password' => bcrypt('password'),
                'role' => 'user',
                'department' => 'Operations',
            ],
            [
                'name' => 'Sarah Johnson',
                'email' => 'sarah.johnson@bni.co.id',
                'nip' => '2024004',
                'password' => bcrypt('password'),
                'role' => 'user',
                'department' => 'Compliance',
            ],
            [
                'name' => 'Dimas Anggara',
                'email' => 'dimas.anggara@bni.co.id',
                'nip' => '2024005',
                'password' => bcrypt('password'),
                'role' => 'user',
                'department' => 'Risk Management',
            ],
        ];

        $createdUsers = [];
        foreach ($users as $userData) {
            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                $userData
            );
            $createdUsers[] = $user;
        }

        // Create test modules
        $modules = [
            [
                'title' => 'Anti-Money Laundering (AML) Compliance',
                'description' => 'Learn about AML regulations and procedures to prevent money laundering in banking',
                'category' => 'Compliance',
                'is_active' => true,
            ],
            [
                'title' => 'Data Privacy and Security',
                'description' => 'Comprehensive guide to data protection and privacy regulations',
                'category' => 'Security',
                'is_active' => true,
            ],
            [
                'title' => 'Customer Service Excellence',
                'description' => 'Best practices for providing excellent customer service in banking',
                'category' => 'Soft Skills',
                'is_active' => true,
            ],
            [
                'title' => 'Digital Banking Platform',
                'description' => 'Training on the latest digital banking tools and systems',
                'category' => 'Technical',
                'is_active' => true,
            ],
            [
                'title' => 'Cybersecurity Fundamentals',
                'description' => 'Essential cybersecurity knowledge for all bank employees',
                'category' => 'Security',
                'is_active' => true,
            ],
        ];

        $createdModules = [];
        foreach ($modules as $moduleData) {
            $module = Module::firstOrCreate(
                ['title' => $moduleData['title']],
                $moduleData
            );
            $createdModules[] = $module;
        }

        // Create trainings (UserTraining records) linking users to modules
        foreach ($createdUsers as $index => $user) {
            // Each user gets 2-3 trainings
            $moduleCount = rand(2, 3);
            $randomModules = collect($createdModules)->random($moduleCount);

            foreach ($randomModules as $module) {
                // Check if training already exists
                $exists = UserTraining::where('user_id', $user->id)
                    ->where('module_id', $module->id)
                    ->exists();

                if (!$exists) {
                    $status = collect(['enrolled', 'in_progress', 'completed', 'failed'])->random();
                    UserTraining::create([
                        'user_id' => $user->id,
                        'module_id' => $module->id,
                        'status' => $status,
                        'final_score' => $status === 'completed' ? rand(70, 100) : ($status === 'failed' ? rand(0, 50) : rand(30, 70)),
                        'enrolled_at' => Carbon::now()->subDays(rand(1, 30)),
                        'completed_at' => $status === 'completed' ? Carbon::now()->subDays(rand(1, 20)) : null,
                        'is_certified' => $status === 'completed',
                    ]);
                }
            }
        }

        $this->command->info('✅ Search test data created successfully!');
        $this->command->info('Users with "budi" in name: Budi Santoso, Ahmad Budiman, Budiyono Irawan');
        $this->command->info('Test by searching: "budi", "AML", "Security", or "Budi Santoso"');
    }
}
