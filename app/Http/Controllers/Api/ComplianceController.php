<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserTraining;
use App\Models\Module;
use App\Services\ComplianceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class ComplianceController extends Controller
{
    protected ComplianceService $complianceService;

    public function __construct(ComplianceService $complianceService)
    {
        $this->complianceService = $complianceService;
    }

    /**
     * Get compliance dashboard summary
     */
    public function dashboard(): JsonResponse
    {
        try {
            $summary = $this->complianceService->getComplianceSummary();

            return response()->json([
                'success' => true,
                'data' => $summary,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get non-compliant users for module
     */
    public function nonCompliant(int $moduleId): JsonResponse
    {
        try {
            $module = Module::findOrFail($moduleId);
            $nonCompliant = $this->complianceService->getNonCompliantUsers($module);

            return response()->json([
                'success' => true,
                'data' => $nonCompliant->load(['user', 'module']),
                'count' => $nonCompliant->count(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get at-risk users (approaching deadline)
     */
    public function atRisk(int $moduleId, Request $request): JsonResponse
    {
        try {
            $daysBeforeDeadline = $request->input('days_before_deadline', 7);

            $module = Module::findOrFail($moduleId);
            $atRisk = $this->complianceService->getAtRiskUsers($module, $daysBeforeDeadline);

            return response()->json([
                'success' => true,
                'data' => $atRisk->load(['user', 'module']),
                'count' => $atRisk->count(),
                'filter' => [
                    'days_before_deadline' => $daysBeforeDeadline,
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Check and escalate compliance for enrollment
     */
    public function check(int $enrollmentId): JsonResponse
    {
        try {
            $enrollment = UserTraining::findOrFail($enrollmentId);

            $this->complianceService->checkAndEscalateCompliance($enrollment);

            return response()->json([
                'success' => true,
                'message' => 'Compliance check completed',
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
     * Check all enrollments compliance
     */
    public function checkAll(): JsonResponse
    {
        try {
            $this->complianceService->checkAllCompliance();

            $summary = $this->complianceService->getComplianceSummary();

            return response()->json([
                'success' => true,
                'message' => 'All compliance checks completed',
                'data' => $summary,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Resolve non-compliance
     */
    public function resolve(int $enrollmentId, Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'reason' => 'required|string',
            ]);

            $enrollment = UserTraining::findOrFail($enrollmentId);

            $this->complianceService->resolveNonCompliance(
                $enrollment,
                $validated['reason']
            );

            return response()->json([
                'success' => true,
                'message' => 'Non-compliance resolved',
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
     * Get compliance audit logs for enrollment
     */
    public function auditLogs(int $enrollmentId): JsonResponse
    {
        try {
            $enrollment = UserTraining::findOrFail($enrollmentId);
            $logs = $enrollment->complianceAuditLogs()
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $logs,
                'count' => $logs->count(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
