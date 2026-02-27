<?php
/**
 * Image Upload Handler - Improved
 * 
 * Handles all image upload scenarios with validation and proper path storage.
 * Use this in AdminTrainingProgramController and QuestionController
 */

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Filesystem\FilesystemAdapter;

class ImageUploadHandler
{
    protected $disk = 'public';
    protected $folder = 'questions';
    
    /**
     * Get disk instance
     */
    protected function getDisk(): FilesystemAdapter
    {
        return Storage::disk($this->disk);
    }

    /**
     * Handle image upload from various sources
     * 
     * @param mixed $imageData - Can be UploadedFile, base64, URL, or path
     * @param array $context - Additional context (module_id, question_id, etc)
     * @return string|null - Returns valid image URL or null if failed
     */
    public function handle($imageData, array $context = []): ?string
    {
        if (empty($imageData)) {
            return null;
        }

        // Handle UploadedFile object
        if ($imageData instanceof UploadedFile) {
            return $this->handleUploadedFile($imageData, $context);
        }

        // Handle string data
        if (is_string($imageData)) {
            // Check if it's base64
            if (str_starts_with($imageData, 'data:image/')) {
                return $this->handleBase64($imageData, $context);
            }

            // Check if it's a URL (http/https)
            if (filter_var($imageData, FILTER_VALIDATE_URL)) {
                // For pre-existing URLs, validate they're accessible
                return $this->handleUrl($imageData, $context);
            }

            // Check if it's a storage path reference
            if (str_starts_with($imageData, 'questions/')) {
                return $this->handleStoragePath($imageData, $context);
            }

            // Invalid format
            Log::warning('Invalid image data format', [
                'data' => substr($imageData, 0, 100),
                'context' => $context
            ]);
            return null;
        }

        Log::warning('Unexpected image data type: ' . gettype($imageData), ['context' => $context]);
        return null;
    }

    /**
     * Handle uploaded file
     */
    protected function handleUploadedFile(UploadedFile $file, array $context = []): ?string
    {
        try {
            // Validate file
            if (!$this->validateImage($file)) {
                Log::warning('Invalid image file', [
                    'original_name' => $file->getClientOriginalName(),
                    'mime' => $file->getMimeType(),
                    'size' => $file->getSize()
                ]);
                return null;
            }

            // Generate filename
            $module_id = $context['module_id'] ?? 'unknown';
            $extension = $file->getClientOriginalExtension();
            $filename = "quiz_{$module_id}_" . time() . '_' . uniqid() . '.' . $extension;

            // Store file
            $path = $this->folder . '/' . $filename;
            $disk = $this->getDisk();
            
            if (!$disk->put($path, file_get_contents($file))) {
                Log::error('Failed to write image file to disk', [
                    'filename' => $filename,
                    'path' => $path
                ]);
                return null;
            }

            // Verify file was actually written
            if (!$disk->exists($path)) {
                Log::error('Image file verification failed after upload', [
                    'path' => $path,
                    'filename' => $filename
                ]);
                return null;
            }

            // IMPORTANT: Return relative path only, NOT hardcoded URL
            // This allows frontend/accessor to build proper URL for any environment
            $relativePath = $this->folder . '/' . $filename;  // e.g., "questions/quiz_34_1770888953_698d9ef93f981.jpg"
            
            Log::info('Image uploaded successfully', [
                'filename' => $filename,
                'relative_path' => $relativePath,
                'size' => $disk->size($path),
                'context' => $context
            ]);

            return $relativePath;

        } catch (\Exception $e) {
            Log::error('Image upload exception', [
                'error' => $e->getMessage(),
                'file' => $file->getClientOriginalName(),
                'context' => $context
            ]);
            return null;
        }
    }

