<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ProgramNotification;
use Illuminate\Support\Facades\DB;

class CleanupTestData extends Command
{
    protected $signature = 'cleanup:test-data';
    protected $description = 'Delete test notification and announcement data';

    public function handle()
    {
        $this->info('🧹 Cleaning up test data...');

        // Delete test notifications (IDs 6, 7, 8)
        $notificationsDeleted = ProgramNotification::whereIn('id', [6, 7, 8])->delete();
        $this->info("✅ Deleted $notificationsDeleted test notifications");

        // Delete test announcements (IDs 3, 4, 5) - using DB::table since there's no Announcement model
        $announcementsDeleted = DB::table('announcements')->whereIn('id', [3, 4, 5])->delete();
        $this->info("✅ Deleted $announcementsDeleted test announcements");

        $this->info("\n✅ Test data cleanup complete!");
        $this->line("📍 Now you can create real notifications from Admin Panel");
        $this->line("   Navigate to: Admin > Communication Hub > Notifications");
    }
}
