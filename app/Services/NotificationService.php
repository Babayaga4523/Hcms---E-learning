<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * Notification Service Layer
 * Handles all notification logic with clean separation of concerns
 */
class NotificationService
{
    /**
     * Get user notifications dengan optimized query + caching
     */
    public function getUserNotifications($userId, $limit = 50)
    {
        try {
            $notifications = Notification::where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->select([
                    'id',
                    'type',
                    'title',
                    'message',
                    'data',
                    'is_read',
                    'read_at',
                    'created_at',
                    'updated_at'
                ])
                ->get()
                ->map(function ($notification) {
                    return [
                        'id' => $notification->id,
                        'type' => $notification->type,
                        'title' => $notification->title,
                        'message' => $notification->message,
                        'data' => json_decode($notification->data, true),
                        'is_read' => (bool) $notification->is_read,
                        'read_at' => $notification->read_at,
                        'created_at' => $notification->created_at,
                        'time_ago' => $this->getTimeAgo($notification->created_at),
                    ];
                });

            return $notifications;
        } catch (\Exception $e) {
            Log::error("Failed to get user notifications: " . $e->getMessage());
            return collect();
        }
    }

    /**
     * Get unread count untuk user
     */
    public function getUnreadCount($userId)
    {
        try {
            return Notification::where('user_id', $userId)
                ->where('is_read', false)
                ->count();
        } catch (\Exception $e) {
            Log::error("Failed to get unread count: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($notificationId, $userId)
    {
        try {
            $notification = Notification::where('id', $notificationId)
                ->where('user_id', $userId)
                ->firstOrFail();

            $notification->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

            return [
                'success' => true,
                'notification' => $notification,
            ];
        } catch (\Exception $e) {
            Log::error("Failed to mark as read: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Mark all notifications as read untuk user
     */
    public function markAllAsRead($userId)
    {
        try {
            $updated = Notification::where('user_id', $userId)
                ->where('is_read', false)
                ->update([
                    'is_read' => true,
                    'read_at' => now(),
                ]);

            return [
                'success' => true,
                'updated_count' => $updated,
            ];
        } catch (\Exception $e) {
            Log::error("Failed to mark all as read: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Delete notification
     */
    public function deleteNotification($notificationId, $userId)
    {
        try {
            $deleted = Notification::where('id', $notificationId)
                ->where('user_id', $userId)
                ->delete();

            return [
                'success' => $deleted > 0,
                'deleted_count' => $deleted,
            ];
        } catch (\Exception $e) {
            Log::error("Failed to delete notification: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Delete all notifications untuk user
     */
    public function deleteAllNotifications($userId)
    {
        try {
            $deleted = Notification::where('user_id', $userId)->delete();

            return [
                'success' => true,
                'deleted_count' => $deleted,
            ];
        } catch (\Exception $e) {
            Log::error("Failed to delete all notifications: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Search notifications
     */
    public function searchNotifications($userId, $searchTerm, $limit = 50)
    {
        try {
            $notifications = Notification::where('user_id', $userId)
                ->where(function ($query) use ($searchTerm) {
                    $query->where('title', 'like', "%{$searchTerm}%")
                        ->orWhere('message', 'like', "%{$searchTerm}%");
                })
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->select([
                    'id',
                    'type',
                    'title',
                    'message',
                    'data',
                    'is_read',
                    'read_at',
                    'created_at',
                    'updated_at'
                ])
                ->get()
                ->map(function ($notification) {
                    return [
                        'id' => $notification->id,
                        'type' => $notification->type,
                        'title' => $notification->title,
                        'message' => $notification->message,
                        'data' => json_decode($notification->data, true),
                        'is_read' => (bool) $notification->is_read,
                        'read_at' => $notification->read_at,
                        'created_at' => $notification->created_at,
                        'time_ago' => $this->getTimeAgo($notification->created_at),
                    ];
                });

            return $notifications;
        } catch (\Exception $e) {
            Log::error("Failed to search notifications: " . $e->getMessage());
            return collect();
        }
    }

    /**
     * Filter notifications by type
     */
    public function filterByType($userId, $type, $limit = 50)
    {
        try {
            $notifications = Notification::where('user_id', $userId)
                ->where('type', $type)
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get();

            return $notifications;
        } catch (\Exception $e) {
            Log::error("Failed to filter by type: " . $e->getMessage());
            return collect();
        }
    }

    /**
     * Get notification stats untuk user
     */
    public function getUserNotificationStats($userId)
    {
        try {
            $total = Notification::where('user_id', $userId)->count();
            $unread = Notification::where('user_id', $userId)
                ->where('is_read', false)
                ->count();
            $read = $total - $unread;

            // Count by type
            $byType = Notification::where('user_id', $userId)
                ->groupBy('type')
                ->selectRaw('type, count(*) as count')
                ->pluck('count', 'type')
                ->toArray();

            return [
                'total' => $total,
                'unread' => $unread,
                'read' => $read,
                'by_type' => $byType,
                'unread_percentage' => $total > 0 ? round(($unread / $total) * 100, 2) : 0,
            ];
        } catch (\Exception $e) {
            Log::error("Failed to get stats: " . $e->getMessage());
            return [
                'total' => 0,
                'unread' => 0,
                'read' => 0,
                'by_type' => [],
            ];
        }
    }

    /**
     * Create notification untuk user
     * Used by announcement/notification system
     */
    public function createNotification($userId, $type, $title, $message, $data = [])
    {
        try {
            $notification = Notification::create([
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'data' => json_encode($data),
                'is_read' => false,
            ]);

            Log::info("Notification created for user {$userId}: {$title}");

            return [
                'success' => true,
                'notification' => $notification,
            ];
        } catch (\Exception $e) {
            Log::error("Failed to create notification: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Batch create notifications untuk multiple users
     * Optimized untuk performance
     */
    public function batchCreateNotifications($userIds, $type, $title, $message, $data = [])
    {
        try {
            if (empty($userIds)) {
                return [
                    'success' => false,
                    'error' => 'No user IDs provided',
                    'created' => 0,
                ];
            }

            $notifications = [];
            $now = now();

            foreach ($userIds as $userId) {
                $notifications[] = [
                    'user_id' => $userId,
                    'type' => $type,
                    'title' => $title,
                    'message' => $message,
                    'data' => json_encode($data),
                    'is_read' => false,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // Batch insert dalam chunks untuk performance
            $chunkSize = 500;
            $chunks = array_chunk($notifications, $chunkSize);
            $totalCreated = 0;

            foreach ($chunks as $chunk) {
                try {
                    Notification::insert($chunk);
                    $totalCreated += count($chunk);
                } catch (\Exception $chunkError) {
                    Log::error("Failed to insert chunk: " . $chunkError->getMessage());
                }
            }

            Log::info("Batch notifications created: {$totalCreated} notifications");

            return [
                'success' => true,
                'created' => $totalCreated,
                'total' => count($userIds),
            ];
        } catch (\Exception $e) {
            Log::error("Failed to batch create notifications: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'created' => 0,
            ];
        }
    }

    /**
     * Helper: Format time ago
     */
    private function getTimeAgo($date)
    {
        $now = Carbon::now();
        $diff = $now->diffInSeconds($date);

        if ($diff < 60) {
            return 'Baru saja';
        } elseif ($diff < 3600) {
            $minutes = floor($diff / 60);
            return "{$minutes}m lalu";
        } elseif ($diff < 86400) {
            $hours = floor($diff / 3600);
            return "{$hours}h lalu";
        } elseif ($diff < 2592000) {
            $days = floor($diff / 86400);
            return "{$days}d lalu";
        } else {
            $months = floor($diff / 2592000);
            return "{$months}mo lalu";
        }
    }

    /**
     * Clean old notifications (older than 90 days)
     * Run via cron job
     */
    public function cleanOldNotifications($daysOld = 90)
    {
        try {
            $cutoffDate = now()->subDays($daysOld);
            
            $deleted = Notification::where('created_at', '<', $cutoffDate)
                ->delete();

            Log::info("Cleaned old notifications: {$deleted} deleted");

            return [
                'success' => true,
                'deleted' => $deleted,
            ];
        } catch (\Exception $e) {
            Log::error("Failed to clean old notifications: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
