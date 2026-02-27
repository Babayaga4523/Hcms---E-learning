<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\Module;
use App\Models\ModuleProgress;
use App\Models\UserTraining;
use App\Models\TrainingMaterial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MaterialController extends Controller
{
    /**
     * Get materials for a training (module)
     */
    public function index($trainingId)
    {
        try {
            $user = Auth::user();

            // Try to find the training
            try {
                $training = Module::findOrFail($trainingId);
            } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
                Log::warning("Training not found: {$trainingId}");
                return response()->json([
                    'success' => false,
                    'message' => 'Training not found',
                    'materials' => [],
                    'total' => 0,
                    'completed' => 0,
                    'progress_percentage' => 0
                ], 404);
            }

            // Check if user is enrolled in this training
            $userTraining = UserTraining::where('user_id', $user->id)
                ->where('module_id', $trainingId)
                ->first();

            if (!$userTraining) {
                Log::warning("User {$user->id} not enrolled in training {$trainingId}");
                return response()->json([
                    'success' => false,
                    'message' => 'You are not assigned to this training',
                    'materials' => [],
                    'total' => 0,
                    'completed' => 0,
                    'progress_percentage' => 0
                ], 403);
            }

            // For enrolled users, allow access even if training is draft
            // But still check if active
            if (!$training->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Training is not active',
                    'materials' => [],
                    'total' => 0,
                    'completed' => 0,
                    'progress_percentage' => 0
                ], 403);
            }

            // Build materials from both module fields and training_materials table
            $materials = collect();
            $materialId = 1;

            // Add video material if video_url exists
            if ($training->video_url) {
                $materials->push([
                    'id' => 'video',
                    'title' => 'Video Pembelajaran',
                    'type' => 'video',
                    'url' => route('user.material.serve', ['trainingId' => $trainingId, 'materialId' => 'video']),
                    'duration' => 30,
                    'module_title' => $training->title,
                    'is_completed' => false
                ]);
            }

            // Add document material if document_url exists
            if ($training->document_url) {
                $materials->push([
                    'id' => $materialId++,
                    'title' => 'Dokumen Pembelajaran',
                    'type' => 'document',
                    'url' => $this->ensureValidUrl($training->document_url),
                    'duration' => 20,
                    'module_title' => $training->title,
                    'is_completed' => false
                ]);
            }

            // Add presentation material if presentation_url exists
            if ($training->presentation_url) {
                $materials->push([
                    'id' => $materialId++,
                    'title' => 'Presentasi',
                    'type' => 'presentation',
                    'url' => $this->ensureValidUrl($training->presentation_url),
                    'duration' => 25,
                    'module_title' => $training->title,
                    'is_completed' => false
                ]);
            }

            // Add materials from training_materials table
            $trainingMaterials = \App\Models\TrainingMaterial::where('module_id', $trainingId)
                ->orderBy('order')
                ->get();

            foreach ($trainingMaterials as $material) {
                // If PDF path exists (converted from Excel), display as PDF type
                $materialType = $material->pdf_path ? 'pdf' : $material->file_type;
                
                $materials->push([
                    'id' => $material->id, // Use actual material ID
                    'title' => $material->title,
                    'type' => $materialType,
                    'url' => $material->url, // ← Use model accessor which handles all logic
                    'duration' => $material->duration_minutes ?? 15,
                    'module_title' => $training->title,
                    'is_completed' => false,
                    'description' => $material->description
                ]);
            }

            // If no content files, add a placeholder overview material
            if ($materials->isEmpty()) {
                $materials->push([
                    'id' => 1,
                    'title' => 'Materi Pembelajaran ' . $training->title,
                    'type' => 'content',
                    'url' => null,
                    'duration' => $training->duration_minutes ?? 60,
                    'module_title' => $training->title,
                    'is_completed' => false,
                    'description' => $training->description
                ]);
            }
            
            // Calculate real-time progress percentage using actual completed materials
            // Consider both legacy (module-level) and training_materials IDs for completion
            $module = Module::find($trainingId);
            $expectedIds = [];
            $nextId = 1;
            if ($module) {
                if ($module->video_url) $expectedIds[] = $nextId++;
                if ($module->document_url) $expectedIds[] = $nextId++;
                if ($module->presentation_url) $expectedIds[] = $nextId++;
            }
            $trainingMaterialIds = \App\Models\TrainingMaterial::where('module_id', $trainingId)->pluck('id')->toArray();
            $expectedIds = array_merge($expectedIds, $trainingMaterialIds);

            $completedMaterialIds = \App\Models\UserMaterialProgress::where('user_id', $user->id)
                ->whereIn('training_material_id', $expectedIds)
                ->where('is_completed', true)
                ->pluck('training_material_id')
                ->toArray();

            $progressPercentage = $this->calculateTrainingProgress($user->id, $trainingId);

            // Ensure ModuleProgress record exists and is up-to-date
            \App\Models\ModuleProgress::updateOrCreate(
                ['user_id' => $user->id, 'module_id' => $trainingId],
                ['progress_percentage' => $progressPercentage, 'status' => $progressPercentage === 100 ? 'completed' : ($progressPercentage > 0 ? 'in_progress' : 'locked')]
            );

            // Mark individual materials as completed
            $materials = $materials->map(function($material) use ($completedMaterialIds) {
                $material['is_completed'] = in_array($material['id'], $completedMaterialIds);
                return $material;
            });

            // Update or create progress record with calculated percentage
            // $progress = ModuleProgress::updateOrCreate(
            //     [
            //         'user_id' => $user->id,
            //         'module_id' => $trainingId,
            //     ],
            //     [
            //         'status' => $progressPercentage >= 100 ? 'completed' : 'in_progress',
            //         'progress_percentage' => $progressPercentage,
            //         'last_accessed_at' => now()
            //     ]
            // );

            return response()->json([
                'success' => true,
                'materials' => $materials->values()->all(),
                'total' => $materials->count(),
                'completed' => count($completedMaterialIds),
                'progress_percentage' => $progressPercentage
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load materials: ' . $e->getMessage() . ' Trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to load materials: ' . $e->getMessage(),
                'materials' => [],
                'total' => 0,
                'completed' => 0
            ], 500);
        }
    }
    
    /**
     * Get single material detail
     */
    public function show($trainingId, $materialId)
    {
        try {
            $user = Auth::user();

            $training = Module::findOrFail($trainingId);

            // Check if user is enrolled in this training
            $userTraining = UserTraining::where('user_id', $user->id)
                ->where('module_id', $trainingId)
                ->first();

            if (!$userTraining) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not assigned to this training',
                    'training' => null,
                    'material' => null,
                    'materials' => [],
                    'prevMaterial' => null,
                    'nextMaterial' => null
                ], 403);
            }

            // For enrolled users, allow access even if training is draft
            // But still check if active
            if (!$training->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Training is not active',
                    'training' => null,
                    'material' => null,
                    'materials' => [],
                    'prevMaterial' => null,
                    'nextMaterial' => null
                ], 403);
            }

            // Check if user is assigned to this training
            $userTraining = UserTraining::where('user_id', $user->id)
                ->where('module_id', $trainingId)
                ->first();

            if (!$userTraining) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not assigned to this training',
                    'training' => null,
                    'material' => null,
                    'materials' => [],
                    'prevMaterial' => null,
                    'nextMaterial' => null
                ], 403);
            }

            // Build materials from module fields and training_materials table
            $materials = collect();
            $materialIdCounter = 1;
            
            // Add video material if video_url exists
            // NOTE: Virtual materials can be viewed but cannot be officially marked complete
            // They are for reference only. Real completion tracking is for TrainingMaterial records.
            if ($training->video_url) {
                $materials->push([
                    'id' => 'video_' . $trainingId,  // Use string ID to differentiate from DB materials
                    'title' => 'Video Pembelajaran',
                    'type' => 'video',
                    'url' => $this->ensureValidUrl($training->video_url),
                    'duration' => 30,
                    'module_title' => $training->title,
                    'is_completed' => false,
                    'is_virtual' => true,  // Mark as virtual
                    'content' => null,
                    'description' => 'Video pembelajaran untuk modul ' . $training->title
                ]);
            }

            // Add document material if document_url exists
            if ($training->document_url) {
                $materials->push([
                    'id' => 'document_' . $trainingId,  // Use string ID
                    'title' => 'Dokumen Pembelajaran',
                    'type' => 'document',
                    'url' => $this->ensureValidUrl($training->document_url),
                    'duration' => 20,
                    'module_title' => $training->title,
                    'is_completed' => false,
                    'is_virtual' => true,  // Mark as virtual
                    'content' => null,
                    'description' => 'Dokumen pembelajaran untuk modul ' . $training->title
                ]);
            }

            // Add presentation material if presentation_url exists
            if ($training->presentation_url) {
                $materials->push([
                    'id' => 'presentation_' . $trainingId,  // Use string ID
                    'title' => 'Presentasi',
                    'type' => 'presentation',
                    'url' => $this->ensureValidUrl($training->presentation_url),
                    'duration' => 25,
                    'module_title' => $training->title,
                    'is_completed' => false,
                    'is_virtual' => true,  // Mark as virtual
                    'content' => null,
                    'description' => 'Presentasi untuk modul ' . $training->title
                ]);
            }

            // Add materials from training_materials table
            $trainingMaterials = \App\Models\TrainingMaterial::where('module_id', $trainingId)
                ->orderBy('order')
                ->get();

            foreach ($trainingMaterials as $trainingMaterial) {
                // If PDF path exists (converted from Excel), display as PDF type
                $materialType = $trainingMaterial->pdf_path ? 'pdf' : $trainingMaterial->file_type;
                
                $materials->push([
                    'id' => $trainingMaterial->id,
                    'title' => $trainingMaterial->title,
                    'type' => $materialType,
                    'url' => $trainingMaterial->file_path || $trainingMaterial->pdf_path ? route('user.material.serve', ['trainingId' => $trainingId, 'materialId' => $trainingMaterial->id]) : null,
                    'duration' => $trainingMaterial->duration_minutes ?? 15,
                    'module_title' => $training->title,
                    'is_completed' => false,
                    'content' => null,
                    'description' => $trainingMaterial->description
                ]);
            }

            // If no content files, add a placeholder content material
            if ($materials->isEmpty()) {
                $materials->push([
                    'id' => 1,
                    'title' => 'Materi Pembelajaran: ' . $training->title,
                    'type' => 'content',
                    'url' => null,
                    'duration' => $training->duration_minutes ?? 60,
                    'module_title' => $training->title,
                    'is_completed' => false,
                    'content' => $training->description,
                    'description' => $training->description
                ]);
            }
            
            // Find the requested material
            // materialId can be either numeric (for DB materials) or string (for virtual materials)
            // Use first() with callback for loose comparison
            $material = $materials->first(function($m) use ($materialId) {
                return $m['id'] == $materialId;  // Loose comparison handles both 'video_1' and 1
            });
            
            if (!$material) {
                return response()->json([
                    'success' => false,
                    'message' => 'Material tidak ditemukan',
                    'training' => null,
                    'material' => null,
                    'materials' => [],
                    'prevMaterial' => null,
                    'nextMaterial' => null
                ], 404);
            }
            
            // Get user's progress
            $progress = ModuleProgress::where('user_id', $user->id)
                ->where('module_id', $trainingId)
                ->first();

            // Determine completed materials for this user/module (only actual training materials)
            // Virtual materials do not have completion tracking
            $completedMaterialIds = \App\Models\UserMaterialProgress::where('user_id', $user->id)
                ->where('is_completed', true)
                ->whereHas('material', function($q) use ($trainingId) {
                    $q->where('module_id', $trainingId);
                })->pluck('training_material_id')->toArray();

            // If module is fully completed, mark all actual materials as completed
            // Virtual materials stay as incomplete (they're reference only)
            if ($progress && $progress->status === 'completed') {
                $materials = $materials->map(function($m) {
                    // Only mark actual materials as completed, keep virtual as-is
                    if (!isset($m['is_virtual']) || !$m['is_virtual']) {
                        $m['is_completed'] = true;
                    }
                    return $m;
                });
                // Mark current material as completed only if it's an actual material
                if (!isset($material['is_virtual']) || !$material['is_virtual']) {
                    $material['is_completed'] = true;
                }
            } else {
                $materials = $materials->map(function($m) use ($completedMaterialIds) {
                    // Only check completion for actual materials (numeric IDs)
                    if (isset($m['is_virtual']) && $m['is_virtual']) {
                        $m['is_completed'] = false; // Virtual never completes
                    } else {
                        $m['is_completed'] = in_array($m['id'], $completedMaterialIds);
                    }
                    return $m;
                });
                // Check if the single material is completed
                if (isset($material['is_virtual']) && $material['is_virtual']) {
                    $material['is_completed'] = false; // Virtual never completes
                } else {
                    $material['is_completed'] = in_array($material['id'], $completedMaterialIds) || ($progress && $progress->status === 'completed');
                }
            }
            
            // Get prev/next materials for navigation
            $currentIndex = $materials->search(function($m) use ($materialId) {
                return $m['id'] == $materialId;
            });
            
            $prevMaterial = $currentIndex > 0 ? $materials->get($currentIndex - 1) : null;
            $nextMaterial = $currentIndex < $materials->count() - 1 ? $materials->get($currentIndex + 1) : null;
            
            return response()->json([
                'success' => true,
                'training' => $training,
                'material' => $material,
                'materials' => $materials->values()->all(),
                'prevMaterial' => $prevMaterial,
                'nextMaterial' => $nextMaterial
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load material: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Material tidak ditemukan',
                'training' => null,
                'material' => null,
                'materials' => [],
                'prevMaterial' => null,
                'nextMaterial' => null
            ], 404);
        }
    }
    
    /**
     * Mark material as completed
     * NOTE: Only actual TrainingMaterial records (from training_materials table) can be officially marked complete.
     * Virtual materials (video_url, document_url, presentation_url) are for viewing only.
     */
    public function complete($trainingId, $materialId)
    {
        try {
            $user = Auth::user();

            // Check if this is a virtual material ID (string with prefix)
            $isVirtualMaterial = is_string($materialId) && (
                strpos($materialId, 'video_') === 0 || 
                strpos($materialId, 'document_') === 0 || 
                strpos($materialId, 'presentation_') === 0
            );

            if ($isVirtualMaterial) {
                // Virtual materials cannot be officially marked complete
                // They are for reference/viewing only
                \Log::info("User {$user->id} attempted to mark virtual material {$materialId} as complete", ['trainingId' => $trainingId]);
                
                return response()->json([
                    'success' => true,  // Return success for UX continuity
                    'message' => 'Materi telah dilihat',  // Just marking as viewed
                    'is_virtual' => true,
                    'progress_percentage' => $this->getProgressPercentage($user->id, $trainingId),
                    'note' => 'Virtual materials are for reference only. Progress tracking requires actual learning materials.'
                ]);
            }

            // Only record progress for actual training_materials records
            // Check if materialId is a real training_material record
            $trainingMaterial = \App\Models\TrainingMaterial::find($materialId);
            
            if (!$trainingMaterial || $trainingMaterial->module_id != $trainingId) {
                // Material not found or doesn't belong to this training
                return response()->json([
                    'success' => false,
                    'message' => 'Material tidak ditemukan atau tidak tersedia untuk training ini',
                    'progress_percentage' => $this->getProgressPercentage($user->id, $trainingId)
                ], 404);
            }

            // Valid training material - record progress
            $materialProgress = \App\Models\UserMaterialProgress::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'training_material_id' => $materialId,
                ],
                [
                    'is_completed' => true,
                    'completed_at' => now(),
                    'last_accessed_at' => now()
                ]
            );

            // Calculate comprehensive progress (materials + pretest + posttest)
            $quizService = new \App\Services\QuizService();
            $comprehensiveProgress = $quizService->calculateComprehensiveProgress($user->id, $trainingId);
            $totalProgressPercentage = $comprehensiveProgress['total_progress'] ?? 0;

            // Update module progress with comprehensive percentage
            $progress = ModuleProgress::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'module_id' => $trainingId,
                ],
                [
                    'status' => $totalProgressPercentage >= 100 ? 'completed' : 'in_progress',
                    'progress_percentage' => $totalProgressPercentage,
                    'last_accessed_at' => now()
                ]
            );

            // Clear progress cache to ensure fresh calculations
            Cache::forget("training_progress_{$user->id}_{$trainingId}");

            // Update user training status only if fully completed
            // Completion requires: all materials + pretest passed (if exists) + posttest passed (if exists)
            if ($totalProgressPercentage >= 100) {
                UserTraining::where('user_id', $user->id)
                    ->where('module_id', $trainingId)
                    ->update([
                        'status' => 'completed',
                        'completed_at' => now()
                    ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Material berhasil ditandai selesai',
                'progress' => $progress,
                'progress_percentage' => $totalProgressPercentage,
                'comprehensive_progress' => $comprehensiveProgress
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to complete material: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal menandai material sebagai selesai',
                'progress' => null
            ], 500);
        }
    }

    /**
     * Helper method to get current progress percentage for a training
     */
    private function getProgressPercentage($userId, $trainingId)
    {
        try {
            $progress = ModuleProgress::where('user_id', $userId)
                ->where('module_id', $trainingId)
                ->first();
            
            return $progress ? $progress->progress_percentage : 0;
        } catch (\Exception $e) {
            \Log::error('Failed to get progress percentage: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Ensure URL is valid and accessible
     */
    private function ensureValidUrl($url)
    {
        if (!$url) {
            return null;
        }

        // If it's already a full URL, return as is
        if (filter_var($url, FILTER_VALIDATE_URL)) {
            return $url;
        }

        // If it's a relative path starting with /, make it absolute
        if (str_starts_with($url, '/')) {
            return asset($url);
        }

        // If it's a relative path without /, assume it's in storage
        return asset('storage/' . $url);
    }

    /**
     * Serve material file securely
     */
    public function serveFile($trainingId, $materialId)
    {
        try {
            $user = Auth::user();

            // Verify user has access to this training
            $hasAccess = UserTraining::where('user_id', $user->id)
                ->where('module_id', $trainingId)
                ->where('status', '!=', 'cancelled')
                ->exists();

            if (!$hasAccess) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak'
                ], 403);
            }

            // Get material
            if ($materialId === 'video') {
                // Special case for legacy video material
                $module = Module::findOrFail($trainingId);
                $filePath = $module->video_url;

                if (!$filePath) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Video tidak ditemukan'
                    ], 404);
                }

                // Handle URL or local path
                if (filter_var($filePath, FILTER_VALIDATE_URL)) {
                    // External URL, redirect
                    return redirect($filePath);
                }

                // Local file
                $fullPath = null;
                if (Storage::disk('public')->exists($filePath)) {
                    $fullPath = Storage::disk('public')->path($filePath);
                } elseif (Storage::exists($filePath)) {
                    $fullPath = storage_path('app/' . $filePath);
                } elseif (Str::startsWith($filePath, 'public/')) {
                    $relative = substr($filePath, 7);
                    if (Storage::disk('public')->exists($relative)) {
                        $fullPath = Storage::disk('public')->path($relative);
                    }
                }

                if (!$fullPath || !file_exists($fullPath)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'File video tidak ditemukan'
                    ], 404);
                }

                $mimeType = mime_content_type($fullPath) ?: 'video/mp4';
                return response()->file($fullPath, [
                    'Content-Type' => $mimeType,
                    'Cache-Control' => 'private, max-age=3600'
                ]);
            }

            $material = \App\Models\TrainingMaterial::findOrFail($materialId);

            // Verify material belongs to the training
            if ($material->module_id != $trainingId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Material tidak ditemukan'
                ], 404);
            }

            $filePath = $material->file_path ?: $material->pdf_path;

            if (!$filePath) {
                Log::warning("No file path found for material {$materialId}. file_path: " . ($material->file_path ?? 'null') . ", pdf_path: " . ($material->pdf_path ?? 'null'));
                return response()->json([
                    'success' => false,
                    'message' => 'File tidak ditemukan'
                ], 404);
            }

            Log::info("Serving material: $filePath");
            
            $fullPath = null;

            // SECURITY FIX: Materials stored in private 'materials' disk
            // Files NOT accessible via direct URL (no symlink exposure)
            // All access must go through this controller for enrollment check
            $normalizedPath = $filePath;
            if (Str::startsWith($filePath, 'public/')) {
                $normalizedPath = substr($filePath, 7);
                Log::info("Normalized legacy path from 'public/*': $normalizedPath");
            }

            // Use private materials disk
            $materialsDisk = Storage::disk('materials');
            
            if ($materialsDisk->exists($normalizedPath)) {
                $fullPath = $materialsDisk->path($normalizedPath);
                Log::info("File found on private materials disk: $fullPath");
            } else {
                // Fallback for legacy files still on public disk
                $publicDisk = Storage::disk('public');
                if ($publicDisk->exists($normalizedPath)) {
                    $fullPath = $publicDisk->path($normalizedPath);
                    Log::warning("File found on PUBLIC disk (legacy) - should migrate to private: $fullPath");
                } else {
                    Log::error("Material file not found", [
                        'material_id' => $materialId,
                        'path' => $filePath,
                        'normalized' => $normalizedPath,
                        'private_disk_checked' => true,
                        'public_disk_checked' => true
                    ]);
                    abort(404);
                }
            }

            if (!$fullPath || !file_exists($fullPath)) {
                Log::error("Material file not found: {$filePath} (resolved to: {$fullPath})");
                return response()->json([
                    'success' => false,
                    'message' => 'File tidak ditemukan'
                ], 404);
            }

            // Log access for security
            Log::info("User {$user->id} accessing material file: {$fullPath}");

            // Update last accessed time
            \App\Models\UserMaterialProgress::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'training_material_id' => $materialId,
                ],
                [
                    'last_accessed_at' => now()
                ]
            );

            // PERBAIKAN: Gunakan mime_content_type() untuk deteksi MIME type otomatis
            // Ini lebih akurat daripada mengecek ekstensi manual
            // PENTING: mime_content_type() membutuhkan file yang exist, jadi pastikan file sudah ada
            $mimeType = 'application/octet-stream';
            
            if (@mime_content_type($fullPath)) {
                $mimeType = @mime_content_type($fullPath);
            } else {
                // Fallback: deteksi dari extension
                $extension = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
                $mimeTypes = [
                    'pdf' => 'application/pdf',
                    'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'xls' => 'application/vnd.ms-excel',
                    'xlsm' => 'application/vnd.ms-excel.sheet.macroEnabled.12',
                    'csv' => 'text/csv',
                    'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'ppt' => 'application/vnd.ms-powerpoint',
                    'doc' => 'application/msword',
                    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'mp4' => 'video/mp4',
                    'webm' => 'video/webm',
                    'ogg' => 'video/ogg',
                    'mov' => 'video/quicktime',
                    'avi' => 'video/x-msvideo',
                    'mkv' => 'video/x-matroska',
                ];
                $mimeType = $mimeTypes[$extension] ?? 'application/octet-stream';
            }
            
            $fileName = basename($fullPath);
            
            // DEBUG: Log MIME type yang terdeteksi
            Log::info("Serving file: {$fileName} with MIME type: {$mimeType}");
            
            // PERBAIKAN: Untuk file video, gunakan response()->stream() agar bisa di-seek
            // Ini memungkinkan user skip forward/backward di video
            $isVideo = str_contains($mimeType, 'video');
            $pathLower = strtolower($fullPath);
            foreach (['.mp4', '.webm', '.mov', '.avi', '.mkv'] as $ext) {
                if (str_ends_with($pathLower, $ext)) {
                    $isVideo = true;
                    break;
                }
            }
            if ($isVideo) {
                $fileSize = @filesize($fullPath);
                $headers = [
                    'Content-Type' => $mimeType,
                    'Content-Disposition' => 'inline; filename="' . $fileName . '"',
                    'Cache-Control' => 'private, max-age=3600',
                    'Accept-Ranges' => 'bytes',
                    'X-Content-Type-Options' => 'nosniff'
                ];
                if ($fileSize) {
                    $headers['Content-Length'] = $fileSize;
                }
                
                return response()->stream(function() use ($fullPath) {
                    $stream = @fopen($fullPath, 'rb');
                    if ($stream) {
                        fpassthru($stream);
                        fclose($stream);
                    }
                }, 200, $headers);
            }
            
            // Untuk PDF dan Excel - gunakan response()->stream() juga untuk consistency
            // dan full control atas headers
            if (in_array(strtolower(pathinfo($fullPath, PATHINFO_EXTENSION)), ['pdf', 'xlsx', 'xls', 'xlsm', 'csv'])) {
                $fileSize = @filesize($fullPath);
                $headers = [
                    'Content-Type' => $mimeType,
                    'Content-Disposition' => 'inline; filename="' . $fileName . '"',
                    'Cache-Control' => 'public, max-age=86400',
                    'Pragma' => 'public',
                    'Expires' => gmdate('D, d M Y H:i:s', time() + 86400) . ' GMT',
                    'X-Content-Type-Options' => 'nosniff'
                ];
                if ($fileSize) {
                    $headers['Content-Length'] = $fileSize;
                }
                
                return response()->stream(function() use ($fullPath) {
                    $stream = @fopen($fullPath, 'rb');
                    if ($stream) {
                        fpassthru($stream);
                        fclose($stream);
                    }
                }, 200, $headers);
            }

            // Untuk file lainnya - gunakan response()->file()
            return response()->file($fullPath, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'inline; filename="' . $fileName . '"',
                'Cache-Control' => 'public, max-age=86400',
                'X-Content-Type-Options' => 'nosniff'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to serve file: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengakses file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate training progress percentage with caching
     */
    private function calculateTrainingProgress($userId, $trainingId)
    {
        // Build material ids list including legacy module-level assets and training_materials
        $module = \App\Models\Module::find($trainingId);
        $materialIds = [];
        $nextId = 1;

        if ($module) {
            if ($module->video_url) {
                $materialIds[] = $nextId++;
            }
            if ($module->document_url) {
                $materialIds[] = $nextId++;
            }
            if ($module->presentation_url) {
                $materialIds[] = $nextId++;
            }
        }

        $trainingMaterialIds = \App\Models\TrainingMaterial::where('module_id', $trainingId)->orderBy('order')->pluck('id')->toArray();
        // Append the actual training material IDs
        $materialIds = array_merge($materialIds, $trainingMaterialIds);

        $totalMaterials = count($materialIds);

        // Get completed materials by this user (match training_material_id to our material id list)
        $completedMaterials = \App\Models\UserMaterialProgress::where('user_id', $userId)
            ->whereIn('training_material_id', $materialIds)
            ->where('is_completed', true)
            ->count();

        return ($totalMaterials > 0) ? round(($completedMaterials / $totalMaterials) * 100) : 0;
    }

}
