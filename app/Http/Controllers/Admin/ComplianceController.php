<?php

namespace App\Http\Controllers\Admin;

use App\Models\Module;
use App\Models\User;
use App\Models\ProgramApproval;
use App\Models\ComplianceEvidence;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ComplianceController
{
    /**
     * Request program approval
     */
    public function requestApproval(Request $request, $moduleId)
    {
        $module = Module::findOrFail($moduleId);
        $user = Auth::user();

        $validated = $request->validate([
            'request_notes' => 'nullable|string|max:1000',
        ]);

        $approval = ProgramApproval::create([
            'module_id' => $moduleId,
            'status' => 'pending',
            'requested_by' => $user->id,
            'request_notes' => $validated['request_notes'] ?? null,
            'requested_at' => now(),
        ]);

        // Log audit trail
        AuditLog::log('request_approval', $module, $user, [
            'status' => 'pending',
            'module_title' => $module->title,
        ]);

        // Update module status
        $module->update(['approval_status' => 'pending_approval']);

        return response()->json([
            'success' => true,
            'message' => 'Permohonan persetujuan program berhasil dikirim',
            'data' => $approval,
        ]);
    }

    /**
     * Approve program
     */
    public function approveProgram(Request $request, $approvalId)
    {
        $approval = ProgramApproval::findOrFail($approvalId);
        $user = Auth::user();

        $validated = $request->validate([
            'reviewer_notes' => 'nullable|string|max:1000',
        ]);

        $approval->approve(
            $validated['reviewer_notes'] ?? null,
            $user
        );

        // Log audit trail
        AuditLog::log('approve_program', $approval->module, $user, [
            'approval_id' => $approval->id,
            'approved_by' => $user->name,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Program berhasil disetujui',
            'data' => $approval,
        ]);
    }

    /**
     * Reject program
     */
    public function rejectProgram(Request $request, $approvalId)
    {
        $approval = ProgramApproval::findOrFail($approvalId);
        $user = Auth::user();

        $validated = $request->validate([
            'reviewer_notes' => 'required|string|max:1000',
        ]);

        $approval->reject(
            $validated['reviewer_notes'],
            $user
        );

        // Log audit trail
        AuditLog::log('reject_program', $approval->module, $user, [
            'approval_id' => $approval->id,
            'reason' => $validated['reviewer_notes'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Program ditolak',
            'data' => $approval,
        ]);
    }

    /**
     * Get approval history for a program
     */
    public function getApprovalHistory($moduleId)
    {
        $module = Module::findOrFail($moduleId);
        
        $approvals = ProgramApproval::where('module_id', $moduleId)
            ->with('requestedBy', 'reviewedBy')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($approval) {
                return [
                    'id' => $approval->id,
                    'status' => $approval->status,
                    'requested_by' => $approval->requestedBy->name,
                    'reviewed_by' => $approval->reviewedBy?->name,
                    'request_notes' => $approval->request_notes,
                    'reviewer_notes' => $approval->reviewer_notes,
                    'requested_at' => $approval->requested_at?->format('Y-m-d H:i:s'),
                    'reviewed_at' => $approval->reviewed_at?->format('Y-m-d H:i:s'),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $approvals
        ]);
    }

    /**
     * Upload compliance evidence
     */
    public function uploadEvidence(Request $request, $moduleId)
    {
        $module = Module::findOrFail($moduleId);
        $user = Auth::user();

        $validated = $request->validate([
            'evidence_type' => 'required|in:document,screenshot,attestation,assessment',
            'file' => 'required|file|max:10240', // 10MB max
            'description' => 'nullable|string|max:1000',
        ]);

        $filePath = $request->file('file')->store('compliance-evidence/' . $moduleId, 'private');

        $evidence = ComplianceEvidence::create([
            'module_id' => $moduleId,
            'user_id' => $user->id,
            'evidence_type' => $validated['evidence_type'],
            'file_path' => $filePath,
            'description' => $validated['description'] ?? null,
            'status' => 'pending',
        ]);

        // Log audit trail
        AuditLog::log('upload_evidence', $module, $user, [
            'evidence_id' => $evidence->id,
            'evidence_type' => $validated['evidence_type'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bukti kepatuhan berhasil diunggah',
            'data' => $evidence,
        ]);
    }

    /**
     * Verify compliance evidence
     */
    public function verifyEvidence(Request $request, $evidenceId)
    {
        $evidence = ComplianceEvidence::findOrFail($evidenceId);
        $user = Auth::user();

        $validated = $request->validate([
            'verification_notes' => 'nullable|string|max:1000',
        ]);

        $evidence->verify(
            $validated['verification_notes'] ?? null,
            $user
        );

        // Log audit trail
        AuditLog::log('verify_evidence', $evidence->module, $user, [
            'evidence_id' => $evidence->id,
            'status' => 'verified',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bukti kepatuhan berhasil diverifikasi',
            'data' => $evidence,
        ]);
    }

    /**
     * Get compliance evidence for a program
     */
    public function getEvidences($moduleId)
    {
        $module = Module::findOrFail($moduleId);
        
        $evidences = ComplianceEvidence::where('module_id', $moduleId)
            ->with('user', 'verifiedByUser')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($evidence) {
                return [
                    'id' => $evidence->id,
                    'evidence_type' => $evidence->evidence_type,
                    'uploaded_by' => $evidence->user->name,
                    'uploaded_at' => $evidence->created_at?->format('Y-m-d H:i:s'),
                    'status' => $evidence->status,
                    'verified_by' => $evidence->verifiedByUser?->name,
                    'verified_at' => $evidence->verified_at?->format('Y-m-d H:i:s'),
                    'verification_notes' => $evidence->verification_notes,
                    'description' => $evidence->description,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $evidences
        ]);
    }

    /**
     * Get audit log for a program
     */
    public function getAuditLog($moduleId)
    {
        $module = Module::findOrFail($moduleId);
        
        $logs = AuditLog::where('model_type', Module::class)
            ->where('model_id', $moduleId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'performed_by' => $log->user?->name ?? 'System',
                    'performed_at' => $log->created_at?->format('Y-m-d H:i:s'),
                    'changes' => $log->changes,
                    'ip_address' => $log->ip_address,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    /**
     * Generate compliance report
     */
    public function generateComplianceReport($moduleId)
    {
        $module = Module::findOrFail($moduleId);
        
        $currentApproval = ProgramApproval::where('module_id', $moduleId)
            ->latest()
            ->first();
        
        $evidences = ComplianceEvidence::where('module_id', $moduleId)->get();
        $verifiedEvidences = $evidences->where('status', 'verified');
        $auditLogs = AuditLog::where('model_type', Module::class)
            ->where('model_id', $moduleId)
            ->get();

        $report = [
            'generated_at' => now()->format('Y-m-d H:i:s'),
            'program' => [
                'id' => $module->id,
                'title' => $module->title,
                'description' => $module->description,
                'compliance_required' => $module->compliance_required,
            ],
            'approval_status' => [
                'current_status' => $module->approval_status,
                'last_approval' => $currentApproval ? [
                    'status' => $currentApproval->status,
                    'requested_at' => $currentApproval->requested_at?->format('Y-m-d H:i:s'),
                    'reviewed_at' => $currentApproval->reviewed_at?->format('Y-m-d H:i:s'),
                ] : null,
            ],
            'evidence_summary' => [
                'total_evidences' => $evidences->count(),
                'verified_evidences' => $verifiedEvidences->count(),
                'pending_evidences' => $evidences->where('status', 'pending')->count(),
                'rejected_evidences' => $evidences->where('status', 'rejected')->count(),
            ],
            'audit_trail' => [
                'total_actions' => $auditLogs->count(),
                'recent_actions' => $auditLogs->take(10)->pluck('action')->toArray(),
            ],
            'compliance_status' => $this->getComplianceStatus($module),
        ];

        return response()->json([
            'success' => true,
            'data' => $report
        ]);
    }

    private function getComplianceStatus($module)
    {
        if (!$module->compliance_required) {
            return 'Not Required';
        }

        if ($module->approval_status === 'approved') {
            return 'Compliant';
        }

        if ($module->approval_status === 'pending_approval') {
            return 'Pending Review';
        }

        return 'Non-Compliant';
    }
}
