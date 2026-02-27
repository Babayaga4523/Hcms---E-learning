<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PublishScheduledAnnouncements extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'announcements:publish-scheduled {--force : Force publish without time check}';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Publish announcements that are scheduled and ready to be published';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            $now = now();
            $force = $this->option('force');

            // Find scheduled announcements ready to publish
            // Condition: status = 'scheduled' AND start_date <= now()
            $query = DB::table('announcements')
                ->where('status', 'scheduled')
                ->whereNotNull('start_date');

            if (!$force) {
                $query->where('start_date', '<=', $now);
            }

            $scheduledAnnouncements = $query->get();

            if ($scheduledAnnouncements->isEmpty()) {
                $this->info('❌ No scheduled announcements to publish');
            } else {
                $this->info("📢 Found {$scheduledAnnouncements->count()} scheduled announcements to publish");

                $publishedCount = 0;

                foreach ($scheduledAnnouncements as $announcement) {
                    try {
                        $this->publishAnnouncement($announcement);
                        $publishedCount++;
                    } catch (\Exception $e) {
                        Log::error("Error publishing announcement {$announcement->id}: " . $e->getMessage());
                        $this->error("❌ Error publishing announcement ID {$announcement->id}: " . $e->getMessage());
                    }
                }

                $this->line("✓ Successfully published {$publishedCount}/{$scheduledAnnouncements->count()} announcements");
            }

            // Archive expired announcements
            $expiredCount = $this->archiveExpired();
            if ($expiredCount > 0) {
                $this->line("🗂️  Archived {$expiredCount} expired announcements");
            }

            return Command::SUCCESS;
        } catch (\Exception $e) {
            Log::error('PublishScheduledAnnouncements command error: ' . $e->getMessage());
            $this->error("❌ Command error: " . $e->getMessage());
            return Command::FAILURE;
        }
    }

    /**
     * Publish a single announcement
     */
    private function publishAnnouncement($announcement)
    {
        // Update status to active
        DB::table('announcements')
            ->where('id', $announcement->id)
            ->update([
                'status' => 'active',
                'updated_at' => now(),
            ]);

        $this->line("Publishing announcement: {$announcement->title} (ID: {$announcement->id})");

        // Send notifications to all non-admin users
        $users = User::where('role', '!=', 'admin')->get();

        if ($users->isEmpty()) {
            $this->warn("⚠️  No users found to send announcement notification");
            return;
        }

        // Determine notification type based on announcement type
        $typeMapping = [
            'urgent' => 'warning',
            'maintenance' => 'info',
            'event' => 'success',
            'general' => 'info',
        ];

        $notificationType = $typeMapping[$announcement->type] ?? 'info';

        $emojiMap = [
            'urgent' => '🚨',
            'maintenance' => '🔧',
            'event' => '📅',
            'general' => '📢',
        ];

        $emoji = $emojiMap[$announcement->type] ?? '📢';
        $notificationTitle = $emoji . ' ' . $announcement->title;
        $notificationMessage = strip_tags(substr($announcement->content, 0, 200)) . (strlen($announcement->content) > 200 ? '...' : '');

        $successCount = 0;
        $failureCount = 0;

        foreach ($users as $user) {
            try {
                // Check if notification already sent
                $exists = Notification::where('user_id', $user->id)
                    ->whereRaw("JSON_EXTRACT(data, '$.announcement_id') = ?", [$announcement->id])
                    ->exists();

                if (!$exists) {
                    Notification::create([
                        'user_id' => $user->id,
                        'type' => $notificationType,
                        'title' => $notificationTitle,
                        'message' => $notificationMessage,
                        'data' => json_encode([
                            'announcement_id' => $announcement->id,
                            'type' => 'announcement',
                            'source' => 'admin_panel',
                            'scheduled_published_at' => now()->toIso8601String(),
                        ]),
                        'is_read' => false,
                    ]);
                    $successCount++;
                }
            } catch (\Exception $userError) {
                Log::error("Failed to create notification for user {$user->id}: " . $userError->getMessage());
                $failureCount++;
            }
        }

        $this->line("✓ Announcement published, notifications sent to {$successCount} users");

        if ($failureCount > 0) {
            $this->warn("⚠️  Failed to send notification to {$failureCount} users");
        }

        Log::info("Announcement ID {$announcement->id} published from scheduled status, notifications sent to {$successCount} users");
    }

    /**
     * Archive expired announcements
     */
    private function archiveExpired()
    {
        try {
            $now = now();

            $expiredCount = DB::table('announcements')
                ->where('status', 'active')
                ->whereNotNull('end_date')
                ->where('end_date', '<=', $now)
                ->count();

            DB::table('announcements')
                ->where('status', 'active')
                ->whereNotNull('end_date')
                ->where('end_date', '<=', $now)
                ->update([
                    'status' => 'inactive',
                    'archived_at' => now(),
                    'updated_at' => now(),
                ]);

            Log::info("Archived {$expiredCount} expired announcements");

            return $expiredCount;
        } catch (\Exception $e) {
            Log::error('Archive expired announcements error: ' . $e->getMessage());
            return 0;
        }
    }
}
