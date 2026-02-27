<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\User;
use App\Models\ProgramApproval;
use App\Models\ComplianceEvidence;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ComplianceController extends Controller
{
    /**
     * Request program approval
     */
    public function requestApproval(Request $request, $moduleId)
    {
        $this->authorize('manage-compliance');
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
        $this->authorize('approve-programs');
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
        $this->authorize('approve-programs');
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
        $this->authorize('view-compliance');
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
        $this->authorize('manage-compliance');
        $module = Module::findOrFail($moduleId);
        $user = Auth::user();

        // Strict file type and MIME validation
        $mimeWhitelist = [
            'document' => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
            'screenshot' => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            'attestation' => ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            'assessment' => ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
        ];

        $extensionMap = [
            'document' => ['pdf', 'doc', 'docx', 'txt'],
            'screenshot' => ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            'attestation' => ['pdf', 'txt', 'doc', 'docx'],
            'assessment' => ['pdf', 'xls', 'xlsx']
        ];

        $validated = $request->validate([
            'evidence_type' => 'required|in:document,screenshot,attestation,assessment',
            'file' => 'required|file|max:10240|mimetypes:' . implode(',', array_merge(...array_values($mimeWhitelist))),
            'description' => 'nullable|string|max:1000',
        ]);

        $file = $request->file('file');
        $evidenceType = $validated['evidence_type'];

        // Double-check file extension is in whitelist
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, $extensionMap[$evidenceType])) {
            return response()->json([
                'success' => false,
                'message' => "Tipe file {$extension} tidak diizinkan untuk bukti {$evidenceType}",
            ], 422);
        }

        // CRITICAL: Validate magic bytes (file content signature) - not just MIME type
        // This prevents bypassing validation by renaming files
        if (!$this->validateFileMagicBytes($file, $evidenceType)) {
            return response()->json([
                'success' => false,
                'message' => "File tidak sesuai dengan tipe yang dinyatakan. Mungkin file yang diubah namanya atau corrupt.",
            ], 422);
        }

        // Double-check MIME type matches evidence type
        $mimeType = $file->getMimeType();
        if (!in_array($mimeType, $mimeWhitelist[$evidenceType])) {
            return response()->json([
                'success' => false,
                'message' => "MIME type {$mimeType} tidak valid untuk bukti {$evidenceType}",
            ], 422);
        }

        // Validate file size for specific types
        $maxSizes = [
            'document' => 5120,      // 5MB
            'screenshot' => 3072,    // 3MB
            'attestation' => 5120,   // 5MB
            'assessment' => 8192     // 8MB
        ];

        $fileSize = $file->getSize();
        $maxSize = ($maxSizes[$evidenceType] ?? 10240) * 1024; // Convert KB to bytes

        if ($fileSize > $maxSize) {
            return response()->json([
                'success' => false,
                'message' => "Ukuran file melebihi batas maksimal {$maxSizes[$evidenceType]}MB untuk tipe {$evidenceType}",
            ], 422);
        }

        // Verify file is actually readable
        if (!$file->isValid()) {
            return response()->json([
                'success' => false,
                'message' => 'File tidak valid atau tidak dapat dibaca',
            ], 422);
        }

        // Check for scan viruses if needed (placeholder for antivirus integration)
        // if ($this->hasVirus($file)) { return error }

        try {
            $filePath = $file->store('compliance-evidence/' . $moduleId, 'private');

            $evidence = ComplianceEvidence::create([
                'module_id' => $moduleId,
                'user_id' => $user->id,
                'evidence_type' => $evidenceType,
                'file_path' => $filePath,
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $fileSize,
                'mime_type' => $mimeType,
                'description' => $validated['description'] ?? null,
                'status' => 'pending',
            ]);

            // Log audit trail with detailed info
            AuditLog::log('upload_evidence', $module, $user, [
                'evidence_id' => $evidence->id,
                'evidence_type' => $evidenceType,
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $fileSize,
                'mime_type' => $mimeType,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Bukti kepatuhan berhasil diunggah',
                'data' => $evidence->load('module', 'user'),
            ]);

        } catch (\Exception $e) {
            \Log::error('ComplianceController::uploadEvidence error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan bukti kepatuhan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify compliance evidence
     */
    public function verifyEvidence(Request $request, $evidenceId)
    {
        $this->authorize('approve-programs');
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
        $this->authorize('view-compliance');
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

    /**
     * Validate file by checking its magic bytes (file content signature)
     * This prevents bypassing security by renaming files
     * 
     * Magic bytes are the first few bytes of a file that identify its type
     * e.g., PDF files always start with %PDF, JPEG with FFD8FF, etc.
     */
    private function validateFileMagicBytes($file, $evidenceType)
    {
        try {
            $filePath = $file->getRealPath();
            if (!file_exists($filePath)) {
                return false;
            }

            // Read first 12 bytes to check magic bytes
            $handle = fopen($filePath, 'rb');
            $bytes = fread($handle, 12);
            fclose($handle);

            if (strlen($bytes) < 2) {
                return false;
            }

            // Magic bytes signatures for each file type
            $magicSignatures = [
                'document' => [
                    'pdf'  => [0x25, 0x50, 0x44, 0x46],  // %PDF
                    'doc'  => [0xD0, 0xCF, 0x11, 0xE0],  // MS Office OLE2
                    'docx' => [0x50, 0x4B, 0x03, 0x04],  // ZIP (Office Open XML)
                    'txt'  => null // TEXT files can start with any ASCII
                ],
                'screenshot' => [
                    'jpg'  => [0xFF, 0xD8, 0xFF],  // JPEG SOI (Start of Image)
                    'jpeg' => [0xFF, 0xD8, 0xFF],  // JPEG SOI
                    'png'  => [0x89, 0x50, 0x4E, 0x47],  // PNG signature
                    'gif'  => [0x47, 0x49, 0x46],  // GIF87a or GIF89a
                    'webp' => [0x52, 0x49, 0x46, 0x46]  // RIFF (WebP container)
                ],
                'attestation' => [
                    'pdf'  => [0x25, 0x50, 0x44, 0x46],  // PDF
                    'txt'  => null,
                    'doc'  => [0xD0, 0xCF, 0x11, 0xE0],  // MS Office OLE2
                    'docx' => [0x50, 0x4B, 0x03, 0x04]   // ZIP
                ],
                'assessment' => [
                    'pdf'  => [0x25, 0x50, 0x44, 0x46],  // PDF
                    'xls'  => [0xD0, 0xCF, 0x11, 0xE0],  // MS Office OLE2
                    'xlsx' => [0x50, 0x4B, 0x03, 0x04]   // ZIP
                ]
            ];

            $extension = strtolower($file->getClientOriginalExtension());
            
            // Get expected magic bytes for this file type
            if (!isset($magicSignatures[$evidenceType][$extension])) {
                return false;
            }

            $expectedSignature = $magicSignatures[$evidenceType][$extension];

            // For text files, we're more lenient - just check it's not binary
            if ($expectedSignature === null) {
                // Text file - check it's mostly readable ASCII
                $nonAscii = 0;
                for ($i = 0; $i < min(100, strlen($bytes)); $i++) {
                    $byte = ord($bytes[$i]);
                    if ($byte < 32 && !in_array($byte, [9, 10, 13])) { // Not printable and not tab/newline/cr
                        $nonAscii++;
                    }
                }
                return $nonAscii < 10; // Allow up to 10 non-ASCII bytes in 100 bytes
            }

            // Compare file bytes with expected signature
            $fileSignature = unpack('C*', substr($bytes, 0, count($expectedSignature)));
            
            for ($i = 0; $i < count($expectedSignature); $i++) {
                if ($fileSignature[$i + 1] !== $expectedSignature[$i]) {
                    return false;
                }
            }

            // Additional check for WebP: verify WEBP format marker
            if ($extension === 'webp' && strlen($bytes) >= 12) {
                // WebP should have 'WEBP' marker at bytes 8-11
                $webpMarker = substr($bytes, 8, 4);
                if ($webpMarker !== 'WEBP') {
                    return false;
                }
            }

            return true;

        } catch (\Exception $e) {
            \Log::error('ComplianceController::validateFileMagicBytes error: ' . $e->getMessage());
            return false;
        }
    }
}
