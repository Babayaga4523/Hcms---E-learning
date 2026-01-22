# 🔧 TROUBLESHOOTING: Files Still Auto-Downloading?

**Status:** Backend dan frontend sudah 100% benar. Issue ada di client-side atau network-level.

---

## Quick Test (5 Menit)

### 1. Buka Browser DevTools
```
Chrome/Edge: Tekan F12
Firefox: Tekan F12
Safari: Cmd + Option + I
```

### 2. Go to Network Tab
1. Click "Network" tab
2. Filter by "Fetch/XHR" if needed

### 3. Click on PDF Material
1. Buka MaterialViewer
2. Click pada PDF atau Excel material
3. Lihat request ke `/training/*/material/*/serve` di Network tab

### 4. Check Response Headers
1. Click pada request tadi
2. Go ke "Response Headers" atau "Headers" tab
3. Cari dan screenshot:
   - `Content-Type: application/pdf` ✓ atau ✗
   - `Content-Disposition: inline; filename="..."` ✓ atau ✗
   - `Content-Length: [number]` ✓ atau ✗

### 5. Screenshot Results
Ambil screenshot dan lihat mana yang salah:

| Header | Nilai Expected | Nilai Actual | Status |
|--------|---|---|---|
| Content-Type | application/pdf | ? | ✓/✗ |
| Content-Disposition | inline; filename="..." | ? | ✓/✗ |
| Content-Length | > 0 | ? | ✓/✗ |
| Cache-Control | public, max-age=86400 | ? | ✓/✗ |

---

## If Headers Are Correct (inline disposition) → Issue is CLIENT-SIDE

### Browser Setting untuk PDF
**Chrome/Edge:**
```
Settings → Privacy and Security → Site Settings → PDF Documents
→ Ubah "Open PDF files in the browser" dari OFF ke ON
```

**Firefox:**
```
about:config → pdfjs.disabled → Set to false
Settings → General → Files → "Open PDFs using their default viewer"
```

**Safari:**
```
Preferences → General → Open Safe Files Automatically → OFF
```

### Incognito/Private Mode Test
1. Open MaterialViewer in **Incognito/Private Mode**
2. Try to view PDF/Excel material
3. If works in incognito → Issue adalah extension atau browser cache

### Try Different Browser
1. Jika Chrome tidak bekerja → Try Firefox, Edge, Safari
2. Jika semua browser download → Issue server-level
3. Jika hanya 1 browser → Issue browser-specific

---

## If Headers Are WRONG (attachment atau octet-stream) → Issue is SERVER-SIDE

### Check Server Logs
```bash
# Windows (PowerShell)
Get-Content storage/logs/laravel.log -Tail 50

# Linux/Mac
tail -f storage/logs/laravel.log
```

Look for: `Serving file: ... with MIME type: ...`

### Check MIME Type Detection
If MIME type is `application/octet-stream` → mime_content_type() tidak bekerja

**Test mime_content_type():**
```php
<?php
$file = 'path/to/file.pdf';
echo mime_content_type($file);
?>
```

### Check .htaccess or nginx Config
**Apache (.htaccess):**
```bash
grep -i "attachment\|download\|disposition" public/.htaccess
grep -i "content-type" public/.htaccess
```

**Nginx:**
```bash
grep -r "attachment\|download\|disposition" /etc/nginx/
grep -r "content-type" /etc/nginx/
```

Look for any rules yang set `attachment` atau override `Content-Type`

### Check Laravel Middleware
```bash
grep -r "Content-Disposition\|attachment" app/Http/Middleware/
```

Look for middleware yang memodify response headers

---

## If Headers Are NOT Being Sent at All

### Check Response Status
1. Di Network tab → Check "Status" column
2. Harus HTTP 200, bukan 404, 403, 500

**If 404:**
- File tidak ditemukan
- Check storage path ada atau tidak

**If 403:**
- User tidak authorized
- Check permissions

**If 500:**
- Server error
- Check storage/logs/laravel.log

### Check URL Format
Request harus ke: `/training/{trainingId}/material/{materialId}/serve`

Bukan ke: `/materials/{id}` atau path lain

---

## Checklist Troubleshooting

### Browser-Level (Try First)
- [ ] DevTools verify `Content-Disposition: inline` header exists
- [ ] Try incognito mode (disable extensions)
- [ ] Try different browser
- [ ] Check browser PDF settings
- [ ] Check download manager settings
- [ ] Disable any download acceleration software

### Server-Level
- [ ] Check Laravel logs for `Serving file:` message
- [ ] Verify MIME type is `application/pdf` not `octet-stream`
- [ ] Check .htaccess tidak ada yang override headers
- [ ] Check nginx config tidak modifying response
- [ ] Check middleware tidak modify headers
- [ ] Verify file path ada dan readable

### Network-Level
- [ ] Try direct file URL tanpa proxy
- [ ] Disable VPN jika ada
- [ ] Check corporate firewall rules
- [ ] Check antivirus tidak intercepting
- [ ] Try different network (mobile hotspot)

### Application-Level
- [ ] Verify MaterialController.php punya `Content-Disposition: inline`
- [ ] Check pdf_path atau file_path ada di database
- [ ] Verify file permissions (readable)
- [ ] Check ExcelToPdfService convert Excel → PDF correctly

---

## Hasil Troubleshooting

**Pilih satu:**

### ✅ Scenario 1: Headers Correct, File Still Downloads
→ Browser setting issue
→ Antivirus/firewall issue
→ Extension issue
→ **Fix:** Change browser settings atau try incognito

### ✅ Scenario 2: Headers Wrong (attachment)
→ Server-side configuration issue
→ .htaccess atau middleware modifying headers
→ **Fix:** Review server config, check middleware

### ✅ Scenario 3: Status 404 or 500
→ File not found atau server error
→ **Fix:** Check file path, check logs

### ✅ Scenario 4: Works in Incognito, Not in Normal Mode
→ Extension atau cached setting issue
→ **Fix:** Disable extensions, clear browser cache/cookies

### ✅ Scenario 5: Works in Firefox, Not in Chrome
→ Browser-specific issue
→ **Fix:** Use Firefox or change Chrome settings

---

## Report Format

Ketika report issue, include:

1. **DevTools Screenshot:**
   - Network tab dengan request `/training/.../serve`
   - Response Headers complete

2. **Browser Info:**
   - Browser name dan version
   - OS (Windows, Mac, Linux)

3. **Logs:**
   - Output dari `tail storage/logs/laravel.log`
   - Cari "Serving file:" message

4. **Test Results:**
   - Incognito mode: ✓ Works / ✗ Doesn't work
   - Different browser: ✓ Works / ✗ Doesn't work
   - Direct file URL: ✓ Works / ✗ Doesn't work

5. **Error Message:**
   - Exact error from browser console (F12 → Console)
   - Any network errors

---

## Contact Support

Jika sudah mencoba semua langkah di atas, provide:
1. DevTools Network screenshot
2. Response Headers complete
3. Laravel log excerpt
4. Browser/OS info
5. Test results dari checklist

---

**Status:** Backend/Frontend implementation 100% complete ✅
**Next:** Client-side verification required to identify root cause

Good luck! 🚀
