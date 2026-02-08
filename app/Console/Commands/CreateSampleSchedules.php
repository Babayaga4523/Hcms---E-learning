<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Module;
use App\Models\TrainingSchedule;
use App\Models\User;
use App\Models\UserTraining;

class CreateSampleSchedules extends Command
{
    protected $signature = 'app:create-sample-schedules';
    protected $description = 'Create sample training schedules for testing';

    public function handle()
    {
        $this->info('Creating sample training schedules...');

        // Get all approved modules
        $modules = Module::where('approval_status', 'approved')
            ->where('is_active', true)
            ->limit(3)
            ->get();

        if ($modules->isEmpty()) {
            $this->error('No approved active modules found!');
            return;
        }

        $statuses = ['scheduled', 'ongoing'];
        $types = ['training', 'deadline'];
        
        foreach ($modules as $module) {
            for ($i = 1; $i <= 3; $i++) {
                $date = now()->addDays($i);
                
                TrainingSchedule::create([
                    'title' => $module->title . ' - Session ' . $i,
                    'date' => $date,
                    'start_time' => $date->copy()->setTime(9 + ($i - 1), 0)->toTimeString(),
                    'end_time' => $date->copy()->setTime(11 + ($i - 1), 0)->toTimeString(),
                    'location' => $i % 2 === 0 ? 'https://zoom.us/j/meeting' : 'Room 101',
                    'description' => 'Sample training schedule for ' . $module->title,
                    'program_id' => $module->id,
                    'type' => $types[($i - 1) % 2],
                    'capacity' => 30,
                    'enrolled' => rand(10, 25),
                    'status' => $statuses[($i - 1) % 2],
                ]);
                
                $this->info("Created schedule for {$module->title} on {$date->format('Y-m-d')}");
            }
        }

        // Enroll some users in these modules for testing
        $users = User::whereNotNull('email_verified_at')
            ->where('role', 'learner')
            ->limit(2)
            ->get();

        foreach ($users as $user) {
            foreach ($modules as $module) {
                $existing = UserTraining::where('user_id', $user->id)
                    ->where('module_id', $module->id)
                    ->first();

                if (!$existing) {
                    UserTraining::create([
                        'user_id' => $user->id,
                        'module_id' => $module->id,
                        'status' => 'in_progress',
                        'enrolled_at' => now(),
                    ]);
                    $this->info("Enrolled user {$user->name} in {$module->title}");
                }
            }
        }

        $this->info('✓ Sample schedules created successfully!');
    }
}
