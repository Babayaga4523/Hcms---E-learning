<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\Module;
use App\Models\ModuleProgress;
use App\Models\UserTraining;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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

            // Check if module is active and approved
            if (!$training->is_active || $training->approval_status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Training is not available',
                    'materials' => [],
                    'total' => 0,
                    'completed' => 0
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
                    'id' => $materialId++,
                    'title' => $material->title,
                    'type' => $material->file_type,
                    'url' => $this->ensureValidUrl($material->file_path ?: $material->pdf_path),
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
            
            // Get user's progress
            $progress = ModuleProgress::where('user_id', $user->id)
                ->where('module_id', $trainingId)
                ->first();
            
            // Mark completed if user has progress
            if ($progress && $progress->status === 'completed') {
                $materials = $materials->map(function($m) {
                    $m['is_completed'] = true;
                    return $m;
                });
            }
            
            return response()->json([
                'success' => true,
                'materials' => $materials->values()->all(),
                'total' => $materials->count(),
                'completed' => $progress && $progress->status === 'completed' ? $materials->count() : 0
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

            // Check if module is active and approved
            if (!$training->is_active || $training->approval_status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Training is not available',
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
                    'id' => $materialIdCounter++,
                    'title' => $trainingMaterial->title,
                    'type' => $trainingMaterial->file_type,
                    'url' => $this->ensureValidUrl($trainingMaterial->file_path ?: $trainingMaterial->pdf_path),
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
            
            // Mark materials as completed if user has completed progress
            if ($progress && $progress->status === 'completed') {
                $materials = $materials->map(function($m) {
                    $m['is_completed'] = true;
                    return $m;
                });
                $material['is_completed'] = true;
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
            
            // Update progress record
            $progress = ModuleProgress::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'module_id' => $trainingId,
                ],
                [
                    'status' => 'completed',
                    'progress_percentage' => 100,
                    'last_accessed_at' => now()
                ]
            );
            
            // Update user training status
            UserTraining::where('user_id', $user->id)
                ->where('module_id', $trainingId)
                ->update([
                    'status' => 'completed',
                    'completed_at' => now()
                ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Material berhasil ditandai selesai',
                'progress' => $progress
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
    
}
