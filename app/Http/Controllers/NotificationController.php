<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * User Notification Controller
 * Handle user notification operations dengan clean logic
 */
class NotificationController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get user notifications
     * GET /api/user/notifications
     */
    public function index(Request $request)
    {
        try {
            $userId = $request->user()->id;
            $limit = $request->input('limit', 50);
            $search = $request->input('search', '');
            $type = $request->input('type', '');

            // Debug: Create sample notification if none exist
            $existingCount = Notification::where('user_id', $userId)->count();
            if ($existingCount === 0) {
                Notification::create([
                    'user_id' => $userId,
                    'type' => 'success',
                    'title' => '✅ Welcome to Notifications!',
                    'message' => 'Your notification system is now active',
                    'data' => json_encode(['system' => true]),
                    'is_read' => false,
                ]);
            }

            if ($search) {
                $notifications = $this->notificationService->searchNotifications($userId, $search, $limit);
            } elseif ($type) {
                $notifications = $this->notificationService->filterByType($userId, $type, $limit);
            } else {
                $notifications = $this->notificationService->getUserNotifications($userId, $limit);
            }

            return response()->json($notifications);
        } catch (\Exception $e) {
            Log::error('Failed to get notifications: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get notification statistics
     * GET /api/user/notifications/stats
     */
    public function getStats(Request $request)
    {
        try {
            $userId = $request->user()->id;
            $stats = $this->notificationService->getUserNotificationStats($userId);

            return response()->json($stats);
        } catch (\Exception $e) {
            Log::error('Failed to get stats: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch notification stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get unread count
     * GET /api/user/notifications/unread-count
     */
    public function getUnreadCount(Request $request)
    {
        try {
            $userId = $request->user()->id;
            $count = $this->notificationService->getUnreadCount($userId);

            return response()->json([
                'unread_count' => $count,
                'timestamp' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get unread count: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch unread count',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark notification as read
     * PATCH /api/user/notifications/{id}/read
     */
    public function markAsRead(Request $request, $id)
    {
        try {
            $userId = $request->user()->id;
            $result = $this->notificationService->markAsRead($id, $userId);

            if (!$result['success']) {
                return response()->json([
                    'message' => 'Notification not found',
                    'error' => $result['error']
                ], 404);
            }

            return response()->json([
                'message' => 'Marked as read',
                'data' => $result['notification']
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to mark as read: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to mark as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark all as read
     * PATCH /api/user/notifications/mark-all-read
     */
    public function markAllAsRead(Request $request)
    {
        try {
            $userId = $request->user()->id;
            $result = $this->notificationService->markAllAsRead($userId);

            return response()->json([
                'message' => 'All notifications marked as read',
                'updated_count' => $result['updated_count']
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to mark all as read: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to mark all as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete notification
     * DELETE /api/user/notifications/{id}
     */
    public function delete(Request $request, $id)
    {
        try {
            $userId = $request->user()->id;
            $result = $this->notificationService->deleteNotification($id, $userId);

            if (!$result['success']) {
                return response()->json([
                    'message' => 'Notification not found'
                ], 404);
            }

            return response()->json([
                'message' => 'Notification deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete notification: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete all notifications
     * DELETE /api/user/notifications/all
     */
    public function deleteAll(Request $request)
    {
        try {
            $userId = $request->user()->id;
            $result = $this->notificationService->deleteAllNotifications($userId);

            return response()->json([
                'message' => 'All notifications deleted',
                'deleted_count' => $result['deleted_count']
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete all notifications: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single notification
     * GET /api/user/notifications/{id}
     */
    public function show(Request $request, $id)
    {
        try {
            $userId = $request->user()->id;
            
            $notification = Notification::where('id', $id)
                ->where('user_id', $userId)
                ->firstOrFail();

            // Mark as read jika belum
            if (!$notification->is_read) {
                $notification->update([
                    'is_read' => true,
                    'read_at' => now(),
                ]);
            }

            return response()->json([
                'id' => $notification->id,
                'type' => $notification->type,
                'title' => $notification->title,
                'message' => $notification->message,
                'data' => json_decode($notification->data, true),
                'is_read' => (bool) $notification->is_read,
                'read_at' => $notification->read_at,
                'created_at' => $notification->created_at,
                'updated_at' => $notification->updated_at,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get notification: ' . $e->getMessage());
            return response()->json([
                'message' => 'Notification not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }
}
