<?php

namespace App\Http\Controllers\Api;

use App\Models\Certificate;
use App\Models\User;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

/**
 * Certificate API Controller
 * Provides certificate management including bulk revocation
 */
class CertificateController
{
    /**
     * Bulk revoke certificates with transaction safety
     * POST /api/admin/certificates/bulk-revoke
     */
    public function bulkRevoke(Request $request)
    {
        try {
            $validated = $request->validate([
                'user_ids' => 'required_without:criteria|array|min:1',
                'user_ids.*' => 'integer|exists:users,id',
                'criteria' => 'required_without:user_ids|array',
                'criteria.department' => 'sometimes|string',
                'criteria.date_from' => 'sometimes|date',
                'criteria.date_to' => 'sometimes|date',
                'criteria.status' => 'sometimes|string|in:active,revoked,expired',
                'reason' => 'required|string|max:500',
                'notify_users' => 'boolean',
            ]);

            return DB::transaction(function () use ($validated, $request) {
                $userIds = $validated['user_ids'] ?? [];

                // If criteria-based selection
                if (!empty($validated['criteria']) && empty($userIds)) {
                    $userIds = $this->getUserIdsByCriteria($validated['criteria']);
                }

                if (empty($userIds)) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'No users matched the provided criteria',
                    ], 400);
                }

                $certificates = Certificate::whereIn('user_id', $userIds)
                    ->where('status', '!=', 'revoked')
                    ->lockForUpdate()
                    ->get();

                $revoked_count = 0;

                foreach ($certificates as $certificate) {
                    $certificate->update([
                        'status' => 'revoked',
                        'revoked_at' => now(),
                        'revocation_reason' => $validated['reason'],
                    ]);

                    $this->logRevocation($certificate, $validated['reason']);

                    if ($validated['notify_users'] ?? false) {
                        try {
                            $this->notifyUserOfRevocation($certificate);
                        } catch (\Exception $e) {
                            \Log::warning('Failed to notify user of revocation', [
                                'user_id' => $certificate->user_id,
                                'error' => $e->getMessage()
                            ]);
                        }
                    }

                    $revoked_count++;
                }

                return response()->json([
                    'status' => 'success',
                    'message' => "Successfully revoked {$revoked_count} certificates",
                    'data' => [
                        'total_processed' => count($userIds),
                        'revoked_count' => $revoked_count,
                        'reason' => $validated['reason'],
                        'revoked_at' => now(),
                    ],
                ]);
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to revoke certificates',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get user IDs based on criteria
     */
    private function getUserIdsByCriteria($criteria)
    {
        $query = User::where('role', '!=', 'admin');

        if (!empty($criteria['department'])) {
            $query->where('department', $criteria['department']);
        }

        if (!empty($criteria['date_from'])) {
            $query->where('created_at', '>=', Carbon::parse($criteria['date_from'])->startOfDay());
        }

        if (!empty($criteria['date_to'])) {
            $query->where('created_at', '<=', Carbon::parse($criteria['date_to'])->endOfDay());
        }

        return $query->pluck('id')->toArray();
    }

    /**
     * Log certificate revocation
     */
    private function logRevocation(Certificate $certificate, $reason)
    {
        // Log to audit trail if available
        try {
            $userId = Auth::user()?->id;
            \App\Models\AuditLog::create([
                'auditable_type' => Certificate::class,
                'auditable_id' => $certificate->id,
                'event' => 'revoked',
                'user_id' => $userId,
                'new_values' => [
                    'status' => 'revoked',
                    'reason' => $reason,
                    'revoked_at' => now(),
                ],
            ]);
        } catch (\Exception $e) {
            // Log may not be available
        }
    }

    /**
     * Notify user of certificate revocation
     */
    private function notifyUserOfRevocation(Certificate $certificate)
    {
        try {
            $user = User::find($certificate->user_id);
            if ($user) {
                // Send notification - implementation depends on notification system
                \Illuminate\Support\Facades\Notification::send($user, new \App\Notifications\CertificateRevokedNotification($certificate));
            }
        } catch (\Exception $e) {
            // Notification failed but revocation succeeded
        }
    }

    /**
     * Get certificate statistics
     * GET /api/admin/certificates/statistics
     */
    public function statistics()
    {
        try {
            $stats = [
                'total_certificates' => Certificate::count(),
                'active_certificates' => Certificate::where('status', 'active')->count(),
                'revoked_certificates' => Certificate::where('status', 'revoked')->count(),
                'expired_certificates' => Certificate::where('status', 'expired')
                    ->orWhere('expiry_date', '<', now())
                    ->count(),
                'certificates_by_program' => $this->getCertificatesByProgram(),
                'revocation_reasons' => $this->getRevocationReasons(),
                'certificates_issued_this_month' => Certificate::where('created_at', '>=', now()->startOfMonth())
                    ->count(),
                'certificates_expiring_soon' => Certificate::where('expiry_date', '<=', now()->addDays(30))
                    ->where('expiry_date', '>', now())
                    ->where('status', '!=', 'revoked')
                    ->count(),
            ];

            return response()->json([
                'status' => 'success',
                'data' => $stats,
                'timestamp' => now(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch certificate statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get certificates grouped by program
     */
    private function getCertificatesByProgram()
    {
        return Certificate::select('module_id', DB::raw('count(*) as count'))
            ->with('module:id,title')
            ->groupBy('module_id')
            ->get()
            ->map(function ($cert) {
                return [
                    'module_id' => $cert->module_id,
                    'module_title' => $cert->module->title ?? 'Unknown',
                    'count' => $cert->count,
                ];
            });
    }

    /**
     * Get revocation reasons
     */
    private function getRevocationReasons()
    {
        return Certificate::where('status', 'revoked')
            ->select('revocation_reason', DB::raw('count(*) as count'))
            ->groupBy('revocation_reason')
            ->get()
            ->map(function ($item) {
                return [
                    'reason' => $item->revocation_reason ?? 'No reason provided',
                    'count' => $item->count,
                ];
            });
    }

    /**
     * Get certificate details
     * GET /api/admin/certificates/{id}
     */
    public function show($id)
    {
        try {
            $certificate = Certificate::with(['user:id,name,email,department', 'module:id,title'])
                ->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'data' => $certificate,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Certificate not found',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Get user certificates
     * GET /api/admin/certificates/user/{userId}
     */
    public function userCertificates($userId)
    {
        try {
            $user = User::findOrFail($userId);
            $certificates = Certificate::where('user_id', $userId)
                ->with('module:id,title')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'department' => $user->department,
                ],
                'data' => $certificates,
                'summary' => [
                    'total' => $certificates->count(),
                    'active' => $certificates->where('status', 'active')->count(),
                    'revoked' => $certificates->where('status', 'revoked')->count(),
                    'expired' => $certificates->where('status', 'expired')->count(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch user certificates',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Revoke single certificate
     * POST /api/admin/certificates/{id}/revoke
     */
    public function revoke($id, Request $request)
    {
        try {
            $validated = $request->validate([
                'reason' => 'required|string|max:500',
                'notify_user' => 'boolean',
            ]);

            $certificate = Certificate::findOrFail($id);

            if ($certificate->status === 'revoked') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Certificate is already revoked',
                ], 400);
            }

            $certificate->update([
                'status' => 'revoked',
                'revoked_at' => now(),
                'revocation_reason' => $validated['reason'],
            ]);

            $this->logRevocation($certificate, $validated['reason']);

            if ($validated['notify_user'] ?? false) {
                $this->notifyUserOfRevocation($certificate);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Certificate revoked successfully',
                'data' => $certificate,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to revoke certificate',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get certificates expiring soon
     * GET /api/admin/certificates/expiring-soon
     */
    public function expiringSoon(Request $request)
    {
        try {
            $days = $request->input('days', 30);

            $certificates = Certificate::where('expiry_date', '<=', now()->addDays($days))
                ->where('expiry_date', '>', now())
                ->where('status', '!=', 'revoked')
                ->with(['user:id,name,email', 'module:id,title'])
                ->orderBy('expiry_date', 'asc')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $certificates,
                'summary' => [
                    'days_window' => $days,
                    'total_expiring' => $certificates->count(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch expiring certificates',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
