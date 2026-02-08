<?php
/**
 * Material Upload Handler
 * Handles uploads of training materials (PDF, Video, Documents)
 */

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class MaterialUploadHandler
{
    protected $disk = 'public';
    
    // Allowed formats per material type
    protected $allowedFormats = [
        'document' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
        'video' => ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'],
        'presentation' => ['ppt', 'pptx', 'pdf'],
        'image' => ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    ];
    
    // Max file sizes (in bytes)
    protected $maxSizes = [
        'document' => 100 * 1024 * 1024,    // 100MB
        'video' => 500 * 1024 * 1024,       // 500MB
        'presentation' => 150 * 1024 * 1024, // 150MB
        'image' => 10 * 1024 * 1024,         // 10MB
    ];
    
    /**
     * Handle material upload
     */
    public function handle(UploadedFile $file, array $context = []): ?string
    {
        try {
            $materialType = $context['material_type'] ?? 'document';
            $moduleId = $context['module_id'] ?? null;
            
            // Validate file
            if (!$this->validateFile($file, $materialType)) {
                Log::warning('File validation failed', [
                    'filename' => $file->getClientOriginalName(),
                    'mime' => $file->getMimeType(),
                    'material_type' => $materialType
                ]);
                return null;
            }
            
            // Determine subfolder
            $subfolder = $this->getSubfolder($materialType);
            
            // Generate filename
            $extension = strtolower($file->getClientOriginalExtension());
            $filename = $this->generateFilename($moduleId, $file->getClientOriginalName(), $extension);
            
            // Store file
            $path = "$subfolder/$filename";
            /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
            $disk = Storage::disk($this->disk);
            
            if (!$disk->put($path, file_get_contents($file))) {
                Log::error('Failed to store material file', ['path' => $path]);
                return null;
            }
            
            // Verify file was written
            if (!$disk->exists($path)) {
                Log::error('Stored material file not found', ['path' => $path]);
                return null;
            }
            
            $url = $disk->url($path);
            
            Log::info('Material uploaded successfully', [
                'filename' => $filename,
                'path' => $path,
                'url' => $url,
                'material_type' => $materialType,
                'module_id' => $moduleId
            ]);
            
            return $url;
            
        } catch (\Exception $e) {
            Log::error('Material upload exception', [
                'error' => $e->getMessage(),
                'file' => $file->getClientOriginalName() ?? 'unknown'
            ]);
            return null;
        }
    }
    
    /**
     * Validate file
     */
    protected function validateFile(UploadedFile $file, string $materialType): bool
    {
        // Check extension
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, $this->allowedFormats[$materialType] ?? [])) {
            Log::warning('Invalid file extension', [
                'extension' => $extension,
                'allowed' => $this->allowedFormats[$materialType] ?? []
            ]);
            return false;
        }
        
        // Check file size
        $maxSize = $this->maxSizes[$materialType] ?? 100 * 1024 * 1024;
        if ($file->getSize() > $maxSize) {
            Log::warning('File size exceeds limit', [
                'size' => $file->getSize(),
                'max' => $maxSize,
                'material_type' => $materialType
            ]);
            return false;
        }
        
        // Check MIME type
        $mimeType = $file->getMimeType();
        if (!$this->isValidMime($mimeType, $materialType)) {
            Log::warning('Invalid MIME type', [
                'mime' => $mimeType,
                'material_type' => $materialType
            ]);
            return false;
        }
        
        return true;
    }
    
    /**
     * Check if MIME type is valid
     */
    protected function isValidMime(string $mime, string $materialType): bool
    {
        $validMimes = [
            'document' => [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/plain',
                'text/csv',
            ],
            'video' => [
                'video/mp4',
                'video/x-msvideo',
                'video/quicktime',
                'video/x-ms-wmv',
                'video/x-flv',
                'video/webm',
                'video/x-matroska',
            ],
            'presentation' => [
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'application/pdf',
            ],
            'image' => [
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
            ],
        ];
        
        return in_array($mime, $validMimes[$materialType] ?? []);
    }
    
    /**
     * Get subfolder for material type
     */
    protected function getSubfolder(string $materialType): string
    {
        $subfolders = [
            'document' => 'materials/documents',
            'video' => 'materials/videos',
            'presentation' => 'materials/presentations',
            'image' => 'materials/images',
        ];
        
        return $subfolders[$materialType] ?? 'materials';
    }
    
    /**
     * Generate unique filename
     */
    protected function generateFilename(?int $moduleId, string $originalName, string $extension): string
    {
        $baseName = preg_replace('/\.[^.]+$/', '', $originalName);
        $baseName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $baseName);
        
        return strtolower(sprintf(
            '%s_%s_%s.%s',
            $moduleId ? "module_$moduleId" : 'material',
            time(),
            uniqid(),
            $extension
        ));
    }
    
    /**
     * Delete material file
     */
    public function delete(string $url): bool
    {
        try {
            $disk = Storage::disk($this->disk);
            
            // Extract path from URL
            if (str_starts_with($url, '/storage/')) {
                $path = substr($url, 9); // Remove '/storage/' prefix
                if ($disk->exists($path)) {
                    $disk->delete($path);
                    Log::info('Material file deleted', ['path' => $path]);
                    return true;
                }
            }
            
            return false;
        } catch (\Exception $e) {
            Log::error('Material delete exception', ['error' => $e->getMessage()]);
            return false;
        }
    }
}
