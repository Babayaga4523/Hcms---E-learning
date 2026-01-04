<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnnouncementsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();

        $announcements = [
            [
                'title' => 'Sistem Update - Maintenance Scheduled',
                'content' => 'Dear Users, sistem akan menjalani maintenance rutin pada hari Minggu, 31 Desember 2025 pukul 01:00 - 04:00 WIB. Mohon maaf atas ketidaknyamanannya.',
                'type' => 'maintenance',
                'status' => 'active',
                'display_type' => 'banner',
                'start_date' => $now->copy()->subDays(1),
                'end_date' => $now->copy()->addDays(2),
                'is_featured' => true,
                'views' => 245,
                'clicks' => 67,
                'created_at' => $now->copy()->subDays(3),
                'updated_at' => $now->copy()->subDays(3),
            ],
            [
                'title' => 'Selamat! Promo Spesial Akhir Tahun',
                'content' => '🎉 Dapatkan akses gratis ke semua modul premium hingga 15 Januari 2025! Jangan lewatkan kesempatan ini untuk meningkatkan skill Anda.',
                'type' => 'event',
                'status' => 'active',
                'display_type' => 'modal',
                'start_date' => $now->copy()->subDays(5),
                'end_date' => $now->copy()->addDays(15),
                'is_featured' => true,
                'views' => 523,
                'clicks' => 189,
                'created_at' => $now->copy()->subDays(5),
                'updated_at' => $now->copy()->subDays(5),
            ],
            [
                'title' => 'Webinar: Compliance & Risk Management',
                'content' => 'Ikuti webinar eksklusif tentang Compliance & Risk Management bersama expert dari industri. Daftarkan diri Anda sekarang, tempat terbatas!',
                'type' => 'event',
                'status' => 'active',
                'display_type' => 'notification',
                'start_date' => $now->copy()->subDays(2),
                'end_date' => $now->copy()->addDays(7),
                'is_featured' => false,
                'views' => 156,
                'clicks' => 42,
                'created_at' => $now->copy()->subDays(2),
                'updated_at' => $now->copy()->subDays(2),
            ],
            [
                'title' => 'Perubahan Kebijakan Data Privacy',
                'content' => 'Kami telah memperbarui kebijakan privasi data kami untuk memberikan perlindungan yang lebih baik. Silakan baca detail kebijakan terbaru di halaman Privacy Policy.',
                'type' => 'general',
                'status' => 'active',
                'display_type' => 'banner',
                'start_date' => $now->copy()->subDays(7),
                'end_date' => null,
                'is_featured' => false,
                'views' => 892,
                'clicks' => 124,
                'created_at' => $now->copy()->subDays(7),
                'updated_at' => $now->copy()->subDays(7),
            ],
            [
                'title' => '🚨 URGENT: Security Alert',
                'content' => 'Kami telah mendeteksi aktivitas mencurigakan pada beberapa akun. Mohon segera ubah password Anda dan aktifkan 2FA untuk keamanan maksimal.',
                'type' => 'urgent',
                'status' => 'active',
                'display_type' => 'modal',
                'start_date' => $now->copy()->subHours(6),
                'end_date' => $now->copy()->addDays(1),
                'is_featured' => true,
                'views' => 1234,
                'clicks' => 456,
                'created_at' => $now->copy()->subHours(6),
                'updated_at' => $now->copy()->subHours(6),
            ],
            [
                'title' => 'Modul Baru: Advanced Excel Training',
                'content' => 'Modul pelatihan Excel tingkat lanjut sudah tersedia! Pelajari formula kompleks, pivot tables, dan automation dengan VBA.',
                'type' => 'general',
                'status' => 'scheduled',
                'display_type' => 'notification',
                'start_date' => $now->copy()->addDays(3),
                'end_date' => $now->copy()->addDays(30),
                'is_featured' => false,
                'views' => 0,
                'clicks' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'System Performance Improvement',
                'content' => 'Kami telah meningkatkan performa sistem! Kecepatan loading meningkat 40%, bug fixes, dan UI improvements.',
                'type' => 'general',
                'status' => 'inactive',
                'display_type' => 'banner',
                'start_date' => $now->copy()->subDays(10),
                'end_date' => $now->copy()->subDays(1),
                'is_featured' => false,
                'views' => 678,
                'clicks' => 89,
                'created_at' => $now->copy()->subDays(10),
                'updated_at' => $now->copy()->subDays(1),
            ],
        ];

        DB::table('announcements')->insert($announcements);
    }
}
