<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AnnouncementController extends Controller
{
    /**
     * Get all announcements
     */
    public function index(Request $request)
    {
        $this->authorize('view-announcements');
        try {
            $announcements = DB::table('announcements')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($announcements);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch announcements',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create announcement - DENGAN LOGIC SEMPURNA + SCHEDULING
     */
    public function store(Request $request)
    {
        $this->authorize('create-announcements');
        try {
            $request->validate([
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'type' => 'required|in:general,urgent,maintenance,event',
                'status' => 'required|in:active,inactive,scheduled',
                'start_date' => 'nullable|date_format:Y-m-d',
                'start_time' => 'nullable|date_format:H:i',
                'end_date' => 'nullable|date_format:Y-m-d|after_or_equal:start_date',
                'end_time' => 'nullable|date_format:H:i',
                'is_featured' => 'boolean',
                'display_type' => 'required|in:banner,modal,notification',
                'schedule_timezone' => 'nullable|timezone',
                'repeat_schedule' => 'nullable|in:none,daily,weekly,monthly',
            ]);

            // Validate scheduled announcement
            if ($request->input('status') === 'scheduled') {
                if (!$request->input('start_date') || !$request->input('start_time')) {
                    return response()->json([
                        'message' => 'start_date dan start_time harus diisi untuk announcement scheduled',
                        'error' => 'schedule_required'
                    ], 422);
                }

                // Validate start_date is in the future
                $startDatetime = \Carbon\Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $request->input('start_date') . ' ' . $request->input('start_time'),
                    $request->input('schedule_timezone', config('app.timezone', 'UTC'))
                );

                if ($startDatetime->isBefore(now())) {
                    return response()->json([
                        'message' => 'start_date dan start_time harus waktu masa depan',
                        'error' => 'schedule_past'
                    ], 422);
                }
            }

            // Build start and end timestamps
            $startDatetime = null;
            $endDatetime = null;
            $timezone = $request->input('schedule_timezone', config('app.timezone', 'UTC'));

            if ($request->input('start_date') && $request->input('start_time')) {
                $startDatetime = \Carbon\Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $request->input('start_date') . ' ' . $request->input('start_time'),
                    $timezone
                )->setTimezone('UTC');
            }

            if ($request->input('end_date') && $request->input('end_time')) {
                $endDatetime = \Carbon\Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $request->input('end_date') . ' ' . $request->input('end_time'),
                    $timezone
                )->setTimezone('UTC');
            }

            $id = DB::table('announcements')->insertGetId([
                'title' => $request->input('title'),
                'content' => $request->input('content'),
                'type' => $request->input('type'),
                'status' => $request->input('status'),
                'start_date' => $startDatetime,
                'end_date' => $endDatetime,
                'is_featured' => $request->input('is_featured', false),
                'display_type' => $request->input('display_type'),
                'schedule_timezone' => $timezone,
                'repeat_schedule' => $request->input('repeat_schedule', 'none'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $announcement = DB::table('announcements')->where('id', $id)->first();

            // Send notification to all users HANYA jika status adalah active
            // Jangan kirim notif jika scheduled - kirim sesuai cron schedule saja
            if ($request->input('status') === 'active') {
                try {
                    $this->sendAnnouncementNotification($announcement);
                } catch (\Exception $notificationError) {
                    Log::error('Failed to send announcement notification: ' . $notificationError->getMessage());
                    // Jangan gagal announcement creation karena notification error
                }
            }

            return response()->json([
                'message' => 'Announcement berhasil dibuat dengan scheduling',
                'data' => $announcement,
                'scheduled_for' => $startDatetime ? $startDatetime->toIso8601String() : null,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $ve->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Create announcement error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal membuat announcement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get announcement by ID
     */
    public function show($id)
    {$this->authorize('view-announcements');
        
        try {
            $announcement = DB::table('announcements')->where('id', $id)->first();

            if (!$announcement) {
                return response()->json(['message' => 'Announcement not found'], 404);
            }

            return response()->json($announcement);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch announcement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update announcement - DENGAN LOGIC SEMPURNA
     */
    public function update(Request $request, $id)
    {
        $this->authorize('update-announcements');
        try {
            $request->validate([
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'type' => 'required|in:general,urgent,maintenance,event',
                'status' => 'required|in:active,inactive,scheduled',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'is_featured' => 'boolean',
                'display_type' => 'required|in:banner,modal,notification',
            ]);

            // Check if announcement exists
            $existing = DB::table('announcements')->where('id', $id)->first();
            if (!$existing) {
                return response()->json(['message' => 'Announcement tidak ditemukan'], 404);
            }

            // Validate scheduled date jika status scheduled
            if ($request->input('status') === 'scheduled' && !$request->input('start_date')) {
                return response()->json([
                    'message' => 'start_date harus diisi untuk announcement scheduled',
                    'error' => 'start_date_required'
                ], 422);
            }

            DB::table('announcements')->where('id', $id)->update([
                'title' => $request->input('title'),
                'content' => $request->input('content'),
                'type' => $request->input('type'),
                'status' => $request->input('status'),
                'start_date' => $request->input('start_date'),
                'end_date' => $request->input('end_date'),
                'is_featured' => $request->input('is_featured', false),
                'display_type' => $request->input('display_type'),
                'updated_at' => now(),
            ]);

            $announcement = DB::table('announcements')->where('id', $id)->first();

            // Jika status berubah dari inactive menjadi active, send notification
            if ($existing->status !== 'active' && $request->input('status') === 'active') {
                try {
                    $this->sendAnnouncementNotification($announcement);
                } catch (\Exception $notificationError) {
                    Log::error('Failed to send updated announcement notification: ' . $notificationError->getMessage());
                    // Don't fail update karena notification error
                }
            }

            return response()->json([
                'message' => 'Announcement berhasil diupdate',
                'data' => $announcement
            ]);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $ve->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Update announcement error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal mengupdate announcement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete announcement
     */
    public function destroy($id)
    {
        $this->authorize('delete-announcements');
        try {
            DB::table('announcements')->where('id', $id)->delete();

            return response()->json([
                'message' => 'Announcement deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete announcement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle announcement status dengan logic proper
     */
    public function toggleStatus(Request $request, $id)
    {
        $this->authorize('update-announcements');
        
        try {
            $request->validate([
                'status' => 'required|in:active,inactive,scheduled'
            ]);

            $existing = DB::table('announcements')->where('id', $id)->first();
            if (!$existing) {
                return response()->json(['message' => 'Announcement tidak ditemukan'], 404);
            }

            // Jika status akan berubah ke active dan sebelumnya inactive, kirim notification
            $statusChanged = $existing->status !== $request->input('status');
            $becomingActive = $request->input('status') === 'active' && $existing->status !== 'active';

            DB::table('announcements')->where('id', $id)->update([
                'status' => $request->input('status'),
                'updated_at' => now(),
            ]);

            $announcement = DB::table('announcements')->where('id', $id)->first();

            // Send notification HANYA jika becoming active
            if ($becomingActive) {
                try {
                    $this->sendAnnouncementNotification($announcement);
                } catch (\Exception $notificationError) {
                    Log::error('Failed to send status change notification: ' . $notificationError->getMessage());
                }
            }

            return response()->json([
                'message' => 'Status updated successfully',
                'data' => $announcement
            ]);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $ve->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Toggle announcement status error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal mengupdate status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get active announcements for users
     */
    public function getActiveAnnouncements()
    {
        try {
            $now = now();
            
            $announcements = DB::table('announcements')
                ->where('status', 'active')
                ->where(function ($query) use ($now) {
                    $query->whereNull('start_date')
                        ->orWhere('start_date', '<=', $now);
                })
                ->where(function ($query) use ($now) {
                    $query->whereNull('end_date')
                        ->orWhere('end_date', '>=', $now);
                })
                ->orderBy('is_featured', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($announcements);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch announcements',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send announcement notification to all users - DENGAN LOGIC SEMPURNA
     * PREVENT DUPLICATE: Check jika sudah ada notification untuk announcement ini
     */
    private function sendAnnouncementNotification($announcement)
    {
        try {
            // Get all non-admin users
            $users = \App\Models\User::where('role', '!=', 'admin')->get();

            if ($users->isEmpty()) {
                Log::warning('No users found to send announcement notification');
                return true;
            }

            // Determine notification type based on announcement type dengan mapping yang jelas
            $typeMapping = [
                'urgent' => 'warning',
                'maintenance' => 'info',
                'event' => 'success',
                'general' => 'info',
            ];
            
            $notificationType = $typeMapping[$announcement->type] ?? 'info';
            
            // Prepare announcement title dengan emoji
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
                    // Check jika notification sudah pernah dikirim untuk announcement ini ke user ini
                    // Ini PREVENT DUPLICATE jika announcement diupdate berkali-kali
                    $exists = \App\Models\Notification::where('user_id', $user->id)
                        ->whereRaw("JSON_EXTRACT(data, '$.announcement_id') = ?", [$announcement->id])
                        ->exists();

                    if (!$exists) {
                        \App\Models\Notification::create([
                            'user_id' => $user->id,
                            'type' => $notificationType,
                            'title' => $notificationTitle,
                            'message' => $notificationMessage,
                            'data' => json_encode([
                                'announcement_id' => $announcement->id,
                                'announcement_type' => $announcement->type,
                                'type' => 'announcement',
                                'display_type' => $announcement->display_type,
                                'source' => 'announcement_system',
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

            Log::info("Announcement notification sent: success={$successCount}, failure={$failureCount}");
            return true;
        } catch (\Exception $e) {
            // Log error tapi jangan fail announcement creation
            Log::error('Failed to send announcement notifications: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get announcements scheduled to publish (cronjob endpoint)
     */
    public function getScheduledToPublish(Request $request)
    {
        try {
            $now = now();
            
            // Find announcements that are scheduled and their start_date has passed
            $announcements = DB::table('announcements')
                ->where('status', 'scheduled')
                ->where('start_date', '<=', $now)
                ->where(function($query) {
                    $query->whereNull('end_date')
                          ->orWhere('end_date', '>', now());
                })
                ->get();

            return response()->json([
                'pending_count' => $announcements->count(),
                'announcements' => $announcements,
                'current_time' => $now->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            Log::error('Get scheduled announcements error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Publish a scheduled announcement (called by cronjob or manually)
     */
    public function publishScheduled(Request $request, $id)
    {
        try {
            $announcement = DB::table('announcements')->where('id', $id)->first();
            
            if (!$announcement) {
                return response()->json(['error' => 'Announcement not found'], 404);
            }

            if ($announcement->status !== 'scheduled') {
                return response()->json(['error' => 'Only scheduled announcements can be published'], 400);
            }

            // Update status to active
            DB::table('announcements')->where('id', $id)->update([
                'status' => 'active',
                'updated_at' => now(),
            ]);

            $updated = DB::table('announcements')->where('id', $id)->first();

            // Send notifications
            try {
                $this->sendAnnouncementNotification($updated);
            } catch (\Exception $notificationError) {
                Log::error('Failed to send scheduled announcement notification: ' . $notificationError->getMessage());
            }

            Log::info("Announcement ID {$id} published from scheduled status");

            return response()->json([
                'message' => 'Announcement published successfully',
                'data' => $updated,
                'notification_sent_at' => now()->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            Log::error('Publish scheduled announcement error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Archive announcement when end_date passes
     */
    public function archiveExpired(Request $request)
    {
        try {
            $now = now();
            
            // Find active announcements with end_date in the past
            $expired = DB::table('announcements')
                ->where('status', 'active')
                ->whereNotNull('end_date')
                ->where('end_date', '<=', $now)
                ->get();

            // Archive them
            DB::table('announcements')
                ->where('status', 'active')
                ->whereNotNull('end_date')
                ->where('end_date', '<=', $now)
                ->update([
                    'status' => 'inactive',
                    'archived_at' => now(),
                    'updated_at' => now(),
                ]);

            Log::info("Archived {$expired->count()} expired announcements");

            return response()->json([
                'archived_count' => $expired->count(),
                'announcements' => $expired,
            ]);
        } catch (\Exception $e) {
            Log::error('Archive expired announcements error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Send announcement notifications to users via multiple channels
     * Supports: Email, In-App, Push Notifications
     */
    public function notify(Request $request)
    {
        try {
            $request->validate([
                'announcement_id' => 'required|integer|exists:announcements,id',
                'recipients' => 'nullable|in:all,department,role,specific',
                'channels' => 'nullable|array|in:email,in_app,push',
            ]);

            $announcementId = $request->input('announcement_id');
            $recipients = $request->input('recipients', 'all');
            $channels = $request->input('channels', ['email', 'in_app', 'push']);

            // Fetch the announcement
            $announcement = DB::table('announcements')->find($announcementId);
            if (!$announcement) {
                return response()->json([
                    'message' => 'Announcement not found',
                    'error' => 'announcement_not_found'
                ], 404);
            }

            Log::info('[AnnouncementNotifier] Starting notification dispatch', [
                'announcement_id' => $announcementId,
                'title' => $announcement->title,
                'recipients_type' => $recipients,
                'channels' => $channels,
                'timestamp' => now()->toIso8601String(),
            ]);

            $stats = [
                'email_sent' => 0,
                'in_app_created' => 0,
                'push_sent' => 0,
                'failures' => 0,
            ];

            // Get recipient users
            $query = \App\Models\User::class;
            
            if ($recipients === 'all') {
                $users = $query::where('is_active', true)->get();
            } elseif ($recipients === 'department') {
                // Filter by department - adjust based on your user model
                $users = $query::where('is_active', true)->get();
            } elseif ($recipients === 'role') {
                // Filter by role - adjust based on your user model
                $users = $query::where('is_active', true)->get();
            } else {
                $users = collect();
            }

            // Send via each channel
            foreach ($users as $user) {
                try {
                    // 📧 Email Channel
                    if (in_array('email', $channels) && $user->email) {
                        // Queue email for async sending
                        \Mail::queue(new \App\Mail\AnnouncementNotificationMail($announcement, $user));
                        $stats['email_sent']++;
                    }

                    // 🔔 In-App Notifications Channel
                    if (in_array('in_app', $channels)) {
                        DB::table('notifications')->insert([
                            'user_id' => $user->id,
                            'type' => 'announcement',
                            'title' => $announcement->title,
                            'message' => strip_tags(substr($announcement->content, 0, 200)) . 
                                         (strlen($announcement->content) > 200 ? '...' : ''),
                            'data' => json_encode([
                                'announcement_id' => $announcement->id,
                                'announcement_type' => $announcement->type,
                                'channel' => 'in_app',
                                'sent_at' => now()->toIso8601String(),
                            ]),
                            'is_read' => false,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        $stats['in_app_created']++;
                    }

                    // 📱 Push Notifications Channel
                    if (in_array('push', $channels) && method_exists($user, 'notifyPush')) {
                        // Implement based on your push notification service
                        // Example: Firebase, OneSignal, Pusher, etc.
                        $user->notifyPush($announcement->title, $announcement->content);
                        $stats['push_sent']++;
                    }

                } catch (\Exception $userError) {
                    Log::error('[AnnouncementNotifier] Error sending to user', [
                        'user_id' => $user->id,
                        'error' => $userError->getMessage(),
                    ]);
                    $stats['failures']++;
                }
            }

            Log::info('[AnnouncementNotifier] Notification dispatch completed', [
                'announcement_id' => $announcementId,
                'stats' => $stats,
                'total_users' => $users->count(),
            ]);

            return response()->json([
                'message' => 'Announcements notifications sent/queued successfully',
                'stats' => $stats,
                'total_recipients' => $users->count(),
                'sent_at' => now()->toIso8601String(),
            ]);

        } catch (\Exception $e) {
            Log::error('[AnnouncementNotifier] Failed to send notifications: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Failed to send notifications',
                'error' => $e->getMessage(),
                'status' => 'failed'
            ], 500);
        }
    }
}

