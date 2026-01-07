<?php

namespace App\Http\Controllers\Learner;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserTraining;
use App\Models\ModuleProgress;
use App\Models\ExamAttempt;
use App\Models\Certificate;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LearnerReportController extends Controller
{
    /**
     * Display learner reports page with real data
     */
    public function index()
    {
        $userId = Auth::id();
        
        // Get stats
        $stats = $this->getStats($userId);
        
        // Get trainings with progress
        $trainings = $this->getTrainings($userId);
        
        // Get quiz results
        $quizzes = $this->getQuizzes($userId);
        
        // Get certificates
        $certificates = $this->getCertificates($userId);
        
        return Inertia::render('User/Report/MyReports', [
            'stats' => $stats,
            'trainings' => $trainings,
            'quizzes' => $quizzes,
            'certificates' => $certificates,
        ]);
    }

    /**
     * Get user statistics
     */
    private function getStats($userId)
    {
        $trainings = UserTraining::where('user_id', $userId)->get();
        $completedTrainings = $trainings->where('status', 'completed')->count();
        $totalTrainings = $trainings->count();
        
        // Calculate average score from exam attempts
        $examAttempts = ExamAttempt::where('user_id', $userId)
            ->where('is_passed', true)
            ->get();
        $averageScore = $examAttempts->count() > 0 
            ? round($examAttempts->avg('percentage'), 0)
            : 0;
        
        // Count certificates
        $totalCertificates = UserTraining::where('user_id', $userId)
            ->where('is_certified', true)
            ->count();
        
        // Calculate total learning hours from module progress
        $totalMinutes = ModuleProgress::where('user_id', $userId)
            ->whereHas('module')
            ->join('modules', 'module_progress.module_id', '=', 'modules.id')
            ->selectRaw('COALESCE(SUM(modules.duration_minutes * module_progress.progress_percentage / 100), 0) as total')
            ->first()
            ->total ?? 0;
        
        $totalLearningHours = round($totalMinutes / 60, 1);
        
        // Calculate points (simple formula: completed trainings * 100 + certificates * 200 + exams * 50)
        $pointsEarned = ($completedTrainings * 100) + ($totalCertificates * 200) + ($examAttempts->where('is_passed', true)->count() * 50);
        
        return [
            'total_trainings' => $totalTrainings,
            'completed_trainings' => $completedTrainings,
            'average_score' => $averageScore,
            'total_certificates' => $totalCertificates,
            'total_learning_hours' => $totalLearningHours > 0 ? $totalLearningHours . ' jam' : '0 jam',
            'points_earned' => $pointsEarned,
        ];
    }

    /**
     * Get user trainings with progress
     */
    private function getTrainings($userId)
    {
        return UserTraining::where('user_id', $userId)
            ->with('module:id,title,cover_image,duration_minutes')
            ->get()
            ->filter(function ($training) {
                return $training->module !== null;
            })
            ->map(function ($training) use ($userId) {
                $moduleProgress = ModuleProgress::where('user_id', $userId)
                    ->where('module_id', $training->module_id)
                    ->first();
                
                // Count materials
                $totalMaterials = \App\Models\TrainingMaterial::where('module_id', $training->module_id)->count();
                
                // Calculate completed materials (estimate based on progress)
                $progress = $moduleProgress->progress_percentage ?? 0;
                $completedMaterials = $totalMaterials > 0 
                    ? round($progress / 100 * $totalMaterials) 
                    : 0;
                
                // Calculate time spent
                $durationMinutes = $training->module->duration_minutes ?? 0;
                $timeSpentMinutes = round($durationMinutes * ($progress / 100));
                $timeSpent = $timeSpentMinutes >= 60 
                    ? round($timeSpentMinutes / 60, 1) . ' jam'
                    : $timeSpentMinutes . ' menit';
                
                return [
                    'id' => $training->id,
                    'module_id' => $training->module_id,
                    'title' => $training->module->title ?? 'Unknown Training',
                    'thumbnail' => $training->module->cover_image,
                    'progress' => $progress,
                    'status' => $training->status,
                    'materials_completed' => $completedMaterials,
                    'total_materials' => $totalMaterials,
                    'time_spent' => $timeSpent,
                    'enrolled_at' => $training->enrolled_at?->format('Y-m-d'),
                    'completed_at' => $training->completed_at?->format('Y-m-d'),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Get user quiz results
     */
    private function getQuizzes($userId)
    {
        return ExamAttempt::where('user_id', $userId)
            ->with('module:id,title,passing_grade')
            ->orderBy('finished_at', 'desc')
            ->get()
            ->filter(function ($attempt) {
                return $attempt->module !== null;
            })
            ->map(function ($attempt) {
                return [
                    'id' => $attempt->id,
                    'training_title' => $attempt->module->title ?? 'Unknown',
                    'type' => $attempt->exam_type ?? 'posttest',
                    'score' => round($attempt->percentage ?? 0),
                    'passing_score' => $attempt->module->passing_grade ?? 70,
                    'is_passed' => $attempt->is_passed,
                    'completed_at' => $attempt->finished_at?->format('Y-m-d H:i:s'),
                    'total_questions' => $attempt->total_questions ?? 0,
                    'correct_answers' => $attempt->correct_answers ?? 0,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Get user certificates
     */
    private function getCertificates($userId)
    {
        return UserTraining::where('user_id', $userId)
            ->where('is_certified', true)
            ->with('module:id,title')
            ->orderBy('completed_at', 'desc')
            ->get()
            ->filter(function ($training) {
                return $training->module !== null;
            })
            ->map(function ($training) {
                return [
                    'id' => $training->certificate_id ?? $training->id,
                    'training_id' => $training->id,
                    'training_title' => $training->module->title ?? 'Unknown',
                    'issued_at' => $training->completed_at?->format('Y-m-d'),
                    'score' => $training->final_score,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * API endpoint for reports data
     */
    public function getReportsData()
    {
        $userId = Auth::id();
        
        return response()->json([
            'stats' => $this->getStats($userId),
            'trainings' => $this->getTrainings($userId),
            'quizzes' => $this->getQuizzes($userId),
            'certificates' => $this->getCertificates($userId),
        ]);
    }

    /**
     * Export report as PDF
     */
    public function exportPdf()
    {
        $userId = Auth::id();
        $user = User::findOrFail($userId);
        
        $data = [
            'user' => $user,
            'stats' => $this->getStats($userId),
            'trainings' => $this->getTrainings($userId),
            'quizzes' => $this->getQuizzes($userId),
            'certificates' => $this->getCertificates($userId),
            'generated_at' => now()->format('d F Y H:i'),
        ];
        
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.learning-report', $data);
        $pdf->setPaper('A4', 'portrait');
        
        $filename = 'Laporan_Pembelajaran_' . str_replace(' ', '_', $user->name) . '_' . now()->format('Y-m-d') . '.pdf';
        
        return $pdf->download($filename);
    }
}
