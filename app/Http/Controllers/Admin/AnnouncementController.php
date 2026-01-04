<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AnnouncementController extends Controller
{
    /**
     * Get all announcements
     */
    public function index(Request $request)
    {
        try {
            $announcements = DB::table('announcements')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($announcements);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch announcements',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create announcement
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'type' => 'required|in:general,urgent,maintenance,event',
                'status' => 'required|in:active,inactive,scheduled',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'is_featured' => 'boolean',
                'display_type' => 'required|in:banner,modal,notification',
            ]);

            $id = DB::table('announcements')->insertGetId([
                'title' => $request->input('title'),
                'content' => $request->input('content'),
                'type' => $request->input('type'),
                'status' => $request->input('status'),
                'start_date' => $request->input('start_date'),
                'end_date' => $request->input('end_date'),
                'is_featured' => $request->input('is_featured', false),
                'display_type' => $request->input('display_type'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $announcement = DB::table('announcements')->where('id', $id)->first();

            // Send notification to all users if status is active
            if ($request->input('status') === 'active') {
                $this->sendAnnouncementNotification($announcement);
            }

            return response()->json([
                'message' => 'Announcement created successfully',
                'data' => $announcement
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create announcement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get announcement by ID
     */
    public function show($id)
    {
        try {
            $announcement = DB::table('announcements')->where('id', $id)->first();

            if (!$announcement) {
                return response()->json(['message' => 'Announcement not found'], 404);
            }

            return response()->json($announcement);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch announcement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update announcement
     */
    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'type' => 'required|in:general,urgent,maintenance,event',
                'status' => 'required|in:active,inactive,scheduled',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'is_featured' => 'boolean',
                'display_type' => 'required|in:banner,modal,notification',
            ]);

            DB::table('announcements')->where('id', $id)->update([
                'title' => $request->input('title'),
                'content' => $request->input('content'),
                'type' => $request->input('type'),
                'status' => $request->input('status'),
                'start_date' => $request->input('start_date'),
                'end_date' => $request->input('end_date'),
                'is_featured' => $request->input('is_featured', false),
                'display_type' => $request->input('display_type'),
                'updated_at' => now(),
            ]);

            $announcement = DB::table('announcements')->where('id', $id)->first();

            return response()->json([
                'message' => 'Announcement updated successfully',
                'data' => $announcement
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update announcement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete announcement
     */
    public function destroy($id)
    {
        try {
            DB::table('announcements')->where('id', $id)->delete();

            return response()->json([
                'message' => 'Announcement deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete announcement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle announcement status
     */
    public function toggleStatus(Request $request, $id)
    {
        try {
            $request->validate([
                'status' => 'required|in:active,inactive,scheduled'
            ]);

            DB::table('announcements')->where('id', $id)->update([
                'status' => $request->input('status'),
                'updated_at' => now(),
            ]);

            $announcement = DB::table('announcements')->where('id', $id)->first();

            return response()->json([
                'message' => 'Status updated successfully',
                'data' => $announcement
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to toggle status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get active announcements for users
     */
    public function getActiveAnnouncements()
    {
        try {
            $now = now();
            
            $announcements = DB::table('announcements')
                ->where('status', 'active')
                ->where(function ($query) use ($now) {
                    $query->whereNull('start_date')
                        ->orWhere('start_date', '<=', $now);
                })
                ->where(function ($query) use ($now) {
                    $query->whereNull('end_date')
                        ->orWhere('end_date', '>=', $now);
                })
                ->orderBy('is_featured', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($announcements);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch announcements',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send announcement notification to all users
     */
    private function sendAnnouncementNotification($announcement)
    {
        try {
            // Get all non-admin users
            $users = \App\Models\User::where('role', '!=', 'admin')->get();

            // Determine notification type based on announcement type
            $notificationType = match($announcement->type) {
                'urgent' => 'warning',
                'maintenance' => 'info',
                'event' => 'success',
                default => 'info',
            };

            // Create notification for each user (only if not already sent)
            foreach ($users as $user) {
                // Check if notification already exists for this announcement and user
                $exists = \App\Models\Notification::where('user_id', $user->id)
                    ->whereRaw("JSON_EXTRACT(data, '$.announcement_id') = ?", [$announcement->id])
                    ->exists();

                if (!$exists) {
                    \App\Models\Notification::create([
                        'user_id' => $user->id,
                        'type' => $notificationType,
                        'title' => '📢 ' . $announcement->title,
                        'message' => strip_tags(substr($announcement->content, 0, 200)) . (strlen($announcement->content) > 200 ? '...' : ''),
                        'data' => json_encode([
                            'announcement_id' => $announcement->id,
                            'type' => 'announcement',
                        ]),
                        'is_read' => false,
                    ]);
                }
            }

            return true;
        } catch (\Exception $e) {
            // Log error but don't fail the announcement creation
            Log::error('Failed to send announcement notifications: ' . $e->getMessage());
            return false;
        }
    }
}
