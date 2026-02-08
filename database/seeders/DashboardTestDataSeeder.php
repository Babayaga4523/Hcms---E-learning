<?php

/**
 * Script untuk populate test data - run dengan php artisan
 */

namespace Database\Seeders;

use App\Models\User;
use App\Models\Module;
use App\Models\UserTraining;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;

class DashboardTestDataSeeder extends Seeder
{
    public function run()
    {
        echo "\n=== POPULATING TEST DATA FOR DASHBOARD ===\n\n";

        try {
            echo "1. Creating test modules...\n";
            
            $modules = [
                ['title' => 'Compliance & Code of Conduct', 'description' => 'Learn company policies', 'is_active' => true],
                ['title' => 'Data Privacy & GDPR', 'description' => 'Protect customer data', 'is_active' => true],
                ['title' => 'Cybersecurity Basics', 'description' => 'Security awareness training', 'is_active' => true],
                ['title' => 'Financial Reporting', 'description' => 'Accurate financial records', 'is_active' => true],
                ['title' => 'Leadership Skills', 'description' => 'Develop leadership capabilities', 'is_active' => true],
            ];
            
            $moduleIds = [];
            foreach ($modules as $module) {
                $existing = Module::where('title', $module['title'])->first();
                if (!$existing) {
                    $created = Module::create($module);
                    $moduleIds[] = $created->id;
                    echo "   ✓ Created: {$module['title']}\n";
                } else {
                    $moduleIds[] = $existing->id;
                    echo "   ✓ Exists: {$module['title']}\n";
                }
            }
            
            echo "\n2. Creating test users and enrollments...\n";
            
            $departments = ['IT', 'HR', 'Finance', 'Marketing', 'Operations'];
            $firstNames = ['Ahmad', 'Budi', 'Citra', 'Dewi', 'Eka', 'Fitri', 'Gita', 'Hadi', 'Ika', 'Joko', 'Krisna', 'Lena', 'Maya', 'Noval', 'Oji'];
            $lastNames = ['Wijaya', 'Santoso', 'Rahmadani', 'Kusuma', 'Pratama', 'Setiyawan', 'Handoko', 'Iswanto', 'Jayanti', 'Kusumah', 'Budiman', 'Mahendra', 'Nugroho', 'Soekarno', 'Permana'];
            $statuses = ['completed', 'in_progress', 'enrolled'];
            
            for ($i = 1; $i <= 15; $i++) {
                $dept = $departments[($i - 1) % count($departments)];
                $nip = 'EMP' . str_pad($i, 5, '0', STR_PAD_LEFT);
                $fullName = $firstNames[$i - 1] . ' ' . $lastNames[$i - 1];
                
                $user = User::updateOrCreate(
                    ['nip' => $nip],
                    [
                        'name' => $fullName,
                        'email' => strtolower(str_replace(' ', '.', $fullName)) . "@company.com",
                        'password' => bcrypt('password'),
                        'role' => 'user',
                        'department' => $dept,
                        'location' => 'Jakarta',
                    ]
                );
                
                echo "   ✓ User: {$user->name}\n";
                
                // Create enrollments
                foreach ($moduleIds as $moduleId) {
                    $status = $statuses[array_rand($statuses)];
                    $score = $status === 'completed' ? rand(70, 100) : ($status === 'in_progress' ? rand(30, 69) : 0);
                    $isCertified = $status === 'completed' && $score >= 75;
                    $enrolledAt = now()->subDays(rand(1, 60));
                    $completedAt = $status === 'completed' ? $enrolledAt->copy()->addDays(rand(1, 14)) : null;
                    
                    UserTraining::updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'module_id' => $moduleId,
                        ],
                        [
                            'status' => $status,
                            'final_score' => $score,
                            'is_certified' => $isCertified,
                            'enrolled_at' => $enrolledAt,
                            'completed_at' => $completedAt,
                        ]
                    );
                }
            }
            
            echo "\n3. Data Summary:\n";
            echo "   ✓ Users (role='user'): " . User::where('role', 'user')->count() . "\n";
            echo "   ✓ Modules: " . Module::count() . "\n";
            echo "   ✓ Enrollments: " . UserTraining::count() . "\n";
            
            // Show statistics
            echo "\n4. Dashboard Statistics:\n";
            
            $stats = DB::table('user_trainings')
                ->selectRaw('COUNT(*) as total, SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed')
                ->first();
            
            $completionRate = $stats->total > 0 
                ? round(($stats->completed / $stats->total) * 100, 2)
                : 0;
            
            echo "   ✓ Completion Rate: {$completionRate}%\n";
            
            $avgScore = DB::table('user_trainings')
                ->whereNotNull('final_score')
                ->avg('final_score') ?? 0;
            
            echo "   ✓ Average Score: " . round($avgScore, 2) . "\n";
            
            $certified = DB::table('user_trainings')
                ->where('is_certified', true)
                ->count();
            
            $complianceRate = $stats->total > 0 
                ? round(($certified / $stats->total) * 100, 2)
                : 0;
            
            echo "   ✓ Compliance Rate: {$complianceRate}%\n";
            
            echo "\n✅ TEST DATA POPULATED SUCCESSFULLY!\n";
            echo "Refresh dashboard at: http://localhost:8000/admin/dashboard\n\n";
            
        } catch (\Exception $e) {
            echo "\n❌ ERROR: " . $e->getMessage() . "\n";
            throw $e;
        }
    }
}

// Run the seeder
$seeder = new DashboardTestDataSeeder();
$seeder->run();

?>
