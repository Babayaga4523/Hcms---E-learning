<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DeleteTestUsers extends Command
{
    protected $signature = 'cleanup:test-users {--force : Skip confirmation and delete immediately}';
    protected $description = 'Delete all test users (containing "test", "user", or "program" in their name)';

    public function handle()
    {
        $this->info('🧹 Scanning for test users...');
        $this->line('');

        try {
            // Find test users (excluding admin@example.com)
            $testUsers = User::where(function($query) {
                $query->where('name', 'like', '%test%')
                      ->orWhere('name', 'like', '%user%')
                      ->orWhere('name', 'like', '%program%');
            })
            ->whereNotIn('email', ['admin@example.com'])
            ->get();

            if ($testUsers->isEmpty()) {
                $this->info('✅ No test users found!');
                return Command::SUCCESS;
            }

            $this->warn("Found {$testUsers->count()} test users:");
            $this->line('');

            foreach ($testUsers as $user) {
                $this->line("  • {$user->name} ({$user->email})");
            }

            $this->line('');

            if (!$this->option('force') && !$this->confirm('Delete these users?', false)) {
                $this->info('❌ Deletion cancelled.');
                return Command::SUCCESS;
            }

            if ($this->option('force')) {
                $this->info('🔥 Force mode: Deleting without confirmation...');
                $this->line('');
            }

            // Delete users and their related data
            $deleted = 0;
            foreach ($testUsers as $user) {
                try {
                    // Delete related data first (cascade deletes)
                    $user->delete();
                    $deleted++;
                    $this->line("  ✓ Deleted: {$user->name}");
                } catch (\Exception $e) {
                    $this->error("  ✗ Failed to delete {$user->name}: {$e->getMessage()}");
                }
            }

            $this->line('');
            $this->info("✨ Successfully deleted {$deleted} test users!");
            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
