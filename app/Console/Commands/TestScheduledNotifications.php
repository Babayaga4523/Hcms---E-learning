<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ProgramNotification;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class TestScheduledNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:scheduled-notifications {type=all : Type to test (all, notification, announcement)}';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Test scheduled notifications and announcements functionality';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $type = $this->argument('type');

        $this->info('🧪 Testing Scheduled Notifications & Announcements System');
        $this->line('');

        if ($type === 'all' || $type === 'notification') {
            $this->testNotifications();
        }

        if ($type === 'all' || $type === 'announcement') {
            $this->testAnnouncements();
        }

        $this->line('');
        $this->info('✅ Testing complete!');

        return Command::SUCCESS;
    }

    private function testNotifications()
    {
        $this->line('');
        $this->info('📨 ===== TESTING NOTIFICATIONS =====');

        // Test 1: Regular notification (immediate send)
        $this->line('');
        $this->info('Test #1: Regular Notification (Immediate Send)');
        
        $regularNotif = new ProgramNotification();
        $regularNotif->title = '🔔 Test Regular Notification - ' . now()->format('Y-m-d H:i:s');
        $regularNotif->message = 'Ini adalah notifikasi biasa yang langsung dikirim ke semua pengguna tanpa dijadwalkan.';
        $regularNotif->type = 'info';
        $regularNotif->status = 'sent';
        $regularNotif->recipients = 'all';
        $regularNotif->recipient_ids = [];
        $regularNotif->is_scheduled = false;
        $regularNotif->scheduled_at = null;
        $regularNotif->sent_at = now();
        $regularNotif->recipients_count = 0;
        $regularNotif->stats = json_encode(['sent' => 0, 'read' => 0, 'clicked' => 0, 'failure' => 0]);
        $regularNotif->save();

        $this->line("✓ Created regular notification: ID {$regularNotif->id}");
        $this->line("  Title: {$regularNotif->title}");
        $this->line("  Status: {$regularNotif->status}");
        $this->line("  Is Scheduled: No");
        $this->line("  Sent At: {$regularNotif->sent_at}");

        // Test 2: Scheduled notification (future time)
        $this->line('');
        $this->info('Test #2: Scheduled Notification (Future Time)');

        $scheduledTime = now()->addMinutes(5); // 5 minutes from now
        
        $scheduledNotif = new ProgramNotification();
        $scheduledNotif->title = '⏰ Test Scheduled Notification - ' . $scheduledTime->format('Y-m-d H:i:s');
        $scheduledNotif->message = 'Ini adalah notifikasi terjadwal yang akan dikirim pada waktu yang ditentukan through console command.';
        $scheduledNotif->type = 'warning';
        $scheduledNotif->status = 'scheduled';
        $scheduledNotif->recipients = 'all';
        $scheduledNotif->recipient_ids = [];
        $scheduledNotif->is_scheduled = true;
        $scheduledNotif->scheduled_at = $scheduledTime;
        $scheduledNotif->sent_at = null;
        $scheduledNotif->recipients_count = 0;
        $scheduledNotif->stats = json_encode(['sent' => 0, 'read' => 0, 'clicked' => 0, 'failure' => 0]);
        $scheduledNotif->save();

        $this->line("✓ Created scheduled notification: ID {$scheduledNotif->id}");
        $this->line("  Title: {$scheduledNotif->title}");
        $this->line("  Status: {$scheduledNotif->status}");
        $this->line("  Is Scheduled: Yes");
        $this->line("  Scheduled For: {$scheduledNotif->scheduled_at}");
        $this->warn("  ⏳ Will be sent in 5 minutes (run 'php artisan notifications:send-scheduled' to send)");

        // Test 3: Scheduled notification with specific recipients (role)
        $this->line('');
        $this->info('Test #3: Scheduled Notification (Role-based Recipients)');

        $scheduledRoleNotif = new ProgramNotification();
        $scheduledRoleNotif->title = '👤 Test Role-Based Scheduled Notification - ' . now()->addMinutes(3)->format('Y-m-d H:i:s');
        $scheduledRoleNotif->message = 'Ini adalah notifikasi terjadwal khusus untuk role tertentu.';
        $scheduledRoleNotif->type = 'success';
        $scheduledRoleNotif->status = 'scheduled';
        $scheduledRoleNotif->recipients = 'role';
        $scheduledRoleNotif->recipient_ids = ['learner', 'instructor']; // Send to learners and instructors
        $scheduledRoleNotif->is_scheduled = true;
        $scheduledRoleNotif->scheduled_at = now()->addMinutes(3);
        $scheduledRoleNotif->sent_at = null;
        $scheduledRoleNotif->recipients_count = 0;
        $scheduledRoleNotif->stats = json_encode(['sent' => 0, 'read' => 0, 'clicked' => 0, 'failure' => 0]);
        $scheduledRoleNotif->save();

        $this->line("✓ Created role-based scheduled notification: ID {$scheduledRoleNotif->id}");
        $this->line("  Title: {$scheduledRoleNotif->title}");
        $this->line("  Recipients: Role-based (learner, instructor)");
        $this->line("  Scheduled For: {$scheduledRoleNotif->scheduled_at}");

        $this->line('');
        $this->info('Notification Tests Summary:');
        $this->line("  • Regular (Immediate): 1 created with status 'sent'");
        $this->line("  • Scheduled (All Users): 1 created with status 'scheduled'");
        $this->line("  • Scheduled (Role-based): 1 created with status 'scheduled'");
        $this->line('');
        $this->warn('Next: Run "php artisan notifications:send-scheduled" to send scheduled notifications');
    }

    private function testAnnouncements()
    {
        $this->line('');
        $this->info('📢 ===== TESTING ANNOUNCEMENTS =====');

        $timezone = config('app.timezone', 'UTC');

        // Test 1: Regular announcement (active immediately)
        $this->line('');
        $this->info('Test #1: Regular Announcement (Active Immediately)');

        $regularAnnounce = DB::table('announcements')->insertGetId([
            'title' => '📣 Test Regular Announcement - ' . now()->format('Y-m-d H:i:s'),
            'content' => '<p>Ini adalah pengumuman biasa yang langsung aktif dan terlihat oleh semua pengguna.</p>',
            'type' => 'general',
            'status' => 'active',
            'display_type' => 'banner',
            'is_featured' => false,
            'start_date' => now(),
            'end_date' => now()->addDays(7),
            'schedule_timezone' => $timezone,
            'repeat_schedule' => 'none',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $announce = DB::table('announcements')->where('id', $regularAnnounce)->first();

        $this->line("✓ Created regular announcement: ID {$announce->id}");
        $this->line("  Title: {$announce->title}");
        $this->line("  Status: {$announce->status}");
        $this->line("  Start Date: {$announce->start_date}");
        $this->line("  End Date: {$announce->end_date}");

        // Test 2: Scheduled announcement (will be published at scheduled time)
        $this->line('');
        $this->info('Test #2: Scheduled Announcement (Future Publication)');

        $futureTime = now()->addMinutes(5); // 5 minutes from now

        $scheduledAnnounce = DB::table('announcements')->insertGetId([
            'title' => '⏰ Test Scheduled Announcement - ' . $futureTime->format('Y-m-d H:i:s'),
            'content' => '<p>Ini adalah pengumuman terjadwal yang akan dipublikasikan pada waktu yang ditentukan melalui console command.</p>',
            'type' => 'event',
            'status' => 'scheduled',
            'display_type' => 'modal',
            'is_featured' => true,
            'start_date' => $futureTime,
            'end_date' => $futureTime->clone()->addDays(7),
            'schedule_timezone' => $timezone,
            'repeat_schedule' => 'none',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $announce2 = DB::table('announcements')->where('id', $scheduledAnnounce)->first();

        $this->line("✓ Created scheduled announcement: ID {$announce2->id}");
        $this->line("  Title: {$announce2->title}");
        $this->line("  Status: {$announce2->status}");
        $this->line("  Start Date: {$announce2->start_date}");
        $this->line("  End Date: {$announce2->end_date}");
        $this->warn("  ⏳ Will be published in 5 minutes (run 'php artisan announcements:publish-scheduled' to publish)");

        // Test 3: Announcement set to expire
        $this->line('');
        $this->info('Test #3: Announcement with Expiration');

        $expiringAnnounce = DB::table('announcements')->insertGetId([
            'title' => '⌛ Test Expiring Announcement - ' . now()->format('Y-m-d H:i:s'),
            'content' => '<p>Pengumuman ini akan otomatis diarsipkan setelah end_date tercapai.</p>',
            'type' => 'urgent',
            'status' => 'active',
            'display_type' => 'notification',
            'is_featured' => false,
            'start_date' => now(),
            'end_date' => now()->addMinutes(10), // Expires in 10 minutes
            'schedule_timezone' => $timezone,
            'repeat_schedule' => 'none',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $announce3 = DB::table('announcements')->where('id', $expiringAnnounce)->first();

        $this->line("✓ Created expiring announcement: ID {$announce3->id}");
        $this->line("  Title: {$announce3->title}");
        $this->line("  Status: {$announce3->status}");
        $this->line("  Expires At: {$announce3->end_date}");
        $this->warn("  ⏳ Will be archived in 10 minutes (run 'php artisan announcements:publish-scheduled' to archive)");

        $this->line('');
        $this->info('Announcement Tests Summary:');
        $this->line("  • Regular (Active): 1 created with status 'active'");
        $this->line("  • Scheduled (Future): 1 created with status 'scheduled'");
        $this->line("  • Expiring (Auto-archive): 1 created with custom expiration");
        $this->line('');
        $this->warn('Next: Run "php artisan announcements:publish-scheduled" to publish scheduled announcements');
    }
}
