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
    public function showPage($trainingId)
    {
        $user = Auth::user();
        
        // Get or create certificate
        $certificate = Certificate::where('user_id', $user->id)
            ->where('module_id', $trainingId)
            ->first();
        
        // If no certificate exists, try to create one
        if (!$certificate) {
            // Check if user has completed the training
            $enrollment = UserTraining::where('user_id', $user->id)
                ->where('module_id', $trainingId)
                ->where('status', 'completed')
                ->first();
            
            if ($enrollment) {
                $certificate = Certificate::createForUser($user->id, $trainingId);
            }
        }
        
        $training = Module::find($trainingId);
        
        return Inertia::render('User/Training/Certificate', [
            'trainingId' => $trainingId,
            'training' => $training ? [
                'id' => $training->id,
                'title' => $training->title,
                'description' => $training->description,
                'instructor_name' => $certificate?->instructor_name ?? 'Admin LMS',
                'duration_minutes' => $training->duration_minutes,
                'materials_count' => $certificate?->materials_completed ?? 3,
            ] : null,
            'certificate' => $certificate ? [
                'id' => $certificate->id,
                'certificate_number' => $certificate->certificate_number,
                'user_name' => $certificate->user_name,
                'score' => $certificate->score,
                'materials_completed' => $certificate->materials_completed,
                'hours' => $certificate->hours,
                'issued_at' => $certificate->issued_at?->toISOString(),
                'completed_at' => $certificate->completed_at?->toISOString(),
                'instructor_name' => $certificate->instructor_name,
                'status' => $certificate->status,
            ] : null,
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
            
            // If still not found, try to create one
            if (!$certificate) {
                $enrollment = UserTraining::where('user_id', $user->id)
                    ->where('module_id', $id)
                    ->where('status', 'completed')
                    ->first();
                
                if ($enrollment) {
                    $certificate = Certificate::createForUser($user->id, $id);
                }
            }
            
            if (!$certificate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sertifikat belum tersedia. Selesaikan training terlebih dahulu.',
                    'certificate' => null,
                    'training' => null
                ], 404);
            }
            
            $training = Module::find($certificate->module_id);
            
            return response()->json([
                'success' => true,
                'certificate' => [
                    'id' => $certificate->id,
                    'certificate_number' => $certificate->certificate_number,
                    'user_name' => $certificate->user_name,
                    'score' => $certificate->score,
                    'materials_completed' => $certificate->materials_completed,
                    'hours' => $certificate->hours,
                    'issued_at' => $certificate->issued_at?->toISOString(),
                    'completed_at' => $certificate->completed_at?->toISOString(),
                    'instructor_name' => $certificate->instructor_name,
                    'status' => $certificate->status,
                ],
                'training' => $training ? [
                    'id' => $training->id,
                    'title' => $training->title,
                    'description' => $training->description,
                    'instructor_name' => $certificate->instructor_name
                ] : null
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
    public function download($id)
    {
        try {
            $user = Auth::user();
            
            // Find certificate
            $certificate = Certificate::find($id);
            if (!$certificate) {
                $certificate = Certificate::where('user_id', $user->id)
                    ->where('module_id', $id)
                    ->first();
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
            
            // Generate PDF
            $pdf = Pdf::loadView('exports.certificate-template', $data);
            $pdf->setPaper('a4', 'landscape');
            
            return $pdf->download("certificate-{$certificate->certificate_number}.pdf");
        } catch (\Exception $e) {
            Log::error('Failed to download certificate: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengunduh sertifikat'
            ], 500);
        }
    }
}
