# Fix for 403 Forbidden and 404 Not Found Errors on Storage Files

## Problems Fixed
1. **403 Forbidden error** when accessing training materials (videos, PDFs, etc.)
   ```
   GET http://127.0.0.1:8000/storage/materials/1769057518_silva_2.mp4 net::ERR_ABORTED 403 (Forbidden)
   ```

2. **404 Not Found error** when accessing question images
   ```
   GET http://127.0.0.1:8000/storage/questions/quiz_71_1769057518_6971aceec3e8c.png 404 (Not Found)
   ```

## Root Causes Identified

### Materials 403 Error
1. **Missing Route Definition**: The model was referencing `user.material.serve` route that wasn't defined
2. **File Storage Mismatch**: Files were in `storage/app/private/public/materials/` instead of `storage/app/public/materials/`
3. **No Fallback Route**: No fallback when direct symlink access failed

### Question Images 404 Error
1. **Incorrect Filesystem Disk Setting**: `.env` had `FILESYSTEM_DISK=local` instead of `FILESYSTEM_DISK=public`
2. **Files in Wrong Location**: Question files were in `storage/app/private/public/questions/` instead of `storage/app/public/questions/`
3. **Missing Route for Question Images**: No dedicated route for public question image serving

## Solutions Implemented

### 1. Fixed Filesystem Disk Setting (.env)
Changed from:
```
FILESYSTEM_DISK=local
```
To:
```
FILESYSTEM_DISK=public
```
This ensures new file uploads go to `storage/app/public/` which is publicly accessible through the symlink.

### 2. Migrated Existing Files to Public Storage
- Copied all material files from `storage/app/private/public/materials/` → `storage/app/public/materials/`
- Copied all question images from `storage/app/private/public/questions/` → `storage/app/public/questions/`

### 3. Added Material Serving Route (routes/web.php)
```php
// Authenticated route to serve material files with access control
Route::get('/training/{trainingId}/material/{materialId}/serve', 
    [MaterialController::class, 'serveFile'])->name('user.material.serve');
```

### 4. Added Fallback Storage Routes (routes/web.php)
```php
// Public question images fallback
Route::get('/storage/questions/{path}', function ($path) {
    // Checks multiple locations and serves image
})->where('path', '.*');

// Authenticated material files fallback
Route::get('/storage/materials/{path}', function ($path) {
    // Requires authentication
    // Checks multiple possible file locations
})->middleware('auth');
```

## How It Works Now

### Material Files (Training Materials)
1. **Database stores**: `materials/1769057518_silva_2.mp4`
2. **Model generates URL**: `http://127.0.0.1:8000/training/71/material/73/serve`
3. **Route handler** (`user.material.serve`):
   - Verifies user is authenticated and has access to the training
   - Resolves full file path checking multiple locations
   - Returns file with proper Content-Type and cache headers
4. **Fallback** (`/storage/materials/{path}`):
   - If symlink fails, this route provides alternative access
   - Also requires authentication
   - Checks multiple storage paths

### Question Images
1. **Database stores**: Question image file paths (e.g., `questions/quiz_71_1769057518_6971aceec3e8c.png`)
2. **Direct URL access**: Browser requests `/storage/questions/quiz_71_1769057518_6971aceec3e8c.png`
3. **Served via symlink**: `public/storage` → `storage/app/public`
4. **Fallback route** (`/storage/questions/{path}`):
   - If symlink fails or file not found, this route provides alternative access
   - Checks multiple possible file locations
   - Returns image with 24-hour cache

## File Locations
- **Material files physical location**: `storage/app/public/materials/`
- **Question images physical location**: `storage/app/public/questions/`
- **Public symlink**: `public/storage` → `storage/app/public`
- **Material URL pattern**: `/storage/materials/filename.ext` or `/training/{id}/material/{materialId}/serve`
- **Question image pattern**: `/storage/questions/filename.ext`

## Testing
To verify the fixes work:
1. **For question images**: Open a quiz and verify question images load without 404 errors
2. **For materials**: Click on a training material (video/PDF) and verify it loads without 403 errors
3. **Check DevTools Network tab**: Requests should return 200 OK with proper Content-Type headers

## Files Modified
- `.env` - Changed `FILESYSTEM_DISK` from `local` to `public`
- `routes/web.php` - Added material and question image serving routes
- `app/Http/Controllers/User/MaterialController.php` - Enhanced file path resolution
- File system - Migrated all files to correct public storage locations (66 question images + material files)

## Notes
- All storage files are now in `storage/app/public/` for direct access through the symlink
- Material serving additionally requires authentication and enrollment verification
- Files are cached appropriately (questions: 24 hours, materials: 1 hour)
- Server logs file access for security auditing
- New file uploads will automatically go to the correct public location with `FILESYSTEM_DISK=public` setting