    /**
     * Handle base64 encoded image
     */
    protected function handleBase64(string $data, array $context = []): ?string
    {
        try {
            // Parse base64 data
            if (!preg_match('/^data:image\/(\w+);base64,(.+)$/', $data, $matches)) {
                Log::warning('Invalid base64 format', ['context' => $context]);
                return null;
            }

            $extension = $matches[1];
            $imageData = base64_decode($matches[2], true);

            if ($imageData === false) {
                Log::warning('Failed to decode base64 image', ['context' => $context]);
                return null;
            }

            // Generate filename
            $module_id = $context['module_id'] ?? 'unknown';
            $filename = "quiz_{$module_id}_" . time() . '_' . uniqid() . '.' . $extension;
            $path = $this->folder . '/' . $filename;

            // Store file
            $disk = $this->getDisk();
            if (!$disk->put($path, $imageData)) {
                Log::error('Failed to write base64 image to disk', [
                    'filename' => $filename,
                    'path' => $path
                ]);
                return null;
            }

            // Verify
            if (!$disk->exists($path)) {
                Log::error('Base64 image verification failed', ['path' => $path]);
                return null;
            }

            $url = $disk->url($path);
            Log::info('Base64 image uploaded successfully', [
                'filename' => $filename,
                'url' => $url,
                'size' => $disk->size($path),
                'context' => $context
            ]);

            return $url;

        } catch (\Exception $e) {
            Log::error('Base64 image upload exception', [
                'error' => $e->getMessage(),
                'context' => $context
            ]);
            return null;
        }
    }

    /**
     * Handle URL reference (external or storage)
     */
    protected function handleUrl(string $url, array $context = []): ?string
    {
        // If it's already a proper storage URL, just validate and return
        if (str_starts_with($url, '/storage/') || str_starts_with($url, config('app.url') . '/storage/')) {
            // Verify the file exists
            $path = str_replace('/storage/', '', $url);
            $path = str_replace(config('app.url') . '/storage/', '', $path);
            
            $disk = $this->getDisk();
            if ($disk->exists($path)) {
                Log::info('Pre-existing storage URL validated', [
                    'url' => $url,
                    'path' => $path,
                    'context' => $context
                ]);
                return $url;
            } else {
                Log::warning('Pre-existing URL points to missing file', [
                    'url' => $url,
                    'path' => $path,
                    'context' => $context
                ]);
                return null;
            }
        }

        // For external URLs, we accept them as-is with warning
        Log::warning('Storing external URL (recommend downloading)', [
            'url' => $url,
            'context' => $context
        ]);
        return $url;
    }

    /**
     * Handle storage path reference
     */
    protected function handleStoragePath(string $path, array $context = []): ?string
    {
        $disk = $this->getDisk();
        
        if ($disk->exists($path)) {
            $url = $disk->url($path);
            Log::info('Storage path reference validated', [
                'path' => $path,
                'url' => $url,
                'context' => $context
            ]);
            return $url;
        } else {
            Log::warning('Storage path reference points to missing file', [
                'path' => $path,
                'context' => $context
            ]);
            return null;
        }
    }

    /**
     * Validate image file
     */
    protected function validateImage(UploadedFile $file): bool
    {
        // Check MIME type
        $allowed_mimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file->getMimeType(), $allowed_mimes)) {
            return false;
        }

        // Check file size (max 5MB)
        if ($file->getSize() > 5 * 1024 * 1024) {
            return false;
        }

        // Check extension
        $allowed_ext = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!in_array(strtolower($file->getClientOriginalExtension()), $allowed_ext)) {
            return false;
        }

        return true;
    }

    /**
     * Get image size info
     */
    public function getImageInfo(string $url): ?array
    {
        try {
            $path = str_replace('/storage/', '', $url);
            $disk = $this->getDisk();

            if (!$disk->exists($path)) {
                return null;
            }

            return [
                'url' => $url,
                'path' => $path,
                'exists' => true,
                'size' => $disk->size($path),
                'last_modified' => $disk->lastModified($path),
                'mime' => $disk->mimeType($path),
            ];
        } catch (\Exception $e) {
            Log::warning('Failed to get image info', ['url' => $url, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Delete image file
     */
    public function delete(string $url): bool
    {
        try {
            $path = str_replace('/storage/', '', $url);
            $disk = $this->getDisk();

            if ($disk->exists($path)) {
                return $disk->delete($path);
            }

            return true; // Already deleted
        } catch (\Exception $e) {
            Log::error('Failed to delete image', ['url' => $url, 'error' => $e->getMessage()]);
            return false;
        }
    }
}
