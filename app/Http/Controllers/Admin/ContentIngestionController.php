<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContentUpload;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ContentIngestionController extends Controller
{
    /**
     * Upload and convert content
     */
    public function upload(Request $request)
    {
        $this->authorize('upload-content');
        try {
            $validated = $request->validate([
                'file' => 'required|file|mimes:pptx,pdf,mp4,avi,mov,wmv|max:500000', // 500MB max
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
            ]);

            if (!$request->hasFile('file')) {
                return response()->json(['error' => 'No file provided'], 400);
            }

            $file = $request->file('file');
            $fileName = Str::uuid() . '.' . $file->getClientOriginalExtension();
            
            // Store file
            $filePath = $file->storeAs('content-uploads', $fileName, 'public');
            
            // Create upload record
            $upload = new ContentUpload();
            $upload->title = $validated['title'];
            $upload->description = $validated['description'] ?? null;
            $upload->file_path = $filePath;
            $upload->original_filename = $file->getClientOriginalName();
            $upload->file_type = $file->getMimeType();
            $upload->file_size = $file->getSize();
            $upload->status = 'processing';
            $upload->progress = 0;
            $upload->created_by = Auth::id();
            $upload->save();

            // Simulate conversion process
            $this->processConversion($upload, $file->getClientOriginalExtension());

            return response()->json([
                'message' => 'Content uploaded successfully',
                'upload' => $upload,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Content upload error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get all content uploads
     */
    public function index(Request $request)
    {
        try {
            $query = ContentUpload::query();

            // Filter by status
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            // Search by title
            if ($request->filled('search')) {
                $query->where('title', 'like', '%' . $request->search . '%');
            }

            $uploads = $query->orderBy('created_at', 'desc')
                ->paginate($request->get('per_page', 15));

            return response()->json($uploads);
        } catch (\Exception $e) {
            Log::error('Content index error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get a specific upload with details
     */
    public function show($id)
    {
        try {
            $upload = ContentUpload::findOrFail($id);
            return response()->json($upload);
        } catch (\Exception $e) {
            Log::error('Content show error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete an upload
     */
    public function destroy($id)
    {
        try {
            $upload = ContentUpload::findOrFail($id);

            // Delete file
            if (Storage::disk('public')->exists($upload->file_path)) {
                Storage::disk('public')->delete($upload->file_path);
            }

            // Delete converted files if they exist
            $convertedDir = 'content-conversions/' . $upload->id;
            if (Storage::disk('public')->exists($convertedDir)) {
                Storage::disk('public')->deleteDirectory($convertedDir);
            }

            $upload->delete();

            return response()->json(['message' => 'Content deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Content destroy error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Simulate content conversion
     */
    private function processConversion(ContentUpload $upload, string $extension)
    {
        $extension = strtolower($extension);
        $conversionResults = [];

        try {
            if ($extension === 'pptx') {
                // Simulate PowerPoint conversion
                $upload->update([
                    'progress' => 50,
                    'conversion_type' => 'pptx_conversion',
                    'conversion_details' => json_encode([
                        'slides_converted' => rand(10, 50),
                        'images_extracted' => rand(5, 30),
                        'text_processed' => true,
                    ]),
                ]);
                $conversionResults['pptx'] = 'Converted to PDF and images';
            } elseif ($extension === 'pdf') {
                // Simulate PDF conversion
                $upload->update([
                    'progress' => 50,
                    'conversion_type' => 'pdf_conversion',
                    'conversion_details' => json_encode([
                        'pages_converted' => rand(5, 100),
                        'images_extracted' => rand(2, 20),
                        'text_extracted' => true,
                    ]),
                ]);
                $conversionResults['pdf'] = 'Converted to images and text';
            } else {
                // Video formats
                $upload->update([
                    'progress' => 50,
                    'conversion_type' => 'video_conversion',
                    'conversion_details' => json_encode([
                        'duration' => rand(300, 7200) . ' seconds',
                        'subtitles_extracted' => rand(0, 1) ? true : false,
                        'thumbnail_generated' => true,
                        'transcription_available' => true,
                    ]),
                ]);
                $conversionResults['video'] = 'Extracted subtitles and transcription';
            }

            // Simulate completion
            $upload->update([
                'status' => 'completed',
                'progress' => 100,
                'conversion_completed_at' => now(),
            ]);

        } catch (\Exception $e) {
            Log::error('Content conversion error for upload ' . $upload->id . ': ' . $e->getMessage());
            $upload->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
        }
    }
}
