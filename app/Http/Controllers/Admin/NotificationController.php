<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProgramNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    /**
     * Get all notifications
     */
    public function index(Request $request)
    {
        try {
            $notifications = ProgramNotification::orderBy('created_at', 'desc')->get();

            return response()->json($notifications);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send notification to users - DENGAN LOGIC SEMPURNA
     */
    public function send(Request $request)
    {
        try {
            $recipients = $request->input('recipients');
            $recipientIds = $request->input('recipient_ids', []);
            
            // Validation: Recipient IDs harus ada jika recipients type adalah 'role' atau 'user'
            $rules = [
                'title' => 'required|string|max:255',
                'message' => 'required|string',
                'type' => 'required|in:info,warning,success,error',
                'recipients' => 'required|in:all,role,user',
                'is_scheduled' => 'boolean',
                'scheduled_at' => 'nullable|date_format:Y-m-d\TH:i',
            ];
            
            // Conditional validation untuk recipient_ids
            if ($recipients === 'role' || $recipients === 'user') {
                $rules['recipient_ids'] = 'required|array|min:1';
            } else {
                $rules['recipient_ids'] = 'nullable|array';
            }
            
            $request->validate($rules);
            
            // Validate scheduled_at jika is_scheduled true
            if ($request->input('is_scheduled')) {
                if (!$request->input('scheduled_at')) {
                    return response()->json([
                        'message' => 'scheduled_at harus diisi untuk notifikasi scheduled',
                        'error' => 'scheduled_at_required'
                    ], 422);
                }
                
                $scheduledTime = \Carbon\Carbon::parse($request->input('scheduled_at'));
                if ($scheduledTime->isPast()) {
                    return response()->json([
                        'message' => 'scheduled_at harus waktu masa depan',
                        'error' => 'scheduled_at_past'
                    ], 422);
                }
            }

            $notification = new ProgramNotification();
            $notification->title = $request->input('title');
            $notification->message = $request->input('message');
            $notification->type = $request->input('type');
            $notification->status = $request->input('is_scheduled') ? 'scheduled' : 'sent';
            $notification->recipients = $recipients;
            $notification->recipient_ids = $recipientIds;
            $notification->is_scheduled = $request->input('is_scheduled', false);
            $notification->scheduled_at = $request->input('scheduled_at');
            $notification->recipients_count = 0;
            $notification->stats = json_encode(['sent' => 0, 'read' => 0, 'clicked' => 0, 'failure' => 0]);

            // Save notification first to get ID
            $notification->save();

            // If not scheduled, send immediately
            if (!$notification->is_scheduled) {
                try {
                    // Get target users dengan validation
                    $targetUsers = $this->getTargetUsers($recipients, $recipientIds);
                    
                    if ($targetUsers->isEmpty()) {
                        $notification->delete();
                        return response()->json([
                            'message' => 'Tidak ada target user yang sesuai dengan kriteria',
                            'error' => 'no_target_users'
                        ], 422);
                    }
                    
                    // Create individual notification records for each user
                    $successCount = 0;
                    $failureCount = 0;
                    
                    foreach ($targetUsers as $user) {
                        try {
                            // Check jika notification sudah pernah dikirim ke user ini untuk notification yang sama
                            // (prevent duplicate)
                            $exists = \App\Models\Notification::where('user_id', $user->id)
                                ->whereRaw("JSON_EXTRACT(data, '$.program_notification_id') = ?", [$notification->id])
                                ->exists();
                            
                            if (!$exists) {
                                \App\Models\Notification::create([
                                    'user_id' => $user->id,
                                    'type' => $request->input('type'),
                                    'title' => $request->input('title'),
                                    'message' => $request->input('message'),
                                    'data' => json_encode([
                                        'program_notification_id' => $notification->id,
                                        'type' => 'system_notification',
                                        'source' => 'admin_panel',
                                        'recipients_type' => $recipients,
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

                    // Update recipients count dan stats
                    $notification->recipients_count = $successCount;
                    $notification->stats = json_encode([
                        'sent' => $successCount,
                        'read' => 0,
                        'clicked' => 0,
                        'failure' => $failureCount
                    ]);
                    $notification->save();
                } catch (\Exception $getTargetError) {
                    $notification->delete();
                    return response()->json([
                        'message' => $getTargetError->getMessage(),
                        'error' => 'target_users_error'
                    ], 422);
                }
            }

            return response()->json([
                'message' => 'Notification ' . ($notification->is_scheduled ? 'dijadwalkan' : 'berhasil dikirim'),
                'data' => $notification
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $ve->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Send notification error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal mengirim notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Preview recipients sebelum send notification
     * Endpoint ini untuk show admin siapa saja yang akan menerima notification
     */
    public function previewRecipients(Request $request)
    {
        try {
            $request->validate([
                'recipients' => 'required|in:all,role,user',
                'recipient_ids' => 'nullable|array',
            ]);

            $recipientsType = $request->input('recipients');
            $recipientIds = $request->input('recipient_ids', []);

            // Get target users dengan validation
            $targetUsers = $this->getTargetUsers($recipientsType, $recipientIds);

            // Return preview data
            $groupedByRole = $targetUsers->groupBy('role');

            return response()->json([
                'total_recipients' => $targetUsers->count(),
                'recipients_type' => $recipientsType,
                'breakdown_by_role' => $groupedByRole->map(function ($users, $role) {
                    return [
                        'role' => $role,
                        'count' => $users->count(),
                    ];
                })->values(),
                'sample_recipients' => $targetUsers->take(5)->map(fn ($user) => [
                    'id' => $user->id,
                    'name' => $user->name ?? 'N/A',
                    'email' => $user->email,
                    'role' => $user->role,
                ])->toArray(),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal preview recipients',
                'error' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Get statistics dari notification yang sudah dikirim
     */
    public function getStatistics($id)
    {
        try {
            $notification = ProgramNotification::findOrFail($id);
            
            // Parse stats JSON
            $stats = json_decode($notification->stats, true);
            
            // Calculate additional metrics
            $readPercentage = $notification->recipients_count > 0 
                ? round(($stats['read'] / $notification->recipients_count) * 100, 2)
                : 0;

            return response()->json([
                'id' => $notification->id,
                'title' => $notification->title,
                'status' => $notification->status,
                'recipients_count' => $notification->recipients_count,
                'stats' => $stats,
                'read_percentage' => $readPercentage,
                'created_at' => $notification->created_at,
                'updated_at' => $notification->updated_at,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Notification tidak ditemukan',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Get target users based on recipients type - DENGAN VALIDATION YANG SEMPURNA
     */
    private function getTargetUsers($recipientsType, $recipientIds = [])
    {
        $query = \App\Models\User::query();
        $validRoles = ['admin', 'trainer', 'user', 'participant']; // Adjust sesuai roles di system

        switch ($recipientsType) {
            case 'all':
                // All users except admins
                $query->where('role', '!=', 'admin');
                break;
                
            case 'role':
                // Specific role dengan validation
                if (empty($recipientIds)) {
                    throw new \Exception('recipient_ids harus diisi untuk tipe recipients "role"');
                }
                
                // Validate roles exist
                $invalidRoles = array_diff($recipientIds, $validRoles);
                if (!empty($invalidRoles)) {
                    throw new \Exception('Role tidak valid: ' . implode(', ', $invalidRoles));
                }
                
                $query->whereIn('role', $recipientIds);
                break;
                
            case 'user':
                // Specific users dengan validation
                if (empty($recipientIds)) {
                    throw new \Exception('recipient_ids harus diisi untuk tipe recipients "user"');
                }
                
                // Validate user ids exist
                $existingCount = \App\Models\User::whereIn('id', $recipientIds)->count();
                if ($existingCount !== count($recipientIds)) {
                    throw new \Exception('Beberapa user ID tidak ditemukan (expected: ' . count($recipientIds) . ', found: ' . $existingCount . ')');
                }
                
                $query->whereIn('id', $recipientIds);
                break;
                
            default:
                throw new \Exception('Recipient type tidak valid: ' . $recipientsType);
        }

        return $query->get();
    }

    /**
     * Get notification by ID
     */
    public function show($id)
    {
        try {
            $notification = ProgramNotification::findOrFail($id);

            return response()->json($notification);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Notification not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Delete notification
     */
    public function destroy($id)
    {
        try {
            $notification = ProgramNotification::findOrFail($id);
            $notification->delete();

            return response()->json([
                'message' => 'Notification deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user notifications
     */
    public function getUserNotifications(Request $request)
    {
        try {
            $userId = $request->user()->id;
            
            // Get notifications from the notifications table (per-user)
            $notifications = \App\Models\Notification::where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get();

            return response()->json($notifications);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch user notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($id)
    {
        try {
            $userId = request()->user()->id;
            
            $notification = \App\Models\Notification::where('id', $id)
                ->where('user_id', $userId)
                ->firstOrFail();
            
            $notification->markAsRead();
            
            return response()->json([
                'message' => 'Marked as read',
                'data' => $notification
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to mark as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get unread notifications count
     */
    public function getUnreadCount(Request $request)
    {
        try {
            $userId = $request->user()->id;
            
            $count = \App\Models\Notification::where('user_id', $userId)
                ->where('is_read', false)
                ->count();
            
            return response()->json(['count' => $count]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to get unread count',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete notification for user
     */
    public function deleteNotification(Request $request, $id)
    {
        try {
            $userId = $request->user()->id;
            
            $notification = \App\Models\Notification::where('id', $id)
                ->where('user_id', $userId)
                ->first();
            
            if (!$notification) {
                return response()->json([
                    'message' => 'Notification not found'
                ], 404);
            }
            
            $notification->delete();
            
            return response()->json([
                'message' => 'Notification deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
