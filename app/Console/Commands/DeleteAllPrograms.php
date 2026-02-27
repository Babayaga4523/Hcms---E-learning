<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Module;
use Illuminate\Support\Facades\DB;

class DeleteAllPrograms extends Command
{
    protected $signature = 'cleanup:all-programs {--force : Skip confirmation and delete immediately}';
    protected $description = 'Delete all training programs from the database';

    public function handle()
    {
        $this->info('🗑️  Scanning for all programs...');
        $this->line('');

        try {
            // Find all programs (modules)
            $programs = Module::all();

            if ($programs->isEmpty()) {
                $this->info('✅ No programs found!');
                return Command::SUCCESS;
            }

            $this->warn("Found {$programs->count()} programs:");
            $this->line('');

            foreach ($programs as $program) {
                $this->line("  • {$program->title} (ID: {$program->id})");
            }

            $this->line('');

            if (!$this->option('force') && !$this->confirm('Delete ALL programs? This cannot be undone!', false)) {
                $this->info('❌ Deletion cancelled.');
                return Command::SUCCESS;
            }

            if ($this->option('force')) {
                $this->error('🔥 FORCE MODE: Deleting all programs immediately...');
                $this->line('');
            }

            // Delete programs and their related data
            $deleted = 0;
            foreach ($programs as $program) {
                try {
                    // Delete related data first (cascade deletes)
                    $program->delete();
                    $deleted++;
                    $this->line("  ✓ Deleted: {$program->title}");
                } catch (\Exception $e) {
                    $this->error("  ✗ Failed to delete {$program->title}: {$e->getMessage()}");
                }
            }

            $this->line('');
            $this->info("✨ Successfully deleted {$deleted} programs!");
            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
