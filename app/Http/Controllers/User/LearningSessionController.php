<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\LearningSession;
use App\Services\LearningTimeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LearningSessionController extends Controller
{
    protected $learningTimeService;

    public function __construct(LearningTimeService $learningTimeService)
    {
        $this->learningTimeService = $learningTimeService;
    }

    /**
     * Start a learning session when user opens material
     * POST /api/learning/session/start
     */
    public function startSession(Request $request)
    {
        $validated = $request->validate([
            'module_id' => 'required|exists:modules,id',
            'material_id' => 'nullable|exists:training_materials,id',
            'activity_type' => 'in:material,pretest,posttest,review,quiz,other',
        ]);

        $session = $this->learningTimeService->startSession(
            Auth::id(),
            $validated['module_id'],
            $validated['material_id'] ?? null,
            $validated['activity_type'] ?? 'material'
        );

        return response()->json([
            'success' => true,
            'session_id' => $session->id,
            'message' => 'Learning session started',
        ]);
    }

    /**
     * End a learning session
     * POST /api/learning/session/{sessionId}/end
     */
    public function endSession($sessionId)
    {
        $session = LearningSession::findOrFail($sessionId);

        // Verify ownership
        if ($session->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $session->endSession();

        return response()->json([
            'success' => true,
            'duration_minutes' => $session->duration_minutes,
            'duration_hours' => $session->getDurationHours(),
            'message' => 'Learning session ended',
        ]);
    }

    /**
     * Get current active session for a module
     * GET /api/learning/session/active
     */
    public function getActiveSession(Request $request)
    {
        $validated = $request->validate([
            'module_id' => 'required|exists:modules,id',
        ]);

        $session = LearningSession::where('user_id', Auth::id())
            ->where('module_id', $validated['module_id'])
            ->where('is_active', true)
            ->latest()
            ->first();

        if (!$session) {
            return response()->json(['session' => null]);
        }

        return response()->json([
            'session' => [
                'id' => $session->id,
                'started_at' => $session->started_at,
                'elapsed_minutes' => now()->diffInMinutes($session->started_at),
                'is_active' => $session->is_active,
            ]
        ]);
    }

    /**
     * Get user learning stats
     * GET /api/learning/stats
     */
    public function getStats()
    {
        return response()->json($this->learningTimeService->getUserLearningStats(Auth::id()));
    }

    /**
     * Get daily activity chart data
     * GET /api/learning/daily-activity
     */
    public function getDailyActivity()
    {
        return response()->json([
            'data' => $this->learningTimeService->getDailyActivity(Auth::id()),
        ]);
    }
}
