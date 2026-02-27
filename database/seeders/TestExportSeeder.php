<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TestExportSeeder extends Seeder
{
    public function run()
    {
        // Sample Departments
        $departments = ['IT', 'HR', 'Finance', 'Operations', 'Marketing', 'Sales'];
        
        // Sample Modules
        $modules = [
            ['title' => 'Leadership Fundamentals', 'category' => 'Management', 'is_active' => 1, 'description' => 'Learn core leadership principles'],
            ['title' => 'Financial Analysis', 'category' => 'Finance', 'is_active' => 1, 'description' => 'Master financial analysis techniques'],
            ['title' => 'Communication Skills', 'category' => 'Soft Skills', 'is_active' => 1, 'description' => 'Improve your communication abilities'],
            ['title' => 'Data Security Basics', 'category' => 'IT', 'is_active' => 1, 'description' => 'Essential data security knowledge'],
            ['title' => 'Customer Service Excellence', 'category' => 'Customer Service', 'is_active' => 1, 'description' => 'Deliver exceptional customer service'],
        ];

        // Insert modules
        $moduleIds = [];
        foreach ($modules as $module) {
            $moduleIds[] = DB::table('modules')->insertOrIgnore([
                'title' => $module['title'],
                'description' => $module['description'] ?? null,
                'passing_grade' => 70,
                'has_pretest' => 1,
                'is_active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        // Get actual inserted module IDs
        $moduleIds = DB::table('modules')->where('is_active', 1)->pluck('id')->toArray();

        // Insert test users
        $userIds = [];
        for ($i = 1; $i <= 15; $i++) {
            $dept = $departments[array_rand($departments)];
            $email = "testuser{$i}@example.com";
            
            // Check if user exists, if not insert
            $userId = DB::table('users')
                ->where('email', $email)
                ->value('id');
                
            if (!$userId) {
                $userId = DB::table('users')->insertGetId([
                    'name' => "Test User {$i}",
                    'email' => $email,
                    'nip' => "NIP" . str_pad($i, 5, '0', STR_PAD_LEFT),
                    'password' => bcrypt('password'),
                    'department' => $dept,
                    'status' => $i <= 12 ? 'active' : 'inactive',
                    'role' => 'user',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            $userIds[] = $userId;
        }

        // Insert user trainings with various statuses
        $statuses = ['completed', 'in_progress', 'enrolled', 'failed'];
        
        foreach ($userIds as $userId) {
            foreach ($moduleIds as $moduleId) {
                // Skip if already exists
                $exists = DB::table('user_trainings')
                    ->where('user_id', $userId)
                    ->where('module_id', $moduleId)
                    ->exists();
                    
                if ($exists) continue;
                
                $status = $statuses[array_rand($statuses)];
                $enrolledDate = Carbon::now()->subDays(rand(1, 60));
                $completedDate = $status === 'completed' ? $enrolledDate->clone()->addDays(rand(5, 20)) : null;
                $finalScore = $status === 'completed' ? rand(70, 100) : ($status === 'failed' ? rand(20, 69) : null);
                $duration = $status === 'completed' ? rand(30, 480) : null;
                
                DB::table('user_trainings')->insert([
                    'user_id' => $userId,
                    'module_id' => $moduleId,
                    'status' => $status,
                    'progress' => $status === 'completed' ? 100 : rand(10, 90),
                    'final_score' => $finalScore,
                    'is_certified' => $status === 'completed',
                    'enrolled_at' => $enrolledDate,
                    'completed_at' => $completedDate,
                    'duration_minutes' => $duration,
                    'created_at' => $enrolledDate,
                    'updated_at' => now(),
                    'last_activity_at' => $completedDate ?? $enrolledDate,
                ]);
            }
        }

        // Insert certificates
        $completedTrainings = DB::table('user_trainings')
            ->join('users', 'users.id', '=', 'user_trainings.user_id')
            ->join('modules', 'modules.id', '=', 'user_trainings.module_id')
            ->where('user_trainings.status', 'completed')
            ->select('user_trainings.*', 'users.name as user_name', 'modules.title as module_title')
            ->get();

        foreach ($completedTrainings->take(20) as $training) {
            $exists = DB::table('certificates')
                ->where('user_id', $training->user_id)
                ->where('module_id', $training->module_id)
                ->exists();
                
            if ($exists) continue;
            
            $certNo = 'CERT-' . str_pad($training->user_id, 5, '0', STR_PAD_LEFT) . '-' . str_pad($training->module_id, 5, '0', STR_PAD_LEFT) . '-' . now()->format('YmdHis');
            $completedAt = Carbon::parse($training->completed_at);
            
            DB::table('certificates')->insert([
                'user_id' => $training->user_id,
                'module_id' => $training->module_id,
                'certificate_number' => $certNo,
                'user_name' => $training->user_name,
                'training_title' => $training->module_title,
                'score' => $training->final_score ?? 75,
                'materials_completed' => 100,
                'hours' => ceil(($training->duration_minutes ?? 60) / 60),
                'issued_at' => $completedAt,
                'completed_at' => $completedAt,
                'instructor_name' => 'System',
                'status' => 'active',
                'metadata' => json_encode(['source' => 'test_seeder']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        echo "✅ Test data inserted successfully!\n";
        echo "- Users: " . count($userIds) . "\n";
        echo "- Modules: " . count($moduleIds) . "\n";
        echo "- User Trainings: " . DB::table('user_trainings')->count() . "\n";
        echo "- Certificates: " . DB::table('certificates')->count() . "\n";
    }
}

