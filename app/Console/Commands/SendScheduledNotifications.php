<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ProgramNotification;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class SendScheduledNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:send-scheduled {--force : Force send without time check}';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Send notifications that are scheduled and ready to be sent';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            $now = now();
            $force = $this->option('force');

            // Find scheduled notifications ready to send
            // Condition: is_scheduled = true AND status = 'scheduled' AND scheduled_at <= now()
            $query = ProgramNotification::where('is_scheduled', true)
                ->where('status', 'scheduled');

            if (!$force) {
                $query->where('scheduled_at', '<=', $now);
            }

            $scheduledNotifications = $query->get();

            if ($scheduledNotifications->isEmpty()) {
                $this->info('❌ No scheduled notifications to send');
                return Command::SUCCESS;
            }

            $this->info("📨 Found {$scheduledNotifications->count()} scheduled notifications to send");

            $sentCount = 0;
            $failedCount = 0;

            foreach ($scheduledNotifications as $notification) {
                try {
                    $this->info("Sending notification: {$notification->title} (ID: {$notification->id})");

                    // Get target users
                    $targetUsers = $this->getTargetUsers($notification->recipients, $notification->recipient_ids);

                    if ($targetUsers->isEmpty()) {
                        $this->warn("⚠️  No target users found for notification ID {$notification->id}");
                        // Mark as sent anyway but with 0 recipients
                        $notification->status = 'sent';
                        $notification->recipients_count = 0;
                        $notification->stats = json_encode(['sent' => 0, 'read' => 0, 'clicked' => 0, 'failure' => 0]);
                        $notification->sent_at = now();
                        $notification->save();
                        $failedCount++;
                        continue;
                    }

                    $successCount = 0;
                    $errors = [];

                    foreach ($targetUsers as $user) {
                        try {
                            // Check if already sent to this user
                            $exists = Notification::where('user_id', $user->id)
                                ->whereRaw("JSON_EXTRACT(data, '$.program_notification_id') = ?", [$notification->id])
                                ->exists();

                            if (!$exists) {
                                Notification::create([
                                    'user_id' => $user->id,
                                    'type' => $notification->type,
                                    'title' => $notification->title,
                                    'message' => $notification->message,
                                    'data' => json_encode([
                                        'program_notification_id' => $notification->id,
                                        'type' => 'system_notification',
                                        'source' => 'admin_panel',
                                        'recipients_type' => $notification->recipients,
                                        'scheduled_sent_at' => now()->toIso8601String(),
                                    ]),
                                    'is_read' => false,
                                ]);
                                $successCount++;
                            }
                        } catch (\Exception $userError) {
                            Log::error("Failed to send notification {$notification->id} to user {$user->id}: " . $userError->getMessage());
                            $errors[] = $user->id;
                        }
                    }

                    // Update notification status and stats
                    $notification->status = 'sent';
                    $notification->sent_at = now();
                    $notification->recipients_count = $successCount;
                    $notification->stats = json_encode([
                        'sent' => $successCount,
                        'read' => 0,
                        'clicked' => 0,
                        'failure' => count($errors)
                    ]);
                    $notification->save();

                    $this->line("✓ Notification ID {$notification->id} sent to {$successCount} users");
                    $sentCount++;

                    if (!empty($errors)) {
                        $this->warn("⚠️  Failed to send to " . count($errors) . " users");
                    }
                } catch (\Exception $notificationError) {
                    Log::error("Error processing scheduled notification {$notification->id}: " . $notificationError->getMessage());
                    $this->error("❌ Error: " . $notificationError->getMessage());
                    $failedCount++;
                }
            }

            $this->line('');
            $this->info("======= SUMMARY =======");
            $this->line("✓ Successfully sent: {$sentCount}");
            $this->line("✗ Failed: {$failedCount}");
            $this->info("=======================");

            return Command::SUCCESS;
        } catch (\Exception $e) {
            Log::error('SendScheduledNotifications command error: ' . $e->getMessage());
            $this->error("❌ Command error: " . $e->getMessage());
            return Command::FAILURE;
        }
    }

    /**
     * Get target users berdasarkan recipients type
     */
    private function getTargetUsers($recipientsType, $recipientIds)
    {
        try {
            switch ($recipientsType) {
                case 'all':
                    // Get all non-admin users
                    return User::where('role', '!=', 'admin')->get();

                case 'role':
                    // Get users by role (dari recipient_ids array)
                    if (empty($recipientIds)) {
                        return collect();
                    }
                    return User::whereIn('role', $recipientIds)->get();

                case 'user':
                    // Get specific users (dari recipient_ids array)
                    if (empty($recipientIds)) {
                        return collect();
                    }
                    return User::whereIn('id', $recipientIds)->get();

                default:
                    return collect();
            }
        } catch (\Exception $e) {
            Log::error("Error getting target users: " . $e->getMessage());
            return collect();
        }
    }
}
