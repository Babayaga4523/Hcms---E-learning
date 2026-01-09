<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== SISTEM PENGUMUMAN DAN NOTIFIKASI - STATUS CHECK ===\n\n";

// Check announcements
echo "1. ANNOUNCEMENTS DATA:\n";
$announcements = DB::table('announcements')->get();
echo "   Total announcements: " . $announcements->count() . "\n";

foreach ($announcements as $ann) {
    echo "   - {$ann->title} ({$ann->type}, {$ann->status}, {$ann->display_type})\n";
}

// Check active announcements
echo "\n2. ACTIVE ANNOUNCEMENTS:\n";
$activeAnnouncements = DB::table('announcements')->where('status', 'active')->get();
echo "   Active announcements: " . $activeAnnouncements->count() . "\n";

foreach ($activeAnnouncements as $ann) {
    echo "   - {$ann->title} (Featured: " . ($ann->is_featured ? 'Yes' : 'No') . ")\n";
}

// Check notifications  
echo "\n3. PROGRAM NOTIFICATIONS DATA:\n";
$notifications = DB::table('program_notifications')->get();
echo "   Total notifications: " . $notifications->count() . "\n";

foreach ($notifications as $notif) {
    echo "   - {$notif->title} ({$notif->type}, {$notif->status})\n";
}

// Test API endpoint functionality
echo "\n4. API ENDPOINTS TEST:\n";

// Test AnnouncementController
try {
    $controller = new \App\Http\Controllers\Admin\AnnouncementController();
    $response = $controller->getActiveAnnouncements();
    $data = json_decode($response->getContent(), true);
    echo "   ✅ getActiveAnnouncements() works - " . count($data) . " items returned\n";
} catch (\Exception $e) {
    echo "   ❌ getActiveAnnouncements() failed: " . $e->getMessage() . "\n";
}

// Test NotificationController
try {
    $controller = new \App\Http\Controllers\Admin\NotificationController();
    $request = new \Illuminate\Http\Request();
    $response = $controller->index($request);
    $data = json_decode($response->getContent(), true);
    echo "   ✅ notifications index() works - " . count($data) . " items returned\n";
} catch (\Exception $e) {
    echo "   ❌ notifications index() failed: " . $e->getMessage() . "\n";
}

// Check routes
echo "\n5. ROUTES VERIFICATION:\n";
$routes = \Illuminate\Support\Facades\Route::getRoutes();
$announcementRoutes = 0;
$notificationRoutes = 0;

foreach ($routes as $route) {
    if (strpos($route->uri(), 'announcements') !== false) {
        $announcementRoutes++;
    }
    if (strpos($route->uri(), 'notifications') !== false) {
        $notificationRoutes++;
    }
}

echo "   Announcement routes: $announcementRoutes\n";
echo "   Notification routes: $notificationRoutes\n";

// Check frontend components
echo "\n6. FRONTEND COMPONENTS:\n";
$components = [
    'resources/js/Components/Announcement/AnnouncementBanner.jsx',
    'resources/js/Components/Announcement/AnnouncementModal.jsx', 
    'resources/js/Components/Notification/NotificationDropdown.jsx',
    'resources/js/Pages/Admin/AnnouncementManager.jsx',
    'resources/js/Pages/Admin/Notifications.jsx'
];

foreach ($components as $component) {
    if (file_exists(base_path($component))) {
        echo "   ✅ " . basename($component) . " exists\n";
    } else {
        echo "   ❌ " . basename($component) . " missing\n";
    }
}

echo "\n=== STATUS CHECK SELESAI ===\n";