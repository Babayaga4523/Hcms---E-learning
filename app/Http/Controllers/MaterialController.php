<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\TrainingMaterial;
use App\Models\UserBookmark;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Exception;

class MaterialController extends Controller
{
    /**
     * Mark material as completed
     */
    public function markComplete(Request $request, $trainingId, $materialId)
    {
        try {
            $material = TrainingMaterial::where('id', $materialId)
                ->where('module_id', $trainingId)
                ->firstOrFail();

            // Check if already completed
            $existingProgress = \App\Models\UserProgress::where('user_id', Auth::id())
                ->where('module_id', $trainingId)
                ->where('material_id', $materialId)
                ->first();

            if (!$existingProgress) {
                \App\Models\UserProgress::create([
                    'user_id' => Auth::id(),
                    'module_id' => $trainingId,
                    'material_id' => $materialId,
                    'completed_at' => now(),
                    'progress_percentage' => 100,
                    'status' => 'completed'
                ]);
            } else {
                $existingProgress->update([
                    'completed_at' => now(),
                    'progress_percentage' => 100,
                    'status' => 'completed'
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Material berhasil ditandai selesai'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menandai material selesai: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add material to bookmarks
     */
    public function addBookmark(Request $request, $trainingId, $materialId)
    {
        try {
            $material = TrainingMaterial::where('id', $materialId)
                ->where('module_id', $trainingId)
                ->firstOrFail();

            // Check if already bookmarked
            $existingBookmark = UserBookmark::where('user_id', Auth::id())
                ->where('material_id', $materialId)
                ->first();

            if ($existingBookmark) {
                return response()->json([
                    'success' => false,
                    'message' => 'Material sudah ada di bookmark'
                ], 400);
            }

            UserBookmark::create([
                'user_id' => Auth::id(),
                'material_id' => $materialId,
                'module_id' => $trainingId,
                'bookmarked_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Material berhasil ditambahkan ke bookmark',
                'is_bookmarked' => true
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan bookmark: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove material from bookmarks
     */
    public function removeBookmark(Request $request, $trainingId, $materialId)
    {
        try {
            $bookmark = UserBookmark::where('user_id', Auth::id())
                ->where('material_id', $materialId)
                ->firstOrFail();

            $bookmark->delete();

            return response()->json([
                'success' => true,
                'message' => 'Material berhasil dihapus dari bookmark',
                'is_bookmarked' => false
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus bookmark: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user bookmarks
     */
    public function getBookmarks(Request $request)
    {
        try {
            $bookmarks = UserBookmark::where('user_id', Auth::id())
                ->with(['material', 'module'])
                ->orderBy('bookmarked_at', 'desc')
                ->paginate($request->per_page ?? 20);

            $bookmarks->getCollection()->transform(function($bookmark) {
                return [
                    'id' => $bookmark->id,
                    'material' => [
                        'id' => $bookmark->material->id,
                        'title' => $bookmark->material->title,
                        'type' => $bookmark->material->type,
                        'file_path' => $bookmark->material->file_path
                    ],
                    'module' => [
                        'id' => $bookmark->module->id,
                        'title' => $bookmark->module->title
                    ],
                    'bookmarked_at' => $bookmark->bookmarked_at,
                    'url' => "/training/{$bookmark->module_id}/material/{$bookmark->material_id}"
                ];
            });

            return response()->json([
                'success' => true,
                'bookmarks' => $bookmarks
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil bookmark: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Share material
     */
    public function shareMaterial(Request $request, $trainingId, $materialId)
    {
        $request->validate([
            'type' => 'required|in:email,link,social',
            'recipients' => 'required_if:type,email|array',
            'recipients.*' => 'email',
            'message' => 'nullable|string|max:500'
        ]);

        try {
            $material = TrainingMaterial::where('id', $materialId)
                ->where('module_id', $trainingId)
                ->with('module')
                ->firstOrFail();

            $shareData = [
                'material' => $material,
                'shared_by' => Auth::user(),
                'shared_at' => now(),
                'share_type' => $request->type,
                'message' => $request->message
            ];

            switch ($request->type) {
                case 'email':
                    // Send email to recipients
                    foreach ($request->recipients as $email) {
                        // Here you would send actual email
                        // Mail::to($email)->send(new MaterialShared($shareData));
                    }
                    $message = 'Material berhasil dibagikan via email ke ' . count($request->recipients) . ' penerima';
                    break;

                case 'link':
                    // Generate shareable link
                    $shareableLink = url("/shared/training/{$trainingId}/material/{$materialId}");
                    $shareData['shareable_link'] = $shareableLink;
                    $message = 'Link berbagi berhasil dibuat';
                    break;

                case 'social':
                    // Prepare social media sharing data
                    $shareableLink = url("/shared/training/{$trainingId}/material/{$materialId}");
                    $shareData['social_links'] = [
                        'whatsapp' => "https://wa.me/?text=" . urlencode("Lihat materi training ini: {$material->title} - {$shareableLink}"),
                        'telegram' => "https://t.me/share/url?url=" . urlencode($shareableLink) . "&text=" . urlencode($material->title),
                        'linkedin' => "https://www.linkedin.com/sharing/share-offsite/?url=" . urlencode($shareableLink)
                    ];
                    $message = 'Link media sosial berhasil dibuat';
                    break;
            }

            // Log sharing activity
            \App\Models\ActivityLog::create([
                'user_id' => Auth::id(),
                'activity_type' => 'material_shared',
                'description' => "Membagikan material: {$material->title}",
                'metadata' => json_encode([
                    'material_id' => $materialId,
                    'module_id' => $trainingId,
                    'share_type' => $request->type,
                    'recipients_count' => $request->type === 'email' ? count($request->recipients ?? []) : null
                ])
            ]);

            return response()->json([
                'success' => true,
                'message' => $message,
                'share_data' => $shareData
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membagikan material: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get material sharing statistics
     */
    public function getSharingStats($trainingId, $materialId)
    {
        try {
            // Count sharing activities
            $shareCount = \App\Models\ActivityLog::where('activity_type', 'material_shared')
                ->where('metadata->material_id', $materialId)
                ->count();

            $bookmarkCount = UserBookmark::where('material_id', $materialId)->count();

            return response()->json([
                'success' => true,
                'stats' => [
                    'share_count' => $shareCount,
                    'bookmark_count' => $bookmarkCount,
                    'is_bookmarked' => UserBookmark::where('user_id', Auth::id())
                        ->where('material_id', $materialId)
                        ->exists()
                ]
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil statistik: ' . $e->getMessage()
            ], 500);
        }
    }
}