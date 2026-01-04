<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\TrainingEnrollment;
use App\Models\ExamAttempt;
use App\Models\Certificate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReportController extends Controller
{
    /**
     * Get user's learning reports
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Get trainings with progress
        $trainings = TrainingEnrollment::with(['trainingProgram'])
            ->where('user_id', $user->id)
            ->orderBy('enrolled_at', 'desc')
            ->get()
            ->map(function($enrollment) {
                $training = $enrollment->trainingProgram;
                return [
                    'id' => $training->id,
                    'title' => $training->title,
                    'thumbnail' => $training->thumbnail,
                    'progress' => $enrollment->progress ?? 0,
                    'status' => $enrollment->status,
                    'materials_completed' => $enrollment->materials_completed ?? 0,
                    'total_materials' => $training->modules->sum(fn($m) => $m->materials->count()),
                    'time_spent' => $enrollment->time_spent ?? '0 jam',
                    'enrolled_at' => $enrollment->enrolled_at,
                    'completed_at' => $enrollment->completed_at
                ];
            });
        
        // Get quiz scores
        $quizzes = ExamAttempt::with(['quiz.trainingProgram'])
            ->where('user_id', $user->id)
            ->whereNotNull('submitted_at')
            ->orderBy('submitted_at', 'desc')
            ->get()
            ->map(function($attempt) {
                $quiz = $attempt->quiz;
                return [
                    'id' => $attempt->id,
                    'training_title' => $quiz->trainingProgram->title ?? 'Unknown',
                    'type' => $quiz->type,
                    'score' => $attempt->score,
                    'passing_score' => $quiz->passing_score ?? 70,
                    'is_passed' => $attempt->status === 'passed',
                    'completed_at' => $attempt->submitted_at
                ];
            });
        
        // Get certificates
        $certificates = Certificate::where('user_id', $user->id)
            ->with(['trainingProgram'])
            ->orderBy('issued_at', 'desc')
            ->get()
            ->map(function($cert) {
                return [
                    'id' => $cert->id,
                    'training_title' => $cert->trainingProgram->title ?? 'Unknown',
                    'issued_at' => $cert->issued_at,
                    'certificate_number' => $cert->certificate_number
                ];
            });
        
        // Calculate stats
        $totalTrainings = $trainings->count();
        $completedTrainings = $trainings->where('progress', 100)->count();
        $averageScore = $quizzes->avg('score') ?? 0;
        $totalLearningHours = $this->calculateLearningHours($user->id);
        
        return response()->json([
            'stats' => [
                'total_trainings' => $totalTrainings,
                'completed_trainings' => $completedTrainings,
                'average_score' => round($averageScore),
                'total_certificates' => $certificates->count(),
                'total_learning_hours' => $totalLearningHours . ' jam',
                'points_earned' => $quizzes->sum('score') * 10
            ],
            'trainings' => $trainings,
            'quizzes' => $quizzes,
            'certificates' => $certificates
        ]);
    }
    
    /**
     * Export user's learning report as PDF
     */
    public function export(Request $request)
    {
        $user = Auth::user();
        
        // TODO: Implement PDF export
        // This would use a PDF library like dompdf or mpdf
        
        return response()->json([
            'message' => 'Export feature coming soon',
            'download_url' => null
        ]);
    }
    
    /**
     * Calculate total learning hours
     */
    private function calculateLearningHours($userId)
    {
        // This is a simplified calculation
        // In production, you would track actual time spent
        $enrollments = TrainingEnrollment::where('user_id', $userId)->get();
        
        $totalMinutes = 0;
        foreach ($enrollments as $enrollment) {
            if ($enrollment->completed_at && $enrollment->started_at) {
                $totalMinutes += $enrollment->completed_at->diffInMinutes($enrollment->started_at);
            }
        }
        
        return round($totalMinutes / 60);
    }
}
