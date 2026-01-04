# Testing Announcement & Notification System

## ✅ System Status
Semua fitur announcement dan notification sudah **BERFUNGSI 100%** dan siap digunakan!

## 📋 Cara Testing

### 1. Login sebagai Admin
```
Email: admin@example.com
Password: (sesuai database Anda)
```

### 2. Buat Announcement Baru
1. Masuk ke menu **Admin → Announcements**
2. Klik tombol **"Create Announcement"**
3. Isi form dengan data berikut:

**Contoh Announcement (Banner Type):**
- **Title**: "Selamat Datang di HCMS E-Learning!"
- **Content**: "Kami sangat senang Anda bergabung. Jelajahi berbagai modul pelatihan yang tersedia."
- **Type**: General
- **Display Type**: Banner
- **Status**: Active
- **Featured**: Yes (untuk prioritas tampil)
- **Start Date**: Hari ini
- **End Date**: 1 bulan dari sekarang

**Contoh Announcement (Modal Type):**
- **Title**: "🔥 PENTING: Update Sistem!"
- **Content**: "Sistem akan di-maintenance pada hari Minggu, 5 Januari 2025 pukul 02:00 WIB."
- **Type**: Urgent
- **Display Type**: Modal (Popup)
- **Status**: Active
- **Featured**: Yes
- **Start Date**: Hari ini
- **End Date**: Minggu depan

4. Klik **"Save"**

### 3. Buat Notification Baru
1. Masuk ke menu **Admin → Notifications**
2. Klik tombol **"Send Notification"**
3. Isi form:
   - **Title**: "Tugas Baru Tersedia"
   - **Message**: "Anda memiliki tugas baru yang harus diselesaikan minggu ini."
   - **Type**: Info
   - **Target Users**: Select specific users atau All Users
4. Klik **"Send"**

### 4. Testing sebagai User Biasa

**A. Login sebagai User:**
```
Logout dari admin, lalu login sebagai user biasa
Email: user@example.com
Password: (sesuai database Anda)
```

**B. Verifikasi Tampilan:**

1. **Banner Announcement** (di bagian atas halaman):
   - ✅ Harus muncul di bawah navbar
   - ✅ Auto-rotate jika ada multiple banners (setiap 5 detik)
   - ✅ Bisa di-dismiss dengan tombol X
   - ✅ Warna berbeda sesuai type (General=Biru, Urgent=Merah, Maintenance=Orange, Event=Hijau)

2. **Modal Announcement** (popup):
   - ✅ Muncul otomatis 1 detik setelah halaman load
   - ✅ Overlay background gelap
   - ✅ Bisa di-close dengan tombol X atau klik di luar modal
   - ✅ Tidak muncul lagi setelah di-dismiss (disimpan di session storage)

3. **Notification Bell** (di navbar, pojok kanan atas):
   - ✅ Badge merah menunjukkan jumlah notifikasi unread
   - ✅ Klik bell untuk buka dropdown
   - ✅ List semua notifications dengan icon sesuai type
   - ✅ Klik notification untuk mark as read
   - ✅ Badge berkurang otomatis setelah mark as read
   - ✅ Link "View All" ke halaman notifications lengkap

## 🔍 Verifikasi Backend

### Test API Endpoints (di Terminal):

```bash
# Test get active announcements
php artisan tinker
>>> \App\Models\Announcement::where('is_active', true)->count();
# Harus menampilkan jumlah announcement active

# Test get user notifications
>>> \App\Models\Notification::where('status', 'sent')->count();
# Harus menampilkan jumlah notification yang sudah sent
```

### Atau jalankan system check:
```bash
php artisan check:notifications
```

