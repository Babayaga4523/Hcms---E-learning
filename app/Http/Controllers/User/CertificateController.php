<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\TrainingProgram;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;

class CertificateController extends Controller
{
    /**
     * Get certificate details
     */
    public function show($id)
    {
        $user = Auth::user();
        
        $certificate = Certificate::with(['trainingProgram', 'user'])
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();
        
        $training = $certificate->trainingProgram;
        
        return response()->json([
            'certificate' => [
                'id' => $certificate->id,
                'certificate_number' => $certificate->certificate_number,
                'user_name' => $certificate->user->name,
                'score' => $certificate->final_score,
                'materials_completed' => $certificate->materials_completed,
                'hours' => $certificate->learning_hours,
                'issued_at' => $certificate->issued_at,
                'completed_at' => $certificate->completed_at
            ],
            'training' => [
                'id' => $training->id,
                'title' => $training->title,
                'description' => $training->description,
                'instructor_name' => $training->instructor->name ?? 'Admin LMS'
            ]
        ]);
    }
    
    /**
     * Download certificate as PDF
     */
    public function download($id)
    {
        $user = Auth::user();
        
        $certificate = Certificate::with(['trainingProgram', 'user'])
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();
        
        $training = $certificate->trainingProgram;
        
        $data = [
            'certificate' => $certificate,
            'training' => $training,
            'user' => $user,
            'issued_date' => $certificate->issued_at->format('d F Y'),
            'certificate_number' => $certificate->certificate_number
        ];
        
        $pdf = Pdf::loadView('certificates.template', $data);
        $pdf->setPaper('a4', 'landscape');
        
        return $pdf->download("certificate-{$certificate->certificate_number}.pdf");
    }
}
