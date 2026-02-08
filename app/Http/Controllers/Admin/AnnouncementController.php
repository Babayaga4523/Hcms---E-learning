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
     * Create announcement - DENGAN LOGIC SEMPURNA
     */
    public function store(Request $request)
    {
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

            // Validate scheduled date jika status scheduled
            if ($request->input('status') === 'scheduled' && !$request->input('start_date')) {
                return response()->json([
                    'message' => 'start_date harus diisi untuk announcement scheduled',
                    'error' => 'start_date_required'
                ], 422);
            }

            $id = DB::table('announcements')->insertGetId([
                'title' => $request->input('title'),
                'content' => $request->input('content'),
                'type' => $request->input('type'),
                'status' => $request->input('status'),
                'start_date' => $request->input('start_date'),
                'end_date' => $request->input('end_date'),
                'is_featured' => $request->input('is_featured', false),
                'display_type' => $request->input('display_type'),
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
                'message' => 'Announcement berhasil dibuat',
                'data' => $announcement
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
    {
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
}