Output yang diharapkan:
```
=== SISTEM PENGUMUMAN DAN NOTIFIKASI - STATUS CHECK ===

1. ANNOUNCEMENTS DATA:
   Total announcements: X
   - (list of announcements)

2. ACTIVE ANNOUNCEMENTS:
   Active announcements: X
   - (list of active announcements with featured status)

3. PROGRAM NOTIFICATIONS DATA:
   Total notifications: X
   - (list of notifications)

4. API ENDPOINTS TEST:
   ✅ getActiveAnnouncements() works - X items returned
   ✅ notifications index() works - X items returned

5. FRONTEND COMPONENTS:
   ✅ AnnouncementBanner.jsx exists
   ✅ AnnouncementModal.jsx exists
   ✅ NotificationDropdown.jsx exists
   ✅ AnnouncementManager.jsx exists
   ✅ Notifications.jsx exists

=== STATUS CHECK SELESAI ===
```

## 🎯 Expected Behavior

### Untuk User yang BELUM Login:
- ❌ Announcement tidak muncul
- ❌ Notification bell tidak muncul
- ✅ Redirect ke halaman login

### Untuk User yang SUDAH Login:
- ✅ Banner muncul otomatis di setiap halaman
- ✅ Modal popup muncul 1x per session
- ✅ Notification bell menampilkan unread count
- ✅ Semua data real-time dari database

## 📊 Database Structure

### Announcements Table:
- `id`, `title`, `content`, `type` (general/urgent/maintenance/event)
- `display_type` (banner/modal/notification)
- `is_active`, `is_featured`
- `start_date`, `end_date`
- `created_at`, `updated_at`

### Notifications Table:
- `id`, `title`, `message`, `type` (info/success/warning/error)
- `user_id` (target user)
- `status` (draft/scheduled/sent)
- `is_read`
- `scheduled_at`, `sent_at`
- `created_at`, `updated_at`

## 🚀 API Routes

### Public API (requires auth):
- `GET /api/announcements/active` - Get all active announcements
- `GET /api/user/notifications` - Get user's notifications
- `PATCH /api/user/notifications/{id}/read` - Mark notification as read
- `GET /api/user/notifications/unread-count` - Get unread count

### Admin API (requires auth + admin role):
- `GET /api/admin/announcements` - List all
- `POST /api/admin/announcements` - Create new
- `PUT /api/admin/announcements/{id}` - Update
- `DELETE /api/admin/announcements/{id}` - Delete
- `PATCH /api/admin/announcements/{id}/toggle-status` - Toggle active status

- `GET /api/admin/notifications` - List all
- `POST /api/admin/notifications/send` - Send notification
- `DELETE /api/admin/notifications/{id}` - Delete

## 💡 Tips

1. **Featured Announcements** ditampilkan lebih dulu
2. **Banner** auto-rotate setiap 5 detik jika ada multiple banners
3. **Modal** hanya muncul sekali per session (disimpan di sessionStorage)
4. **Notification** bisa dikirim ke specific users atau all users
5. **Scheduled Notifications** bisa dijadwalkan untuk dikirim nanti

## 🐛 Troubleshooting

### Announcement tidak muncul?
1. Cek status announcement: `is_active = true`
2. Cek tanggal: `start_date <= now <= end_date`
3. Cek display_type sesuai dengan lokasi tampilan
4. Clear browser cache: `Ctrl + Shift + Del`
5. Clear Laravel cache: `php artisan optimize:clear`

### Notification tidak muncul?
1. Cek notification status: `status = 'sent'`
2. Cek target user ID sesuai
3. Refresh halaman untuk reload notification bell
4. Check console browser untuk error

### Browser Console Debugging:
Buka Developer Tools (F12) → Console tab:
- Cek error messages
- Verify API responses (Network tab)
- Check if components loaded

## ✨ Feature Complete!

Sistem announcement dan notification sudah **100% functional** dengan:
- ✅ Real-time data dari database
- ✅ Auto-rotate banner
- ✅ Modal popup dengan session management
- ✅ Notification bell dengan unread count
- ✅ Mark as read functionality
- ✅ Admin CRUD interface
- ✅ Proper authentication & authorization
- ✅ Responsive design
- ✅ Error handling

**Selamat mencoba! 🎉**
