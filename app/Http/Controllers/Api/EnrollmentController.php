<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Module;
use App\Models\UserTraining;
use App\Services\EnrollmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class EnrollmentController extends Controller
{
    protected EnrollmentService $enrollmentService;

    public function __construct(EnrollmentService $enrollmentService)
    {
        $this->enrollmentService = $enrollmentService;
    }

    /**
     * Enroll user in module
     */
    public function enroll(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'user_id' => 'required|integer|exists:users,id',
                'module_id' => 'required|integer|exists:modules,id',
            ]);

            $user = User::findOrFail($validated['user_id']);
            $module = Module::findOrFail($validated['module_id']);

            $enrollment = $this->enrollmentService->enroll($user, $module);

            return response()->json([
                'success' => true,
                'message' => 'User enrolled successfully',
                'data' => $enrollment->load(['module', 'user']),
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Transition enrollment state
     */
    public function transitionState(Request $request, int $enrollmentId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status' => 'required|string|in:enrolled,in_progress,completed,failed,cancelled,certified',
                'reason' => 'nullable|string',
            ]);

            $enrollment = UserTraining::findOrFail($enrollmentId);

            $this->enrollmentService->transitionState(
                $enrollment,
                $validated['status'],
                ['reason' => $validated['reason'] ?? null]
            );

            return response()->json([
                'success' => true,
                'message' => 'State transitioned successfully',
                'data' => $enrollment->fresh(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Issue certificate for enrollment
     */
    public function issueCertificate(int $enrollmentId): JsonResponse
    {
        try {
            $enrollment = UserTraining::findOrFail($enrollmentId);

            $this->enrollmentService->issueCertificate($enrollment);

            return response()->json([
                'success' => true,
                'message' => 'Certificate issued successfully',
                'data' => $enrollment->fresh(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get enrollment details
     */
    public function show(int $enrollmentId): JsonResponse
    {
        try {
            $enrollment = UserTraining::with([
                'user',
                'module',
                'complianceAuditLogs',
            ])->findOrFail($enrollmentId);

            return response()->json([
                'success' => true,
                'data' => $enrollment,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Get user enrollments
     */
    public function userEnrollments(int $userId): JsonResponse
    {
        try {
            $enrollments = UserTraining::where('user_id', $userId)
                ->with(['module', 'complianceAuditLogs'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $enrollments,
                'count' => $enrollments->count(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get module enrollments
     */
    public function moduleEnrollments(int $moduleId): JsonResponse
    {
        try {
            $enrollments = UserTraining::where('module_id', $moduleId)
                ->with(['user'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $enrollments,
                'count' => $enrollments->count(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
