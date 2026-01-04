<?php

namespace App\Http\Controllers\Admin;

use App\Models\Module;
use App\Models\User;
use App\Models\ProgramEnrollmentMetric;
use Illuminate\Http\Request;

class DashboardMetricsController
{
    /**
     * Get dashboard statistics
     */
    public function getDashboardStats()
    {
        $totalPrograms = Module::count();
        $activePrograms = Module::where('is_active', true)->count();
        
        // Enrolled Learners
        $totalEnrolledLearners = User::where('role', 'user')
            ->whereHas('trainings')
            ->count();
        
        // Average Completion Rate
        $averageCompletionRate = Module::query()
            ->withCount(['users as completed' => function ($q) {
                $q->wherePivot('status', 'completed');
            }])
            ->with(['users' => function ($q) {
                $q->select('users.id');
            }])
            ->get()
            ->map(function ($module) {
                $total = $module->users->count();
                return $total > 0 ? ($module->completed / $total) * 100 : 0;
            })
            ->avg();

        // Pending Certifications
        $pendingCertifications = User::where('role', 'user')
            ->whereHas('trainings', function ($q) {
                $q->where('status', 'in_progress')
                  ->where('is_certified', false);
            })
            ->count();

        // Expired Programs (end_date < today)
        $expiredPrograms = Module::where('end_date', '<', now())
            ->where('is_active', true)
            ->count();

        // Today's Enrollments
        $todayEnrollments = User::whereHas('trainings', function ($q) {
            $q->whereDate('enrolled_at', today());
        })->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_programs' => $totalPrograms,
                'active_programs' => $activePrograms,
                'total_enrolled_learners' => $totalEnrolledLearners,
                'average_completion_rate' => round($averageCompletionRate, 2) ?? 0,
                'pending_certifications' => $pendingCertifications,
                'expired_programs' => $expiredPrograms,
                'today_enrollments' => $todayEnrollments,
            ]
        ]);
    }

    /**
     * Get enrollment trend data (last 30 days)
     * Note: This requires the program_enrollment_metrics table to be populated
     * via a scheduled job or manual data entry
     */
    public function getEnrollmentTrend()
    {
        // Check if table exists and has data
        if (!ProgramEnrollmentMetric::exists()) {
            // Return empty data structure if no metrics exist
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }

        $trends = ProgramEnrollmentMetric::query()
            ->where('metric_date', '>=', now()->subDays(30))
            ->groupBy('metric_date')
            ->selectRaw('metric_date, SUM(total_enrolled) as total_enrolled, SUM(completed) as completed, SUM(in_progress) as in_progress')
            ->orderBy('metric_date')
            ->get()
            ->map(function ($metric) {
                return [
                    'date' => $metric->metric_date->format('Y-m-d'),
                    'total_enrolled' => $metric->total_enrolled ?? 0,
                    'completed' => $metric->completed ?? 0,
                    'in_progress' => $metric->in_progress ?? 0,
                    'completion_rate' => $metric->total_enrolled > 0 
                        ? round(($metric->completed / $metric->total_enrolled) * 100, 2) 
                        : 0,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $trends
        ]);
    }

    /**
     * Get program-specific metrics
     */
    public function getProgramMetrics($moduleId)
    {
        $module = Module::findOrFail($moduleId);
        
        $totalEnrolled = $module->users()->count();
        $completed = $module->users()->where('pivot_status', 'completed')->count();
        $inProgress = $module->users()->where('pivot_status', 'in_progress')->count();
        $notStarted = $totalEnrolled - $completed - $inProgress;
        
        $averageScore = $module->users()
            ->wherePivot('final_score', '!=', null)
            ->avg('pivot_final_score') ?? 0;

        $certified = $module->users()->wherePivot('is_certified', true)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'program_id' => $moduleId,
                'program_title' => $module->title,
                'total_enrolled' => $totalEnrolled,
                'completed' => $completed,
                'in_progress' => $inProgress,
                'not_started' => $notStarted,
                'completion_rate' => $totalEnrolled > 0 ? round(($completed / $totalEnrolled) * 100, 2) : 0,
                'average_score' => round($averageScore, 2),
                'certified' => $certified,
                'passing_grade' => $module->passing_grade,
            ]
        ]);
    }

    /**
     * Get learner performance breakdown
     */
    public function getLearnerPerformance($moduleId)
    {
        $module = Module::findOrFail($moduleId);
        
        $learners = $module->users()
            ->with('trainings')
            ->get()
            ->map(function ($user) use ($module) {
                $training = $user->trainings()
                    ->where('module_id', $module->id)
                    ->first();
                
                return [
                    'learner_id' => $user->id,
                    'learner_name' => $user->name,
                    'email' => $user->email,
                    'status' => $training?->pivot?->status ?? 'not_started',
                    'final_score' => $training?->pivot?->final_score ?? 0,
                    'is_certified' => $training?->pivot?->is_certified ?? false,
                    'enrolled_at' => $training?->pivot?->enrolled_at,
                    'completed_at' => $training?->pivot?->completed_at,
                ];
            })
            ->sortBy('status');

        return response()->json([
            'success' => true,
            'data' => $learners->values()
        ]);
    }

    /**
     * Export metrics to CSV
     */
    public function exportMetrics(Request $request)
    {
        $type = $request->query('type', 'dashboard'); // dashboard, program, learners
        $moduleId = $request->query('module_id');

        $filename = 'metrics-' . now()->format('Y-m-d-H-i-s') . '.csv';
        
        if ($type === 'program' && $moduleId) {
            return $this->exportProgramMetrics($moduleId, $filename);
        } elseif ($type === 'learners' && $moduleId) {
            return $this->exportLearnerMetrics($moduleId, $filename);
        }

        return $this->exportDashboardMetrics($filename);
    }

    private function exportDashboardMetrics($filename)
    {
        $metrics = [
            ['Metric', 'Value'],
            ['Total Programs', Module::count()],
            ['Active Programs', Module::where('is_active', true)->count()],
            ['Total Enrolled Learners', User::whereHas('trainings')->count()],
            ['Average Completion Rate', 'See trend chart'],
            ['Pending Certifications', User::whereHas('trainings', function($q) {
                $q->where('status', 'in_progress');
            })->count()],
            ['Expired Programs', Module::where('end_date', '<', now())->count()],
        ];

        $callback = function() use ($metrics) {
            $file = fopen('php://output', 'w');
            foreach ($metrics as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    private function exportProgramMetrics($moduleId, $filename)
    {
        $module = Module::findOrFail($moduleId);
        $metrics = $this->getProgramMetrics($moduleId)->getData()->data;

        $callback = function() use ($metrics) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Program Metrics', $metrics->program_title]);
            fputcsv($file, []);
            fputcsv($file, ['Metric', 'Value']);
            fputcsv($file, ['Total Enrolled', $metrics->total_enrolled]);
            fputcsv($file, ['Completed', $metrics->completed]);
            fputcsv($file, ['In Progress', $metrics->in_progress]);
            fputcsv($file, ['Not Started', $metrics->not_started]);
            fputcsv($file, ['Completion Rate (%)', $metrics->completion_rate]);
            fputcsv($file, ['Average Score', $metrics->average_score]);
            fputcsv($file, ['Certified', $metrics->certified]);
            fputcsv($file, ['Passing Grade', $metrics->passing_grade]);
            fclose($file);
        };

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    private function exportLearnerMetrics($moduleId, $filename)
    {
        $learners = $this->getLearnerPerformance($moduleId)->getData()->data;

        $callback = function() use ($learners) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Learner Name', 'Email', 'Status', 'Final Score', 'Certified', 'Enrolled At', 'Completed At']);
            foreach ($learners as $learner) {
                fputcsv($file, [
                    $learner->learner_name,
                    $learner->email,
                    $learner->status,
                    $learner->final_score,
                    $learner->is_certified ? 'Yes' : 'No',
                    $learner->enrolled_at,
                    $learner->completed_at ?? 'Not Completed',
                ]);
            }
            fclose($file);
        };

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
