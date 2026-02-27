<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\Question;
use App\Models\User;
use Illuminate\Http\Request;

class ReportingAnalyticsController extends Controller
{
    /**
     * Get learning effectiveness score
     */
    public function getLearningEffectiveness($moduleId = null)
    {
        $this->authorize('view-reports');
        $query = Module::query();
        
        if ($moduleId) {
            $query->where('id', $moduleId);
        }

        $data = $query->get()->map(function ($module) {
            $totalEnrolled = $module->users()->count();
            $completed = $module->users()->where('pivot_status', 'completed')->count();
            $averageScore = $module->users()
                ->wherePivot('final_score', '!=', null)
                ->avg('pivot_final_score') ?? 0;
            
            // Learning Effectiveness Score = (Completion Rate + Average Score) / 2
            $completionRate = $totalEnrolled > 0 ? ($completed / $totalEnrolled) * 100 : 0;
            $effectivenessScore = ($completionRate + $averageScore) / 2;

            return [
                'program_id' => $module->id,
                'program_title' => $module->title,
                'total_enrolled' => $totalEnrolled,
                'completed' => $completed,
                'completion_rate' => round($completionRate, 2),
                'average_score' => round($averageScore, 2),
                'effectiveness_score' => round($effectivenessScore, 2),
                'rating' => $this->getEffectivenessRating($effectivenessScore),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $moduleId ? $data->first() : $data->values()
        ]);
    }

    /**
     * Get question difficulty analysis
     */
    public function getQuestionAnalysis($moduleId)
    {
        $module = Module::findOrFail($moduleId);
        
        $questions = $module->questions()
            ->withCount('userAnswers')
            ->with('userAnswers')
            ->get()
            ->map(function ($question) {
                $totalAnswers = $question->user_answers_count;
                $correctAnswers = $question->userAnswers()
                    ->where('is_correct', true)
                    ->count();
                
                $correctPercentage = $totalAnswers > 0 
                    ? round(($correctAnswers / $totalAnswers) * 100, 2) 
                    : 0;

                return [
                    'question_id' => $question->id,
                    'question_text' => substr($question->question_text, 0, 100),
                    'type' => $question->question_type ?? 'unknown',
                    'difficulty' => $question->difficulty ?? 'medium',
                    'total_attempts' => $totalAnswers,
                    'correct_answers' => $correctAnswers,
                    'correct_percentage' => $correctPercentage,
                    'difficulty_level' => $this->getDifficultyLevel($correctPercentage),
                ];
            })
            ->sortBy('correct_percentage');

        $averageDifficulty = $questions->avg('correct_percentage');

        return response()->json([
            'success' => true,
            'data' => [
                'program_id' => $moduleId,
                'program_title' => $module->title,
                'total_questions' => $questions->count(),
                'average_difficulty_percentage' => round($averageDifficulty, 2),
                'questions' => $questions->values(),
            ]
        ]);
    }

    /**
     * Get time spent analysis per module
     */
    public function getTimeSpentAnalysis($moduleId)
    {
        $module = Module::findOrFail($moduleId);
        
        $learnerTimeData = $module->users()
            ->with('moduleProgress')
            ->get()
            ->map(function ($user) use ($module) {
                // This assumes you have time tracking in module_progress
                $progress = $user->moduleProgress()
                    ->where('module_id', $module->id)
                    ->first();
                
                $timeSpent = $progress?->time_spent ?? 0;

                return [
                    'learner_id' => $user->id,
                    'learner_name' => $user->name,
                    'email' => $user->email,
                    'time_spent_minutes' => $timeSpent,
                    'time_spent_hours' => round($timeSpent / 60, 2),
                ];
            });

        $averageTimeSpent = $learnerTimeData->avg('time_spent_minutes');

        return response()->json([
            'success' => true,
            'data' => [
                'program_id' => $moduleId,
                'program_title' => $module->title,
                'average_time_spent_minutes' => round($averageTimeSpent, 2),
                'average_time_spent_hours' => round($averageTimeSpent / 60, 2),
                'learner_breakdown' => $learnerTimeData->values(),
            ]
        ]);
    }

    /**
     * Generate comprehensive program report
     */
    public function generateProgramReport($moduleId)
    {
        $module = Module::findOrFail($moduleId);
        
        $metrics = $this->getLearningEffectiveness($moduleId)->getData()->data;
        $questionAnalysis = $this->getQuestionAnalysis($moduleId)->getData()->data;

        $report = [
            'generated_at' => now()->format('Y-m-d H:i:s'),
            'program' => [
                'id' => $module->id,
                'title' => $module->title,
                'description' => $module->description,
                'duration' => $module->duration ?? 'N/A',
                'passing_grade' => $module->passing_grade,
                'start_date' => $module->start_date,
                'end_date' => $module->end_date,
            ],
            'enrollment_metrics' => [
                'total_enrolled' => $metrics->total_enrolled,
                'completed' => $metrics->completed,
                'completion_rate' => $metrics->completion_rate . '%',
                'average_score' => $metrics->average_score,
            ],
            'effectiveness' => [
                'effectiveness_score' => $metrics->effectiveness_score,
                'rating' => $metrics->rating,
            ],
            'question_analysis' => [
                'total_questions' => $questionAnalysis->total_questions,
                'average_difficulty_percentage' => $questionAnalysis->average_difficulty_percentage . '%',
                'difficulty_distribution' => $this->getQuestionDifficultyDistribution($questionAnalysis->questions),
            ],
            'learner_summary' => [
                'high_performers' => $this->getHighPerformers($module),
                'at_risk_learners' => $this->getAtRiskLearners($module),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $report
        ]);
    }

    /**
     * Export report to PDF
     * Note: Requires barryvdh/laravel-dompdf package
     */
    public function exportReportPDF($moduleId)
    {
        $reportData = $this->generateProgramReport($moduleId)->getData()->data;
        
        // Check if PDF package is installed
        if (!class_exists('Barryvdh\DomPDF\PDF')) {
            return response()->json([
                'success' => false,
                'message' => 'PDF export requires barryvdh/laravel-dompdf package. Run: composer require barryvdh/laravel-dompdf'
            ], 400);
        }

        // Using Laravel's PDF capabilities with barryvdh/laravel-dompdf
        $pdf = app('dompdf.wrapper')->loadView('reports.program-report', ['report' => $reportData])
            ->setPaper('a4')
            ->setOrientation('portrait');

        return $pdf->download('report-' . $reportData['program']['title'] . '-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Export report to Excel
     */
    public function exportReportExcel($moduleId)
    {
        $reportData = $this->generateProgramReport($moduleId)->getData()->data;
        
        $filename = 'report-' . $reportData['program']['title'] . '-' . now()->format('Y-m-d') . '.csv';
        
        $callback = function() use ($reportData) {
            $file = fopen('php://output', 'w');
            
            // Program Info
            fputcsv($file, ['PROGRAM REPORT']);
            fputcsv($file, ['Title', $reportData['program']['title']]);
            fputcsv($file, ['Description', $reportData['program']['description']]);
            fputcsv($file, ['Duration', $reportData['program']['duration']]);
            fputcsv($file, ['Passing Grade', $reportData['program']['passing_grade']]);
            fputcsv($file, []);
            
            // Enrollment Metrics
            fputcsv($file, ['ENROLLMENT METRICS']);
            fputcsv($file, ['Total Enrolled', $reportData['enrollment_metrics']['total_enrolled']]);
            fputcsv($file, ['Completed', $reportData['enrollment_metrics']['completed']]);
            fputcsv($file, ['Completion Rate', $reportData['enrollment_metrics']['completion_rate']]);
            fputcsv($file, ['Average Score', $reportData['enrollment_metrics']['average_score']]);
            fputcsv($file, []);
            
            // Effectiveness
            fputcsv($file, ['LEARNING EFFECTIVENESS']);
            fputcsv($file, ['Score', $reportData['effectiveness']['effectiveness_score']]);
            fputcsv($file, ['Rating', $reportData['effectiveness']['rating']]);
            fputcsv($file, []);
            
            // Question Analysis
            fputcsv($file, ['QUESTION ANALYSIS']);
            fputcsv($file, ['Total Questions', $reportData['question_analysis']['total_questions']]);
            fputcsv($file, ['Average Difficulty', $reportData['question_analysis']['average_difficulty_percentage']]);
            
            fclose($file);
        };

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    // Helper methods
    private function getEffectivenessRating($score)
    {
        if ($score >= 80) return 'Excellent';
        if ($score >= 60) return 'Good';
        if ($score >= 40) return 'Fair';
        return 'Poor';
    }

    private function getDifficultyLevel($correctPercentage)
    {
        if ($correctPercentage >= 80) return 'Mudah';
        if ($correctPercentage >= 60) return 'Sedang';
        return 'Sulit';
    }

    private function getQuestionDifficultyDistribution($questions)
    {
        // Convert to collection if it's an array
        if (is_array($questions)) {
            $questions = collect($questions);
        }
        
        return [
            'mudah' => $questions->where('difficulty_level', 'Mudah')->count(),
            'sedang' => $questions->where('difficulty_level', 'Sedang')->count(),
            'sulit' => $questions->where('difficulty_level', 'Sulit')->count(),
        ];
    }

    private function getHighPerformers($module)
    {
        return $module->users()
            ->where('pivot_final_score', '>=', $module->passing_grade)
            ->where('pivot_status', 'completed')
            ->orderBy('pivot_final_score', 'desc')
            ->limit(5)
            ->get(['name', 'email'])
            ->map(fn($user) => [
                'name' => $user->name,
                'email' => $user->email,
            ]);
    }

    private function getAtRiskLearners($module)
    {
        return $module->users()
            ->where('pivot_status', 'in_progress')
            ->where('pivot_final_score', '<', $module->passing_grade)
            ->limit(5)
            ->get(['name', 'email'])
            ->map(fn($user) => [
                'name' => $user->name,
                'email' => $user->email,
            ]);
    }
}
