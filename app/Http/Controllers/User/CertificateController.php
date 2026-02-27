<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Module;
use App\Models\UserTraining;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;

class CertificateController extends Controller
{
    /**
     * Show certificate page (Inertia)
     */
    private function checkCertificateEligibility($user, $moduleId)
    {
        $result = [
            'eligible' => false,
            'requirements' => [
                'materials_total' => 0,
                'materials_completed' => 0,
                'pretest_required' => false,
                'pretest_passed' => false,
                'posttest_required' => false,
                'posttest_passed' => false,
            ]
        ];

        $module = Module::with(['trainingMaterials', 'questions'])->find($moduleId);
        if (!$module) return $result;

        // Build material ids list to include legacy module-level assets
        $materialIds = [];
        $nextId = 1;
        if ($module->video_url) $materialIds[] = $nextId++;
        if ($module->document_url) $materialIds[] = $nextId++;
        if ($module->presentation_url) $materialIds[] = $nextId++;

        $trainingIds = $module->trainingMaterials->pluck('id')->toArray();
        $materialIds = array_merge($materialIds, $trainingIds);

        // Materials
        $materialsTotal = count($materialIds);
        $completedMaterials = \App\Models\UserMaterialProgress::where('user_id', $user->id)
            ->whereIn('training_material_id', $materialIds)
            ->where('is_completed', true)
            ->count();

        $result['requirements']['materials_total'] = $materialsTotal;
        $result['requirements']['materials_completed'] = $completedMaterials;

        // Pretest & Posttest presence
        $pretestCount = $module->questions->where('question_type', 'pretest')->count();
        $posttestCount = $module->questions->where('question_type', 'posttest')->count();

        $result['requirements']['pretest_required'] = $pretestCount > 0;
        $result['requirements']['posttest_required'] = $posttestCount > 0;

        // Exam attempts
        if ($pretestCount > 0) {
            $prePassed = \App\Models\ExamAttempt::where('user_id', $user->id)
                ->where('module_id', $moduleId)
                ->where('exam_type', 'pre_test')
                ->where('is_passed', true)
                ->exists();
            $result['requirements']['pretest_passed'] = $prePassed;
        } else {
            $result['requirements']['pretest_passed'] = true; // not required
        }

        if ($posttestCount > 0) {
            $postPassed = \App\Models\ExamAttempt::where('user_id', $user->id)
                ->where('module_id', $moduleId)
                ->where('exam_type', 'post_test')
                ->where('is_passed', true)
                ->exists();
            $result['requirements']['posttest_passed'] = $postPassed;
        } else {
            $result['requirements']['posttest_passed'] = true; // not required
        }

        // Eligible if materials completed AND tests passed
        $allMaterialsDone = $materialsTotal === $completedMaterials;
        $allTestsPassed = $result['requirements']['pretest_passed'] && $result['requirements']['posttest_passed'];

        $result['eligible'] = $allMaterialsDone && $allTestsPassed;

        return $result;
    }

