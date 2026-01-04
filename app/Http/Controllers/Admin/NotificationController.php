<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProgramNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

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
     * Send notification to users
     */
    public function send(Request $request)
    {
        try {
            $request->validate([
                'title' => 'required|string|max:255',
                'message' => 'required|string',
                'type' => 'required|in:info,warning,success,error',
                'recipients' => 'required|in:all,role,user',
                'recipient_ids' => 'array',
                'is_scheduled' => 'boolean',
                'scheduled_at' => 'nullable|date_format:Y-m-d\TH:i',
            ]);

            $notification = new ProgramNotification();
            $notification->title = $request->input('title');
            $notification->message = $request->input('message');
            $notification->type = $request->input('type');
            $notification->status = $request->input('is_scheduled') ? 'scheduled' : 'sent';
            $notification->recipients = $request->input('recipients');
            $notification->recipient_ids = $request->input('recipient_ids', []);
            $notification->is_scheduled = $request->input('is_scheduled', false);
            $notification->scheduled_at = $request->input('scheduled_at');
            $notification->recipients_count = 0;
            $notification->stats = json_encode(['sent' => 0, 'read' => 0, 'clicked' => 0]);

            // Save notification first to get ID
            $notification->save();

            // If not scheduled, send immediately
            if (!$notification->is_scheduled) {
                // Get target users
                $targetUsers = $this->getTargetUsers($request->input('recipients'), $request->input('recipient_ids', []));
                
                // Create individual notification records for each user
                foreach ($targetUsers as $user) {
                    \App\Models\Notification::create([
                        'user_id' => $user->id,
                        'type' => $request->input('type'),
                        'title' => $request->input('title'),
                        'message' => $request->input('message'),
                        'data' => json_encode([
                            'program_notification_id' => $notification->id,
                            'type' => 'system_notification'
                        ]),
                        'is_read' => false,
                    ]);
                }

                // Update recipients count
                $notification->recipients_count = $targetUsers->count();
                $notification->stats = json_encode(['sent' => $targetUsers->count(), 'read' => 0, 'clicked' => 0]);
                $notification->save();
            }

            return response()->json([
                'message' => 'Notification sent successfully',
                'data' => $notification
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get target users based on recipients type
     */
    private function getTargetUsers($recipientsType, $recipientIds = [])
    {
        $query = \App\Models\User::query();

        switch ($recipientsType) {
            case 'all':
                // All users except admins
                $query->where('role', '!=', 'admin');
                break;
            case 'role':
                // Specific role
                if (!empty($recipientIds)) {
                    $query->whereIn('role', $recipientIds);
                }
                break;
            case 'user':
                // Specific users
                if (!empty($recipientIds)) {
                    $query->whereIn('id', $recipientIds);
                }
                break;
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
