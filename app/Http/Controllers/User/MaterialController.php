<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\Module;
use App\Models\ModuleProgress;
use App\Models\UserTraining;
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

            $training = Module::findOrFail($trainingId);

            // Check if user is enrolled in this training
            $userTraining = UserTraining::where('user_id', $user->id)
                ->where('module_id', $trainingId)
                ->first();

            if (!$userTraining) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not assigned to this training',
                    'materials' => [],
                    'total' => 0,
                    'completed' => 0
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
                    'completed' => 0
                ], 403);
            }

            // Build materials from both module fields and training_materials table
            $materials = collect();
            $materialId = 1;

            // Add video material if video_url exists
            if ($training->video_url) {
                $materials->push([
                    'id' => $materialId++,
                    'title' => 'Video Pembelajaran',
                    'type' => 'video',
                    'url' => $this->ensureValidUrl($training->video_url),
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
                $materials->push([
                    'id' => $material->id, // Use actual material ID
                    'title' => $material->title,
                    'type' => $material->file_type,
                    'url' => $material->file_path || $material->pdf_path ? route('user.materials.serve', [$trainingId, $material->id]) : null,
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
            Log::error('Failed to load materials: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'materials' => [],
                'total' => 0,
                'completed' => 0
            ], 404);
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

            // Build virtual materials from module fields (same as index method)
            $materials = collect();
            $materialIdCounter = 1;
            
            // Add video material if video_url exists
            if ($training->video_url) {
                $materials->push([
                    'id' => $materialIdCounter++,
                    'title' => 'Video Pembelajaran',
                    'type' => 'video',
                    'url' => $this->ensureValidUrl($training->video_url),
                    'duration' => 30,
                    'module_title' => $training->title,
                    'is_completed' => false,
                    'content' => null,
                    'description' => 'Video pembelajaran untuk modul ' . $training->title
                ]);
            }

            // Add document material if document_url exists
            if ($training->document_url) {
                $materials->push([
                    'id' => $materialIdCounter++,
                    'title' => 'Dokumen Pembelajaran',
                    'type' => 'document',
                    'url' => $this->ensureValidUrl($training->document_url),
                    'duration' => 20,
                    'module_title' => $training->title,
                    'is_completed' => false,
                    'content' => null,
                    'description' => 'Dokumen pembelajaran untuk modul ' . $training->title
                ]);
            }

            // Add presentation material if presentation_url exists
            if ($training->presentation_url) {
                $materials->push([
                    'id' => $materialIdCounter++,
                    'title' => 'Presentasi',
                    'type' => 'presentation',
                    'url' => $this->ensureValidUrl($training->presentation_url),
                    'duration' => 25,
                    'module_title' => $training->title,
                    'is_completed' => false,
                    'content' => null,
                    'description' => 'Presentasi untuk modul ' . $training->title
                ]);
            }

            // Add materials from training_materials table
            $trainingMaterials = \App\Models\TrainingMaterial::where('module_id', $trainingId)
                ->orderBy('order')
                ->get();

            foreach ($trainingMaterials as $trainingMaterial) {
                $materials->push([
                    'id' => $trainingMaterial->id,
                    'title' => $trainingMaterial->title,
                    'type' => $trainingMaterial->file_type,
                    'url' => $trainingMaterial->file_path || $trainingMaterial->pdf_path ? route('user.materials.serve', [$trainingId, $trainingMaterial->id]) : null,
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
            $material = $materials->firstWhere('id', (int)$materialId);
            
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

            // Determine completed materials for this user/module
            $completedMaterialIds = \App\Models\UserMaterialProgress::where('user_id', $user->id)
                ->where('is_completed', true)
                ->whereHas('material', function($q) use ($trainingId) {
                    $q->where('module_id', $trainingId);
                })->pluck('training_material_id')->toArray();

            // If module is fully completed, mark all as completed; otherwise mark individually
            if ($progress && $progress->status === 'completed') {
                $materials = $materials->map(function($m) {
                    $m['is_completed'] = true;
                    return $m;
                });
                $material['is_completed'] = true;
            } else {
                $materials = $materials->map(function($m) use ($completedMaterialIds) {
                    $m['is_completed'] = in_array($m['id'], $completedMaterialIds);
                    return $m;
                });
                // Ensure the single material reflects its own completed flag
                $material['is_completed'] = in_array($material['id'], $completedMaterialIds) || ($progress && $progress->status === 'completed');
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
     */
    public function complete($trainingId, $materialId)
    {
        try {
            $user = Auth::user();

            // First, mark this specific material as completed
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

            // Calculate real-time progress percentage
            $progressPercentage = $this->calculateTrainingProgress($user->id, $trainingId);

            // Update module progress with calculated percentage
            $progress = ModuleProgress::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'module_id' => $trainingId,
                ],
                [
                    'status' => $progressPercentage >= 100 ? 'completed' : 'in_progress',
                    'progress_percentage' => $progressPercentage,
                    'last_accessed_at' => now()
                ]
            );

            // Clear progress cache to ensure fresh calculations
            Cache::forget("training_progress_{$user->id}_{$trainingId}");

            // Update user training status only if fully completed
            if ($progressPercentage >= 100) {
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
                'progress_percentage' => $progressPercentage
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
                return response()->json([
                    'success' => false,
                    'message' => 'File tidak ditemukan'
                ], 404);
            }

            $fullPath = null;

            // First try Storage::exists on the given path (app/<path>)
            if (Storage::exists($filePath)) {
                $fullPath = storage_path('app/' . $filePath);
            } else {
                // If path is stored with public/ prefix, check public disk
                if (Str::startsWith($filePath, 'public/')) {
                    $relative = substr($filePath, 7);
                    if (Storage::disk('public')->exists($relative)) {
                        $fullPath = Storage::disk('public')->path($relative);
                    }
                }

                // Fallback: try common alternate locations where files might be stored
                if (!$fullPath) {
                    $basename = basename($filePath);
                    $candidates = [
                        storage_path('app/public/training-materials/' . $basename),
                        storage_path('app/private/public/materials/' . $basename),
                        storage_path('app/materials/' . $basename),
                    ];
                    foreach ($candidates as $candidate) {
                        if (file_exists($candidate)) {
                            $fullPath = $candidate;
                            break;
                        }
                    }
                }
            }

            if (!$fullPath || !file_exists($fullPath)) {
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

            // Serve file with appropriate headers
            return response()->file($fullPath, [
                'Content-Type' => $this->getMimeType($fullPath),
                'Content-Disposition' => 'inline; filename="' . basename($fullPath) . '"',
                'Cache-Control' => 'private, max-age=3600' // Cache for 1 hour
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to serve file: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengakses file'
            ], 500);
        }
    }

    /**
     * Get MIME type for file
     */
    private function getMimeType($filePath)
    {
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

        $mimeTypes = [
            'pdf' => 'application/pdf',
            'mp4' => 'video/mp4',
            'avi' => 'video/x-msvideo',
            'mov' => 'video/quicktime',
            'wmv' => 'video/x-ms-wmv',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt' => 'application/vnd.ms-powerpoint',
            'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'txt' => 'text/plain',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif'
        ];

        return $mimeTypes[$extension] ?? 'application/octet-stream';
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