    public function showPage($trainingId)
    {
        $user = Auth::user();

        // Check eligibility first
        $eligibility = $this->checkCertificateEligibility($user, $trainingId);

        // Get or create certificate only if eligible
        $certificate = Certificate::where('user_id', $user->id)
            ->where('module_id', $trainingId)
            ->first();

        if (!$certificate && $eligibility['eligible']) {
            $certificate = Certificate::createForUser($user->id, $trainingId);
        }

        $training = Module::with(['trainingMaterials', 'instructor'])->find($trainingId);

        // Re-fetch certificate to include freshly created record if applicable
        if ($certificate) {
            $certificate = Certificate::find($certificate->id);
        }

        // Prepare training payload from DB (no frontend-only fallbacks)
        $trainingPayload = null;
        if ($training) {
            $trainingPayload = [
                'id' => $training->id,
                'title' => $training->title,
                'description' => $training->description,
                'instructor_name' => $training->instructor?->name ?? ($certificate?->instructor_name ?? 'Admin LMS'),
                'duration_minutes' => $training->duration_minutes,
                'materials_count' => $training->trainingMaterials->count(),
            ];
        }

        // Certificate payload mirrors DB record exactly
        $certificatePayload = null;
        if ($certificate) {
            $certificatePayload = [
                'id' => $certificate->id,
                'certificate_number' => $certificate->certificate_number,
                'user_name' => $certificate->user_name,
                'training_title' => $certificate->training_title,
                'score' => $certificate->score,
                'materials_completed' => $certificate->materials_completed,
                'hours' => $certificate->hours,
                'issued_at' => $certificate->issued_at?->toISOString(),
                'completed_at' => $certificate->completed_at?->toISOString(),
                'instructor_name' => $certificate->instructor_name,
                'status' => $certificate->status,
                'metadata' => $certificate->metadata ?? [],
            ];
        }

        // Eligibility and requirements
        $eligibility = $this->checkCertificateEligibility($user, $trainingId);

        return Inertia::render('User/Training/Certificate', [
            'trainingId' => $trainingId,
            'training' => $trainingPayload,
            'certificate' => $certificatePayload,
            'eligible' => $eligibility['eligible'],
            'requirements' => $eligibility['requirements'],
        ]);
    }    
    /**
     * Get certificate details (API)
     */
    public function show($id)
    {
        try {
            $user = Auth::user();
            
            // Try to find certificate by ID first
            $certificate = Certificate::find($id);
            
            // If not found by ID, try to find by training/module ID
            if (!$certificate) {
                $certificate = Certificate::where('user_id', $user->id)
                    ->where('module_id', $id)
                    ->first();
            }
            
            // Determine module id for eligibility check
            $moduleId = $certificate ? $certificate->module_id : $id;

            // If still not found, try to create one (if eligible)
            $eligibility = $this->checkCertificateEligibility($user, $moduleId);

            if ($eligibility['eligible'] && !$certificate) {
                $certificate = Certificate::createForUser($user->id, $moduleId);
            }

            if (!$certificate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sertifikat belum tersedia. Lengkapi semua materi dan ujian yang diperlukan.',
                    'certificate' => null,
                    'training' => null,
                    'eligible' => $eligibility['eligible'],
                    'requirements' => $eligibility['requirements']
                ], 404);
            }
            
            $training = Module::find($certificate->module_id);
            
            // Attach eligibility to the API response
            $eligibility = $this->checkCertificateEligibility($user, $certificate->module_id ?? $id);

