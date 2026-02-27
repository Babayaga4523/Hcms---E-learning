<?php

namespace App\Console\Commands;

use App\Services\PointsService;
use App\Models\User;
use Illuminate\Console\Command;

class MigrateUserPoints extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'points:migrate {--user_id=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate dan recalculate poin untuk user ke formula baru (konsisten)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $pointsService = app(PointsService::class);
        
        if ($this->option('user_id')) {
            // Migrate satu user
            $userId = $this->option('user_id');
            $user = User::find($userId);
            
            if (!$user) {
                $this->error("User dengan ID $userId tidak ditemukan");
                return 1;
            }

            $this->info("Migrasi poin untuk user: {$user->name}...");
            $pointsService->recalculateUserPoints($userId);
            $this->info("✓ Selesai! Total poin: " . $user->total_points);
            return 0;
        }

        // Migrate semua user
        $this->info("Migrasi poin untuk SEMUA user...");
        $this->withProgressBar(User::all(), function ($user) use ($pointsService) {
            $pointsService->recalculateUserPoints($user->id);
        });

        $this->newLine();
        $this->info("✓ Migrasi poin selesai untuk " . User::count() . " user!");
        
        return 0;
    }
}
