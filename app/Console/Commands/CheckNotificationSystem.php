<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckNotificationSystem extends Command
{
    protected $signature = 'check:notifications';
    protected $description = 'Check notification and announcement system status';

    public function handle()
    {
        $this->info('=== SISTEM PENGUMUMAN DAN NOTIFIKASI - STATUS CHECK ===');
        $this->newLine();

        // Check announcements
        $this->info('1. ANNOUNCEMENTS DATA:');
        $announcements = DB::table('announcements')->get();
        $this->line('   Total announcements: ' . $announcements->count());

        foreach ($announcements as $ann) {
            $this->line("   - {$ann->title} ({$ann->type}, {$ann->status}, {$ann->display_type})");
        }

        // Check active announcements
        $this->newLine();
        $this->info('2. ACTIVE ANNOUNCEMENTS:');
        $activeAnnouncements = DB::table('announcements')->where('status', 'active')->get();
        $this->line('   Active announcements: ' . $activeAnnouncements->count());

        foreach ($activeAnnouncements as $ann) {
            $featured = $ann->is_featured ? 'Yes' : 'No';
            $this->line("   - {$ann->title} (Featured: {$featured})");
        }

        // Check notifications  
        $this->newLine();
        $this->info('3. PROGRAM NOTIFICATIONS DATA:');
        $notifications = DB::table('program_notifications')->get();
        $this->line('   Total notifications: ' . $notifications->count());

        foreach ($notifications as $notif) {
            $this->line("   - {$notif->title} ({$notif->type}, {$notif->status})");
        }

        // Test API endpoints
        $this->newLine();
        $this->info('4. API ENDPOINTS TEST:');

        try {
            $controller = new \App\Http\Controllers\Admin\AnnouncementController();
            $response = $controller->getActiveAnnouncements();
            $data = json_decode($response->getContent(), true);
            $this->line('   ✅ getActiveAnnouncements() works - ' . count($data) . ' items returned');
        } catch (\Exception $e) {
            $this->line('   ❌ getActiveAnnouncements() failed: ' . $e->getMessage());
        }

        try {
            $controller = new \App\Http\Controllers\Admin\NotificationController();
            $request = new \Illuminate\Http\Request();
            $response = $controller->index($request);
            $data = json_decode($response->getContent(), true);
            $this->line('   ✅ notifications index() works - ' . count($data) . ' items returned');
        } catch (\Exception $e) {
            $this->line('   ❌ notifications index() failed: ' . $e->getMessage());
        }

        // Check frontend components
        $this->newLine();
        $this->info('5. FRONTEND COMPONENTS:');
        $components = [
            'resources/js/Components/Announcement/AnnouncementBanner.jsx',
            'resources/js/Components/Announcement/AnnouncementModal.jsx', 
            'resources/js/Components/Notification/NotificationDropdown.jsx',
            'resources/js/Pages/Admin/AnnouncementManager.jsx',
            'resources/js/Pages/Admin/Notifications.jsx'
        ];

        foreach ($components as $component) {
            if (file_exists(base_path($component))) {
                $this->line('   ✅ ' . basename($component) . ' exists');
            } else {
                $this->line('   ❌ ' . basename($component) . ' missing');
            }
        }

        $this->newLine();
        $this->info('=== STATUS CHECK SELESAI ===');
        
        return 0;
    }
}