            return response()->json([
                'success' => true,
                'certificate' => [
                    'id' => $certificate->id,
                    'certificate_number' => $certificate->certificate_number,
                    'user_name' => $certificate->user_name,
                    'training_title' => $certificate->training_title,
                    'score' => $certificate->score,
                    'materials_completed' => $certificate->materials_completed,
                    'hours' => $certificate->hours,
                    'issued_at' => $certificate->issued_at?->toISOString(),
                    'completed_at' => $certificate->completed_at?->toISOString(),
                    'instructor_name' => $certificate->instructor_name,
                    'status' => $certificate->status,
                    'metadata' => $certificate->metadata ?? [],
                ],
                'training' => $training ? [
                    'id' => $training->id,
                    'title' => $training->title,
                    'description' => $training->description,
                    'instructor_name' => $certificate->instructor_name
                ] : null,
                'eligible' => $eligibility['eligible'],
                'requirements' => $eligibility['requirements']
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load certificate: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Sertifikat tidak ditemukan',
                'certificate' => null,
                'training' => null
            ], 404);
        }
    }
    
    /**
     * Download certificate as PDF
     */
    public function debugEligibility(\Illuminate\Http\Request $request)
    {
        // Only allow in non-production for safety
        if (!app()->environment('local') && !config('app.debug')) {
            return response()->json(['error' => 'Not available'], 403);
        }

        $user = Auth::user();
        $userId = $request->query('user_id') ? (int)$request->query('user_id') : $user->id;
        $moduleId = (int)$request->query('module_id');

        if (!$moduleId) {
            return response()->json(['error' => 'module_id is required'], 400);
        }

        $userObj = \App\Models\User::find($userId);
        if (!$userObj) return response()->json(['error' => 'user not found'], 404);

        $elig = $this->checkCertificateEligibility($userObj, $moduleId);

        // Build list of materials (ids and titles)
        $module = Module::with('trainingMaterials')->find($moduleId);
        $legacy = [];
        $nextId = 1;
        if ($module) {
            if ($module->video_url) { $legacy[] = ['id' => $nextId++, 'title' => 'Video']; }
            if ($module->document_url) { $legacy[] = ['id' => $nextId++, 'title' => 'Document']; }
            if ($module->presentation_url) { $legacy[] = ['id' => $nextId++, 'title' => 'Presentation']; }
        }
        $trainingMaterials = $module ? $module->trainingMaterials->map(fn($m) => ['id' => $m->id, 'title' => $m->title])->values()->all() : [];

        // Completed material ids
        $expectedIds = array_merge(array_column($legacy, 'id'), array_column($trainingMaterials, 'id'));
        $completed = \App\Models\UserMaterialProgress::where('user_id', $userId)
            ->whereIn('training_material_id', $expectedIds)
            ->where('is_completed', true)
            ->pluck('training_material_id')
            ->toArray();

        // Exam attempts
        $pre = \App\Models\ExamAttempt::where('user_id', $userId)->where('module_id', $moduleId)->where('exam_type', 'pre_test')->orderBy('created_at', 'desc')->get();
        $post = \App\Models\ExamAttempt::where('user_id', $userId)->where('module_id', $moduleId)->where('exam_type', 'post_test')->orderBy('created_at', 'desc')->get();

        $userTraining = \App\Models\UserTraining::where('user_id', $userId)->where('module_id', $moduleId)->first();

        return response()->json([
            'user_id' => $userId,
            'module_id' => $moduleId,
            'eligible' => $elig['eligible'],
            'requirements' => $elig['requirements'],
            'expected_materials' => $expectedIds,
            'completed_materials' => $completed,
            'training_materials' => $trainingMaterials,
            'legacy_materials' => $legacy,
            'pretest_attempts' => $pre,
            'posttest_attempts' => $post,
            'user_training' => $userTraining
        ]);
    }

    public function download($id)
    {
        try {
            $user = Auth::user();
            
            // Find certificate by id (may be certificate id) or by module id
            $certificate = Certificate::find($id);
            if (!$certificate) {
                $certificate = Certificate::where('user_id', $user->id)
                    ->where('module_id', $id)
                    ->first();
            }

            // Determine the module id to check eligibility against
            $moduleId = $certificate ? $certificate->module_id : $id;

            // Enforce eligibility before download
            $eligibility = $this->checkCertificateEligibility($user, $moduleId);
            if (!$eligibility['eligible']) {
                // Log detailed info for debugging
                Log::warning('Certificate download blocked - user not eligible', [
                    'user_id' => $user->id,
                    'request_param' => $id,
                    'module_id' => $moduleId,
                    'requirements' => $eligibility['requirements']
                ]);

                return response()->json([
                    'error' => 'Sertifikat belum tersedia. Lengkapi semua materi dan ujian yang diperlukan.',
                    'eligible' => false,
                    'requirements' => $eligibility['requirements']
                ], 403);
            }

            if (!$certificate) {
                return response()->json(['error' => 'Certificate not found'], 404);
            }
            
            $training = Module::find($certificate->module_id);
            
            $data = [
                'user' => $user,
                'training' => $training,
                'certificate' => $certificate,
                'certificate_number' => $certificate->certificate_number,
                'issued_date' => $certificate->issued_at?->format('d F Y') ?? now()->format('d F Y'),
                'score' => $certificate->score
            ];
            
            // Render the certificate HTML first and save it to logs for debugging
            $html = view('exports.certificate-template', $data)->render();
            $ts = now()->format('YmdHis');
            $logPath = storage_path("logs/certificate-{$certificate->id}-{$ts}.html");
            file_put_contents($logPath, $html);
            Log::debug('Certificate HTML saved for debug', ['path' => $logPath, 'certificate_id' => $certificate->id]);

            // Generate PDF from HTML (catch DomPDF errors separately)
            try {
                $pdf = Pdf::loadHTML($html);
                $pdf->setPaper('a4', 'landscape');

                return $pdf->download("certificate-{$certificate->certificate_number}.pdf");
            } catch (\Exception $e) {
                Log::error('DomPDF failed to generate PDF: ' . $e->getMessage() . "\n" . $e->getTraceAsString(), ['certificate_id' => $certificate->id]);

                return response()->json([
                    'success' => false,
                    'message' => 'Gagal membuat PDF sertifikat'
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Failed to download certificate: ' . $e->getMessage() . "\n" . $e->getTraceAsString(), ['exception' => $e]);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengunduh sertifikat'
            ], 500);
        }
    }
}
