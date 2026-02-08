# 📋 UPLOAD GAMBAR SOAL - PANDUAN ADMIN TEAM

## ✅ Sebelum Upload Gambar

- [ ] File adalah image (JPG, PNG, GIF, WebP)
- [ ] Ukuran file < 5MB
- [ ] Resolusi cukup (min 100px, recommended 400px+)
- [ ] Format landscape lebih baik untuk soal

## 📝 Cara Upload yang BENAR

### Saat Membuat Training Program
```
Admin Panel → Training Programs → Create New
    ↓
Add Questions
    ↓
Click "Upload Image" button ← Gunakan FILE BUTTON, bukan URL input
    ↓
Pilih file dari computer
    ↓
File otomatis di-upload ke server
    ↓
URL di-generate otomatis & simpan ke database
```

### ❌ JANGAN Lakukan Ini
```
Jangan copy-paste URL dari Google
Jangan ketik path manual
Jangan gunakan text input untuk gambar
Jangan upload tanpa validate
```

## 🔍 Cara Verifikasi Upload Berhasil

### Method 1: Cek Database
```sql
SELECT id, question_text, image_url FROM questions 
WHERE image_url IS NOT NULL LIMIT 5;
```
Harus ada URL format: `http://127.0.0.1:8000/storage/questions/quiz_X_XXXXX.jpg`

### Method 2: Cek Browser
1. Copy URL dari database
2. Paste di URL bar: `http://127.0.0.1:8000/storage/questions/quiz_1_1769055676_6971a5bc65f74.jpg`
3. Harus bisa lihat gambar (bukan 404)

### Method 3: Cek File System
```
Open: C:\Users\Yoga Krisna\hcms-elearning\storage\app\public\questions\
Harus lihat file dengan nama quiz_*.jpg atau quiz_*.png
```

## 🐛 Jika Ada Error

### "File not found" atau 404
```
Sebab: File tidak upload ke storage
Fix:   Gunakan file button, bukan URL input
```

### "Invalid image" atau validation error
```
Sebab: File bukan image atau terlalu besar
Fix:   Pastikan JPG/PNG, size < 5MB
```

### Gambar tidak muncul di soal
```
Sebab: Symlink broken atau file missing
Fix:   Contact developer, run: fix_storage_link.bat
```

## 📊 Checklist Harian

Setiap hari saat upload:
- [ ] File sudah di-select (jangan URL string)
- [ ] Button "Upload Image" di-click
- [ ] File successfully uploaded (no error)
- [ ] URL muncul di form
- [ ] Save training
- [ ] Test: Akses soal & lihat gambar muncul

## 💬 Tips

1. **Ukuran Optimal:** 400-800px wide, 300-600px tall
2. **Format:** JPG untuk foto, PNG untuk diagram
3. **Quality:** Medium-High (jangan terlalu besar, jangan terlalu kecil)
4. **Naming:** System auto-name, jangan perlu manual

## 📞 Support

Jika masalah:
1. Check: storage/logs/laravel.log
2. Run: php verify_image_upload_path.php
3. Contact: Tech team

## ✅ DONE

Sekarang upload gambar soal sudah:
- ✅ Validated sebelum simpan
- ✅ Auto-generate URL
- ✅ Verify file exists
- ✅ No 404 errors

Happy uploading! 🎉

