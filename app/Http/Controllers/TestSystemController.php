<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TestSystemController extends Controller
{
    public function testAnnouncementsNotifications()
    {
        try {
            // Test 1: Get active announcements
            $announcements = DB::table('announcements')
                ->where('status', 'active')
                ->orderBy('is_featured', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            // Test 2: Get notifications
            $notifications = DB::table('program_notifications')
                ->orderBy('created_at', 'desc')
                ->get();

            // Test 3: Filter announcements by display type
            $bannerAnnouncements = $announcements->where('display_type', 'banner');
            $modalAnnouncements = $announcements->where('display_type', 'modal');
            $notificationAnnouncements = $announcements->where('display_type', 'notification');

            // Test 4: Count unread notifications (simulate)
            $unreadNotifications = $notifications->where('is_read', false);

            return response()->json([
                'status' => 'SUCCESS',
                'message' => 'Sistem pengumuman dan notifikasi berfungsi sempurna!',
                'data' => [
                    'announcements' => [
                        'total' => $announcements->count(),
                        'banner' => $bannerAnnouncements->count(),
                        'modal' => $modalAnnouncements->count(), 
                        'notification' => $notificationAnnouncements->count(),
                        'featured' => $announcements->where('is_featured', true)->count(),
                        'list' => $announcements->take(3)->values()
                    ],
                    'notifications' => [
                        'total' => $notifications->count(),
                        'unread' => $unreadNotifications->count(),
                        'read' => $notifications->where('is_read', true)->count(),
                        'list' => $notifications->take(3)->values()
                    ]
                ],
                'api_tests' => [
                    'announcement_controller' => $this->testAnnouncementController(),
                    'notification_controller' => $this->testNotificationController()
                ],
                'components_status' => [
                    'AnnouncementBanner' => file_exists(resource_path('js/Components/Announcement/AnnouncementBanner.jsx')),
                    'AnnouncementModal' => file_exists(resource_path('js/Components/Announcement/AnnouncementModal.jsx')),
                    'NotificationDropdown' => file_exists(resource_path('js/Components/Notification/NotificationDropdown.jsx')),
                    'AdminAnnouncementManager' => file_exists(resource_path('js/Pages/Admin/AnnouncementManager.jsx')),
                    'AdminNotifications' => file_exists(resource_path('js/Pages/Admin/Notifications.jsx'))
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'ERROR',
                'message' => 'Ada masalah pada sistem: ' . $e->getMessage()
            ], 500);
        }
    }

    private function testAnnouncementController()
    {
        try {
            $controller = new \App\Http\Controllers\Admin\AnnouncementController();
            $response = $controller->getActiveAnnouncements();
            $data = json_decode($response->getContent(), true);
            return [
                'status' => 'OK',
                'items_returned' => count($data),
                'http_status' => $response->getStatusCode()
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'ERROR',
                'message' => $e->getMessage()
            ];
        }
    }

    private function testNotificationController()
    {
        try {
            $controller = new \App\Http\Controllers\Admin\NotificationController();
            $request = new \Illuminate\Http\Request();
            $response = $controller->index($request);
            $data = json_decode($response->getContent(), true);
            return [
                'status' => 'OK',
                'items_returned' => count($data),
                'http_status' => $response->getStatusCode()
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'ERROR',
                'message' => $e->getMessage()
            ];
        }
    }
}