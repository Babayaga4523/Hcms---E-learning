# Material Upload Diagnostics Guide

## Problem
When uploading materials (PDF, Word, etc.) to create training programs, you get:
```json
{
    "error": "Upload failed",
    "message": "Failed to upload material file: Outpus Program.pdf"
}
```

## Root Cause Analysis

The backend (Laravel) receives the file from the frontend (React) but fails to save it physically to the server. This can happen due to:

### 1. **File Size Exceeds Limits** (Most Common)
- **PHP default limit**: Usually 2MB (check your `php.ini`)
- **Application limit**: Set to 20MB in `AdminTrainingProgramController.php`
- **Solution**: 
  ```bash
  # Check current PHP limits
  php -r "echo ini_get('upload_max_filesize') . PHP_EOL . ini_get('post_max_size');"
  ```

### 2. **Storage Directories Don't Exist or Not Writable**
- Required directories:
  - `storage/app/public/materials/documents/`
  - `storage/app/public/materials/videos/`
  - `storage/app/public/materials/presentations/`
  - `storage/app/public/materials/images/`
- **Solution**: Run the setup command
  ```bash
  php artisan storage:link
  # If it says "link already exists", that's OK
  ```

### 3. **File MIME Type Mismatch**
- The file's detected MIME type doesn't match the extension
- **Solution**: Check `app/Services/MaterialUploadHandler.php` for allowed MIME types
- Current allowed types in `document` category:
  - `application/pdf` → `.pdf`
  - `application/msword` → `.doc`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` → `.docx`
  - `text/plain` → `.txt`
  - `text/csv` → `.csv`

### 4. **Symbolic Link Not Created**
- Storage link missing between `storage/app/public` and `public/storage`
- **Solution**:
  ```bash
  # Remove old link if it exists
  rmdir public\storage
  # Recreate it
  php artisan storage:link
  ```

## Diagnostic Steps

### Step 1: Check File Size
```powershell
# Windows - Check file size in MB
(Get-Item "path/to/your/file.pdf").Length / 1MB
```
- **Limit**: Maximum 20MB per file
- **PHP limit**: Check `php -r "echo ini_get('upload_max_filesize');"`

### Step 2: Verify Storage Setup
```powershell
# Check if directories exist
Test-Path "storage\app\public\materials\documents"
Test-Path "storage\app\public\materials\videos"
Test-Path "storage\app\public\materials\presentations"
Test-Path "storage\app\public\materials\images"

# Check if link exists
Test-Path "public\storage"
```

### Step 3: Check PHP Configuration
```bash
php -i | grep -E "post_max_size|upload_max_filesize|memory_limit"
```

Recommended settings in `php.ini`:
```ini
upload_max_filesize = 100M
post_max_size = 100M
memory_limit = 256M
max_execution_time = 300
```

### Step 4: View Upload Logs
Check Laravel logs for detailed error information:
```bash
# View recent logs
tail -f storage/logs/laravel.log
# Or on Windows
Get-Content storage\logs\laravel.log -Tail 50
```

### Step 5: Test Upload with Verbose Logging
The improved error message now includes:
```
[MIME: application/pdf, EXT: pdf, Size: 2048576 bytes]
```
This helps identify MIME type mismatches.

## Quick Fix Checklist

- [ ] Verify file is under 20MB (or configured limit)
- [ ] Check PHP upload limits: `php -i | grep upload_max`
- [ ] Run: `php artisan storage:link`
- [ ] Create directories: Run app setup script
- [ ] Check Laravel logs: `storage/logs/laravel.log`
- [ ] Verify file type is in allowed list (PDF, DOC, DOCX, XLSX, MP4, JPG, PNG, etc.)
- [ ] Check file MIME type matches extension

## Files Involved

- **Controller**: `app/Http/Controllers/AdminTrainingProgramController.php` (lines 460-485)
- **Service**: `app/Services/MaterialUploadHandler.php`
- **Config**: `config/filesystems.php` (public disk configuration)
- **Frontend**: `resources/js/Pages/Admin/CreateProgramWithSteps.jsx` (file handling)

## Allowed File Types

### Document Type
- PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, PPT, PPTX

### Video Type
- MP4, AVI, MOV, WMV, FLV, WEBM, MKV

### Presentation Type
- PPT, PPTX, PDF

### Image Type
- JPG, JPEG, PNG, GIF, WEBP

Maximum file size per type:
- Document: 100MB
- Video: 500MB
- Presentation: 150MB
- Image: 10MB

## Additional Reference

If errors persist after following these steps:
1. Check `storage/logs/laravel.log` for detailed stack trace
2. Enable debug mode in `.env`: `APP_DEBUG=true`
3. Check browser console (F12) for network request details
4. Verify frontend is sending `material_type` correctly in form data
