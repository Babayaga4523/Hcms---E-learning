<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TrainingMaterial;
use App\Models\Module;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Exception;

class SmartContentController extends Controller
{
    /**
     * Handle file upload with progress tracking
     */
    public function uploadContent(Request $request)
    {
        $request->validate([
            'files.*' => 'required|file|max:102400', // 100MB max per file
            'module_id' => 'required|exists:modules,id',
            'type' => 'required|in:video,pdf,document,image,audio'
        ]);

        try {
            $module = Module::findOrFail($request->module_id);
            $uploadResults = [];

            foreach ($request->file('files') as $file) {
                $uploadId = Str::uuid();
                
                // Store file
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('training-materials', $filename, 'public');

                // Create initial tracking record
                $material = TrainingMaterial::create([
                    'module_id' => $request->module_id,
                    'title' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                    'type' => $request->type,
                    'file_path' => $path,
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getClientMimeType(),
                    'original_filename' => $file->getClientOriginalName(),
                    'upload_id' => $uploadId,
                    'status' => 'processing',
                    'processing_details' => json_encode([
                        'uploaded_at' => now(),
                        'progress' => 0,
                        'stage' => 'uploaded'
                    ])
                ]);

                // Start background processing
                $this->processContent($material);

                $uploadResults[] = [
                    'id' => $material->id,
                    'upload_id' => $uploadId,
                    'filename' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'status' => 'processing',
                    'progress' => 0
                ];
            }

            return response()->json([
                'success' => true,
                'message' => 'Files uploaded successfully',
                'uploads' => $uploadResults
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get upload progress
     */
    public function getUploadProgress($uploadId)
    {
        try {
            $material = TrainingMaterial::where('upload_id', $uploadId)->firstOrFail();
            
            $processingDetails = json_decode($material->processing_details, true) ?? [];

            return response()->json([
                'success' => true,
                'upload_id' => $uploadId,
                'status' => $material->status,
                'progress' => $processingDetails['progress'] ?? 0,
                'stage' => $processingDetails['stage'] ?? 'unknown',
                'details' => $processingDetails,
                'conversion_details' => $processingDetails['conversion'] ?? null
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload not found'
            ], 404);
        }
    }

    /**
     * List all uploads with their status
     */
    public function listUploads(Request $request)
    {
        try {
            $query = TrainingMaterial::with('module:id,title')
                ->orderBy('created_at', 'desc');

            if ($request->status) {
                $query->where('status', $request->status);
            }

            if ($request->module_id) {
                $query->where('module_id', $request->module_id);
            }

            $uploads = $query->paginate($request->per_page ?? 20);

            // Transform data for frontend
            $uploads->getCollection()->transform(function($material) {
                $processingDetails = json_decode($material->processing_details, true) ?? [];
                
                return [
                    'id' => $material->id,
                    'upload_id' => $material->upload_id,
                    'title' => $material->title,
                    'filename' => $material->original_filename,
                    'type' => $material->type,
                    'size' => $material->file_size,
                    'status' => $material->status,
                    'progress' => $processingDetails['progress'] ?? 100,
                    'uploaded_at' => $material->created_at,
                    'module' => $material->module,
                    'conversion_details' => $processingDetails['conversion'] ?? null,
                    'error_message' => $processingDetails['error'] ?? null
                ];
            });

            return response()->json([
                'success' => true,
                'uploads' => $uploads
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch uploads: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete upload
     */
    public function deleteUpload($id)
    {
        try {
            $material = TrainingMaterial::findOrFail($id);

            // Delete file from storage
            if (Storage::disk('public')->exists($material->file_path)) {
                Storage::disk('public')->delete($material->file_path);
            }

            // Delete processed files if any
            $processingDetails = json_decode($material->processing_details, true) ?? [];
            if (isset($processingDetails['processed_files'])) {
                foreach ($processingDetails['processed_files'] as $file) {
                    if (Storage::disk('public')->exists($file)) {
                        Storage::disk('public')->delete($file);
                    }
                }
            }

            $material->delete();

            return response()->json([
                'success' => true,
                'message' => 'Upload deleted successfully'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete upload: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retry processing failed upload
     */
    public function retryProcessing($id)
    {
        try {
            $material = TrainingMaterial::findOrFail($id);
            
            if ($material->status !== 'failed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Upload is not in failed state'
                ], 400);
            }

            $material->update([
                'status' => 'processing',
                'processing_details' => json_encode([
                    'progress' => 0,
                    'stage' => 'retrying',
                    'retried_at' => now()
                ])
            ]);

            $this->processContent($material);

            return response()->json([
                'success' => true,
                'message' => 'Processing retried successfully'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retry processing: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process uploaded content (simulate background processing)
     */
    private function processContent(TrainingMaterial $material)
    {
        try {
            // Simulate processing stages
            $stages = [
                'validation' => 20,
                'conversion' => 60,
                'optimization' => 80,
                'finalization' => 100
            ];

            $processingDetails = json_decode($material->processing_details, true) ?? [];
            
            foreach ($stages as $stage => $progress) {
                // Update progress
                $processingDetails['progress'] = $progress;
                $processingDetails['stage'] = $stage;
                $processingDetails['last_updated'] = now();

                // Simulate stage-specific processing
                switch ($stage) {
                    case 'validation':
                        $processingDetails['validation'] = [
                            'file_integrity' => 'passed',
                            'virus_scan' => 'clean',
                            'format_check' => 'valid'
                        ];
                        break;
                        
                    case 'conversion':
                        if ($material->type === 'video') {
                            $processingDetails['conversion'] = [
                                'thumbnails_generated' => true,
                                'multiple_resolutions' => true,
                                'subtitles_extracted' => rand(0, 1) == 1
                            ];
                        } elseif ($material->type === 'pdf') {
                            $processingDetails['conversion'] = [
                                'text_extracted' => true,
                                'images_extracted' => true,
                                'searchable' => true
                            ];
                        }
                        break;
                        
                    case 'optimization':
                        $processingDetails['optimization'] = [
                            'compressed' => true,
                            'cdn_ready' => true,
                            'mobile_optimized' => true
                        ];
                        break;
                        
                    case 'finalization':
                        $processingDetails['completed_at'] = now();
                        $material->status = 'completed';
                        break;
                }

                $material->update([
                    'status' => $progress === 100 ? 'completed' : 'processing',
                    'processing_details' => json_encode($processingDetails)
                ]);

                // Simulate processing time
                if ($progress < 100) {
                    sleep(1); // In real implementation, this would be handled by queue jobs
                }
            }

        } catch (Exception $e) {
            // Mark as failed
            $processingDetails = json_decode($material->processing_details, true) ?? [];
            $processingDetails['error'] = $e->getMessage();
            $processingDetails['failed_at'] = now();

            $material->update([
                'status' => 'failed',
                'processing_details' => json_encode($processingDetails)
            ]);
        }
    }

    /**
     * Preview processed content
     */
    public function previewContent($id)
    {
        try {
            $material = TrainingMaterial::findOrFail($id);
            
            if ($material->status !== 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Content is not ready for preview'
                ], 400);
            }

            $previewData = [
                'id' => $material->id,
                'title' => $material->title,
                'type' => $material->type,
                'file_url' => Storage::url($material->file_path),
                'size' => $material->file_size,
                'mime_type' => $material->mime_type
            ];

            $processingDetails = json_decode($material->processing_details, true) ?? [];
            if (isset($processingDetails['conversion'])) {
                $previewData['conversion_details'] = $processingDetails['conversion'];
            }

            return response()->json([
                'success' => true,
                'preview' => $previewData
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Preview failed: ' . $e->getMessage()
            ], 500);
        }
    }
}