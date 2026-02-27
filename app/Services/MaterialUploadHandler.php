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
    protected $disk = 'public';  // Store in public disk: storage/app/public/materials
    
    // Allowed formats per material type
    protected $allowedFormats = [
        'document' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'],
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
            
            // Map common material type aliases to standard types
            $materialTypeMap = [
                'pdf' => 'document',
                'doc' => 'document',
                'docx' => 'document',
                'xls' => 'document',
                'xlsx' => 'document',
                'ppt' => 'presentation',
                'pptx' => 'presentation',
                'mp4' => 'video',
                'avi' => 'video',
                'mov' => 'video',
                'jpg' => 'image',
                'jpeg' => 'image',
                'png' => 'image',
                'gif' => 'image',
            ];
            
            // Normalize material type from file extension or provided type
            if (isset($materialTypeMap[$materialType])) {
                $materialType = $materialTypeMap[$materialType];
            }
            
            Log::info('MaterialUploadHandler.handle() called', [
                'filename' => $file->getClientOriginalName(),
                'mime' => $file->getMimeType(),
                'extension' => $file->getClientOriginalExtension(),
                'size' => $file->getSize(),
                'material_type' => $materialType,
                'module_id' => $moduleId
            ]);
            
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
            Log::info('Using subfolder', ['subfolder' => $subfolder]);
            
            // Generate filename
            $extension = strtolower($file->getClientOriginalExtension());
            $filename = $this->generateFilename($moduleId, $file->getClientOriginalName(), $extension);
            Log::info('Generated filename', ['filename' => $filename]);
            
            // Store file
            $path = "$subfolder/$filename";
            /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
            $disk = Storage::disk($this->disk);
            
            // Use storeAs method which properly handles UploadedFile and creates directories
            // The $path variable should just be the filename relative to the disk root
            $storagePath = $disk->putFileAs($subfolder, $file, $filename);
            
            Log::info('File stored', ['storagePath' => $storagePath, 'disk' => $this->disk]);
            
            if (!$storagePath) {
                Log::error('Failed to store material file', ['path' => $path, 'subfolder' => $subfolder, 'filename' => $filename]);
                return null;
            }

            // Verify file was written
            if (!$disk->exists($storagePath)) {
                Log::error('Stored material file not found', ['path' => $storagePath, 'disk' => $this->disk]);
                return null;
            }

            // Return relative path only (NOT full URL)
            // This allows the TrainingMaterial model to build the correct URL via route()
            $relativePath = $storagePath;
            
            Log::info('Material uploaded successfully', [
                'filename' => $filename,
                'path' => $path,
                'relative_path' => $relativePath,
                'material_type' => $materialType,
                'module_id' => $moduleId
            ]);
            
            return $relativePath;
            
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
     * 
     * IMPORTANT: These are relative to the disk root (storage/app/public)
     * Files are stored in storage/app/public/materials/{type}/
     */
    protected function getSubfolder(string $materialType): string
    {
        $subfolders = [
            'document' => 'materials/documents',
            'video' => 'materials/videos',
            'presentation' => 'materials/presentations',
            'image' => 'materials/images',
        ];
        
        return $subfolders[$materialType] ?? 'materials';  // Default to materials folder
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
            
            // Extract path from URL or direct path
            // For public disk URLs: /storage/materials/documents/...
            if (str_starts_with($url, '/storage/') || str_starts_with($url, 'materials/')) {
                $path = str_starts_with($url, '/storage/') ? substr($url, 9) : $url;
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
