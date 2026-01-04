<?php

namespace App\Http\Controllers\Admin;

use App\Models\Reminder;
use App\Models\User;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ReminderController
{
    /**
     * Get all reminders with filters
     */
    public function index(Request $request)
    {
        try {
            $query = Reminder::query();

            // Filter by status
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            // Filter by department
            if ($request->filled('department_id')) {
                $query->whereHas('department', fn($q) => $q->where('id', $request->department_id));
            }

            // Filter by completion rate
            if ($request->filled('min_completion')) {
                $query->whereRaw('(sent_count > 0 AND (CAST(opened_count AS FLOAT) / sent_count) >= ?)', [$request->min_completion / 100]);
            }

            // Search by title
            if ($request->filled('search')) {
                $query->where('title', 'like', '%' . $request->search . '%');
            }

            $reminders = $query->with('department')
                ->orderBy('scheduled_at', 'desc')
                ->paginate($request->get('per_page', 15));

            return response()->json($reminders);
        } catch (\Exception $e) {
            Log::error('Reminder index error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Create a new reminder
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'message' => 'required|string',
                'recipient_users' => 'required|array|min:1',
                'recipient_users.*' => 'exists:users,id',
                'scheduled_at' => 'nullable|date',
                'send_now' => 'boolean',
                'department_id' => 'nullable|exists:departments,id',
            ]);

            $reminder = new Reminder();
            $reminder->title = $validated['title'];
            $reminder->message = $validated['message'];
            $reminder->recipient_count = count($validated['recipient_users']);
            $reminder->department_id = $validated['department_id'] ?? null;
            $reminder->scheduled_at = $validated['send_now'] ? now() : $validated['scheduled_at'];
            $reminder->status = $validated['send_now'] ? 'sent' : 'scheduled';
            $reminder->created_by = Auth::id();
            $reminder->save();

            // Store recipient users
            $reminder->users()->sync($validated['recipient_users']);

            // Send immediately if requested
            if ($validated['send_now']) {
                $this->sendReminder($reminder);
            }

            return response()->json([
                'message' => 'Reminder created successfully',
                'reminder' => $reminder->load('department', 'users'),
            ], 201);
        } catch (\Exception $e) {
            Log::error('Reminder store error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Update a reminder
     */
    public function update(Request $request, $id)
    {
        try {
            $reminder = Reminder::findOrFail($id);

            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'message' => 'sometimes|string',
                'recipient_users' => 'sometimes|array',
                'recipient_users.*' => 'exists:users,id',
                'scheduled_at' => 'sometimes|nullable|date',
                'department_id' => 'sometimes|nullable|exists:departments,id',
            ]);

            $reminder->update($validated);

            if (isset($validated['recipient_users'])) {
                $reminder->users()->sync($validated['recipient_users']);
                $reminder->update(['recipient_count' => count($validated['recipient_users'])]);
            }

            return response()->json([
                'message' => 'Reminder updated successfully',
                'reminder' => $reminder->load('department', 'users'),
            ]);
        } catch (\Exception $e) {
            Log::error('Reminder update error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Send a reminder immediately
     */
    public function send(Request $request, $id)
    {
        try {
            $reminder = Reminder::findOrFail($id);

            if ($reminder->status === 'sent') {
                return response()->json(['error' => 'This reminder has already been sent'], 400);
            }

            $this->sendReminder($reminder);

            $reminder->update([
                'status' => 'sent',
                'sent_at' => now(),
                'sent_count' => $reminder->users()->count(),
            ]);

            return response()->json([
                'message' => 'Reminder sent successfully',
                'reminder' => $reminder->load('department', 'users'),
            ]);
        } catch (\Exception $e) {
            Log::error('Reminder send error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a reminder
     */
    public function destroy($id)
    {
        try {
            $reminder = Reminder::findOrFail($id);
            
            if ($reminder->status === 'sent') {
                return response()->json(['error' => 'Cannot delete sent reminders'], 400);
            }

            $reminder->users()->detach();
            $reminder->delete();

            return response()->json(['message' => 'Reminder deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Reminder destroy error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Helper function to send reminder emails
     */
    private function sendReminder(Reminder $reminder)
    {
        $users = $reminder->users()->get();
        
        foreach ($users as $user) {
            try {
                // Log email (in production, use Mail::send or queue)
                Log::info("Reminder '{$reminder->title}' sent to {$user->email}");
                
                // Mark as opened if email opened (would need pixel tracking)
                // For now, simulate delivery
            } catch (\Exception $e) {
                Log::error("Failed to send reminder to {$user->email}: " . $e->getMessage());
            }
        }
    }
}
