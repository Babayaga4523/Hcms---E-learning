<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use App\Models\TrainingMaterial;
use App\Models\Module;

/**
 * Material Upload Handler
 * 
 * Improved logic untuk upload dan manage materi training
 * dengan validation sempurna, error handling robust, dan
 * consistency antara database dan storage
 */
class MaterialUploadHandler extends Controller
{
    // Maximum file size: 100 MB
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    
    // Allowed file extensions by category
    const ALLOWED_EXTENSIONS = [
        'pdf' => ['pdf'],
        'video' => ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv'],
        'presentation' => ['ppt', 'pptx', 'odp'],
        'document' => ['doc', 'docx', 'txt', 'odt'],
        'spreadsheet' => ['xlsx', 'xls', 'csv', 'ods'],
        'image' => ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    ];

    /**
     * Upload material dengan validation lengkap dan error handling
     * 
     * @param Request $request
     * @param int $moduleId
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadMaterial(Request $request, $moduleId)
    {
        try {
            $user = Auth::user();
            
            // Check authorization
            if ($user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki izin untuk upload materi'
                ], 403);
            }

            // Verify module exists
            $module = Module::findOrFail($moduleId);

            // Validate input
            $validated = $request->validate([
                'file' => [
                    'required',
                    'file',
                    'max:' . (self::MAX_FILE_SIZE / 1024), // In KB
                    function ($attribute, $value, $fail) {
                        if (!$this->isAllowedFile($value)) {
                            $fail('Tipe file tidak didukung. Format yang diizinkan: ' . implode(', ', array_merge(...array_values(self::ALLOWED_EXTENSIONS))));
                        }
                    }
                ],
                'title' => 'required|string|max:255|min:3',
                'description' => 'nullable|string|max:1000',
                'file_type' => 'required|string|in:pdf,video,presentation,document,spreadsheet,image',
                'duration_minutes' => 'nullable|integer|min:0|max:1440',
            ]);

            $file = $request->file('file');
            
            // Get original filename dan extension
            $originalFilename = $file->getClientOriginalName();
            $extension = strtolower($file->getClientOriginalExtension());
            
            // PENTING: Gunakan waktu upload sebagai timestamp, BUKAN waktu saat menyimpan
            // Ini memastikan consistency antara database dan storage
            $uploadTimestamp = now()->timestamp;
            
            // Sanitize filename - keep hanya alphanumeric, dot, underscore, dash
            $sanitizedBaseName = preg_replace('/[^a-zA-Z0-9._-]/', '_', pathinfo($originalFilename, PATHINFO_FILENAME));
            
            // Buat unique filename dengan format: timestamp_sanitized_name.extension
            $filename = "{$uploadTimestamp}_{$sanitizedBaseName}.{$extension}";
            
            // Path di storage (tanpa storage_path prefix)
            $storagePath = "materials/{$filename}";
            $fullPath = storage_path("app/public/{$storagePath}");
            
            // Ensure directory exists
            $directory = dirname($fullPath);
            if (!is_dir($directory)) {
                mkdir($directory, 0755, true);
            }

            // Store file
            $storedPath = $file->storeAs(
                'materials',
                $filename,
                'public'
            );

            if (!$storedPath) {
                throw new \Exception('Gagal menyimpan file ke storage');
            }

            // Verify file was actually stored
            if (!Storage::disk('public')->exists($storedPath)) {
                throw new \Exception('File tidak terverifikasi setelah disimpan');
            }

            // Get file size
            $fileSize = Storage::disk('public')->size($storedPath);

            // Handle PDF conversion for Excel files
            $pdfPath = null;
            $excelExtensions = ['xlsx', 'xls', 'xlsm', 'csv'];
            
            if (in_array($extension, $excelExtensions)) {
                try {
                    $pdfPath = $this->convertExcelToPdf($fullPath, $uploadTimestamp, $sanitizedBaseName);
                } catch (\Exception $e) {
                    Log::warning("Excel to PDF conversion failed: " . $e->getMessage());
                    // Continue without PDF - file akan di-serve sebagai original format
                }
            }

            // IMPORTANT: Map file_type to proper category
            // file_type di database adalah kategori, bukan extension
            $fileType = $validated['file_type'];
            
            // Jika PDF conversion berhasil, ubah tipe ke PDF untuk display
            if ($pdfPath) {
                $fileType = 'pdf';
            }

            // Create material record dengan timestamp yang sama
            $material = TrainingMaterial::create([
                'module_id' => $moduleId,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? '',
                'file_type' => $fileType,
                'file_path' => $storagePath,  // Relative path ke storage
                'pdf_path' => $pdfPath,
                'file_name' => $originalFilename,
                'file_size' => $fileSize,
                'duration_minutes' => $validated['duration_minutes'] ?? 0,
                'order' => $this->getNextOrder($moduleId),
                'uploaded_by' => $user->id,
            ]);

            // Verify material was created
            if (!$material) {
                // Cleanup file jika database creation gagal
                Storage::disk('public')->delete($storedPath);
                if ($pdfPath) {
                    Storage::disk('public')->delete($pdfPath);
                }
                throw new \Exception('Gagal membuat record material di database');
            }

            Log::info("Material uploaded successfully", [
                'material_id' => $material->id,
                'module_id' => $moduleId,
                'file_path' => $storagePath,
                'file_size' => $fileSize,
                'uploaded_by' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Materi berhasil diunggah' . ($pdfPath ? ' dan dikonversi ke PDF' : ''),
                'data' => [
                    'id' => $material->id,
                    'title' => $material->title,
                    'description' => $material->description,
                    'file_type' => $material->file_type,
                    'file_path' => $material->file_path,
                    'pdf_path' => $material->pdf_path,
                    'file_name' => $material->file_name,
                    'file_size' => $material->file_size,
                    'duration_minutes' => $material->duration_minutes,
                    'upload_timestamp' => $uploadTimestamp,
                    'created_at' => $material->created_at,
                    'url' => route('user.material.serve', [
                        'trainingId' => $moduleId,
                        'materialId' => $material->id
                    ]),
                ],
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Material Upload Error', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengunggah materi: ' . $e->getMessage(),
                'error_code' => 'UPLOAD_FAILED',
            ], 500);
        }
    }

    /**
     * Check if file is allowed
     */
    private function isAllowedFile($file)
    {
        $extension = strtolower($file->getClientOriginalExtension());
        
        // Check against allowed extensions
        foreach (self::ALLOWED_EXTENSIONS as $allowedExts) {
            if (in_array($extension, $allowedExts)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get next order number for materials in module
     */
    private function getNextOrder($moduleId)
    {
        $lastMaterial = TrainingMaterial::where('module_id', $moduleId)
            ->orderByDesc('order')
            ->first();
        
        return ($lastMaterial?->order ?? 0) + 1;
    }

    /**
     * Convert Excel file to PDF
     */
    private function convertExcelToPdf($excelPath, $uploadTimestamp, $sanitizedBaseName)
    {
        try {
            // Use ExcelToPdfService if available
            if (class_exists('\App\Services\ExcelToPdfService')) {
                $pdfFileName = "{$uploadTimestamp}_{$sanitizedBaseName}.pdf";
                $pdfStoragePath = "materials/{$pdfFileName}";
                $pdfFullPath = storage_path("app/public/{$pdfStoragePath}");
                
                // Ensure PDF directory exists
                $pdfDir = dirname($pdfFullPath);
                if (!is_dir($pdfDir)) {
                    mkdir($pdfDir, 0755, true);
                }
                
                if (\App\Services\ExcelToPdfService::convert($excelPath, $pdfFullPath)) {
                    // Verify PDF was created
                    if (file_exists($pdfFullPath)) {
                        return $pdfStoragePath;
                    }
                }
            }
        } catch (\Exception $e) {
            Log::warning("PDF conversion error: " . $e->getMessage());
        }
        
        return null;
    }

    /**
     * Get materials for a module dengan pagination
     */
    public function getMaterials($moduleId)
    {
        try {
            $user = Auth::user();
            
            // Check user has access to this module
            if ($user->role !== 'admin') {
                // Check enrollment for regular users
                $hasAccess = \App\Models\UserTraining::where('user_id', $user->id)
                    ->where('module_id', $moduleId)
                    ->where('status', '!=', 'cancelled')
                    ->exists();
                
                if (!$hasAccess) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Akses ditolak'
                    ], 403);
                }
            }

            // Get materials with proper URL generation
            $materials = TrainingMaterial::where('module_id', $moduleId)
                ->orderBy('order')
                ->get()
                ->map(function ($material) use ($moduleId) {
                    return [
                        'id' => $material->id,
                        'title' => $material->title,
                        'description' => $material->description,
                        'file_type' => $material->file_type,
                        'file_name' => $material->file_name,
                        'file_size' => $material->file_size,
                        'duration_minutes' => $material->duration_minutes,
                        'order' => $material->order,
                        'uploaded_by' => $material->uploadedBy?->name ?? 'Unknown',
                        'created_at' => $material->created_at,
                        'url' => route('user.material.serve', [
                            'trainingId' => $moduleId,
                            'materialId' => $material->id
                        ]),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'module_id' => $moduleId,
                    'materials' => $materials,
                    'total' => $materials->count(),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Get Materials Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data materi',
            ], 500);
        }
    }

    /**
     * Delete material dan cleanup file
     */
    public function deleteMaterial($materialId)
    {
        try {
            $user = Auth::user();
            
            if ($user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki izin untuk menghapus materi'
                ], 403);
            }

            $material = TrainingMaterial::findOrFail($materialId);

            // Delete files from storage
            if ($material->file_path && Storage::disk('public')->exists($material->file_path)) {
                Storage::disk('public')->delete($material->file_path);
            }
            
            if ($material->pdf_path && Storage::disk('public')->exists($material->pdf_path)) {
                Storage::disk('public')->delete($material->pdf_path);
            }

            // Delete database record
            $material->delete();

            Log::info("Material deleted: {$materialId}");

            return response()->json([
                'success' => true,
                'message' => 'Materi berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            Log::error('Material Delete Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus materi'
            ], 500);
        }
    }

    /**
     * Update material metadata (title, description, order)
     */
    public function updateMaterial(Request $request, $materialId)
    {
        try {
            $user = Auth::user();
            
            if ($user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki izin untuk update materi'
                ], 403);
            }

            $material = TrainingMaterial::findOrFail($materialId);

            $validated = $request->validate([
                'title' => 'sometimes|string|max:255|min:3',
                'description' => 'sometimes|nullable|string|max:1000',
                'duration_minutes' => 'sometimes|nullable|integer|min:0|max:1440',
                'order' => 'sometimes|integer|min:1',
            ]);

            $material->update($validated);

            Log::info("Material updated: {$materialId}", $validated);

            return response()->json([
                'success' => true,
                'message' => 'Materi berhasil diupdate',
                'data' => [
                    'id' => $material->id,
                    'title' => $material->title,
                    'description' => $material->description,
                    'duration_minutes' => $material->duration_minutes,
                    'order' => $material->order,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Material Update Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate materi'
            ], 500);
        }
    }
}
?>
