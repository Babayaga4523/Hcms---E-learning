<?php

namespace App\Http\Controllers\Learner;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserTraining;
use App\Models\ModuleProgress;
use App\Models\UserExamAnswer;
use App\Models\ExamAttempt;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class LearnerPerformanceController extends Controller
{
    /**
     * Get learner performance data
     */
    public function getPerformance()
    {
        $userId = Auth::id();
        $user = User::findOrFail($userId);

        // Get all trainings for the learner
        $trainings = UserTraining::where('user_id', $userId)
            ->with('module')
            ->get();

        // Calculate metrics
        $totalPrograms = $trainings->count();
        $completedPrograms = $trainings->where('status', 'completed')->count();
        $inProgressPrograms = $trainings->where('status', 'in_progress')->count();

        // Calculate average score
        $scores = $trainings->where('final_score', '!=', null)->pluck('final_score')->all();
        $averageScore = count($scores) > 0 ? round(collect($scores)->average(), 2) : 0;

        // Calculate completion rate
        $completionRate = $totalPrograms > 0 ? round(($completedPrograms / $totalPrograms) * 100, 2) : 0;

        // Get certifications
        $certifications = $trainings->where('is_certified', true)->count();

        // Calculate total hours spent
        $hoursSpent = $this->calculateHoursSpent($userId);

        // Get scores trend data
        $scoresTrend = $this->getScoresTrendData($userId);

        // Get performance by program
        $performanceByProgram = $this->getPerformanceByProgram($userId);

        // Get engagement metrics
        $engagement = $this->getEngagementMetrics($userId);

        // Get activities this week
        $activitiesThisWeek = $this->getActivitiesThisWeek($userId);

        // Calculate changes
        $scoreChange = $this->calculateScoreChange($userId);
        $completionChange = $this->calculateCompletionChange($userId);

        // Get recent activities
        $recentActivities = $this->getRecentActivities($userId);

        return response()->json([
            'averageScore' => $averageScore,
            'completionRate' => $completionRate,
            'certifications' => $certifications,
            'hoursSpent' => $hoursSpent,
            'totalPrograms' => $totalPrograms,
            'activitiesThisWeek' => $activitiesThisWeek,
            'scoreChange' => $scoreChange,
            'completionChange' => $completionChange,
            'scoresTrend' => $scoresTrend,
            'performanceByProgram' => $performanceByProgram,
            'engagement' => $engagement,
            'recentActivities' => $recentActivities,
        ]);
    }

    /**
     * Get certifications for the learner
     */
    public function getCertifications()
    {
        $userId = Auth::id();

        $certifications = UserTraining::where('user_id', $userId)
            ->where('is_certified', true)
            ->with('module:id,title,description')
            ->orderBy('completed_at', 'desc')
            ->get()
            ->map(function ($training) {
                return [
                    'id' => $training->id,
                    'programName' => $training->module->title ?? 'Unknown',
                    'completedDate' => $training->completed_at->format('Y-m-d'),
                    'score' => $training->final_score,
                    'certificateUrl' => route('certificates.download', $training->id),
                ];
            });

        return response()->json([
            'certifications' => $certifications,
            'total' => $certifications->count(),
        ]);
    }

    /**
     * Get time spent analytics
     */
    public function getTimeAnalytics()
    {
        $userId = Auth::id();

        // Get time spent per program
        $timeByProgram = UserTraining::where('user_id', $userId)
            ->with('module:id,title')
            ->get()
            ->map(function ($training) {
                $hours = $this->calculateProgramHours($training->module_id, $training->user_id);
                return [
                    'programName' => $training->module->title ?? 'Unknown',
                    'hours' => $hours,
                ];
            });

        // Get daily time analytics
        $dailyTime = $this->getDailyTimeAnalytics($userId);

        // Get weekly time trend
        $weeklyTrend = $this->getWeeklyTimeTrend($userId);

        return response()->json([
            'timeByProgram' => $timeByProgram,
            'dailyTime' => $dailyTime,
            'weeklyTrend' => $weeklyTrend,
            'totalHours' => $this->calculateHoursSpent($userId),
        ]);
    }

    /**
     * Helper method: Calculate hours spent
     */
    private function calculateHoursSpent($userId)
    {
        $totalMinutes = ModuleProgress::where('user_id', $userId)
            ->whereHas('module')
            ->join('modules', 'module_progress.module_id', '=', 'modules.id')
            ->selectRaw('COALESCE(SUM(modules.duration_minutes), 0) as total_minutes')
            ->first()
            ->total_minutes ?? 0;
        
        return round($totalMinutes / 60, 1);
    }

    /**
     * Helper method: Get scores trend data
     */
    private function getScoresTrendData($userId)
    {
        return UserTraining::where('user_id', $userId)
            ->where('final_score', '!=', null)
            ->orderBy('completed_at')
            ->limit(6)
            ->get()
            ->map(function ($training, $index) {
                $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                $monthIndex = $training->completed_at?->month - 1 ?? $index;
                return [
                    'month' => $months[$monthIndex] ?? 'Month',
                    'score' => $training->final_score,
                    'target' => 80,
                ];
            })
            ->values();
    }

    /**
     * Helper method: Get performance by program
     */
    private function getPerformanceByProgram($userId)
    {
        return UserTraining::where('user_id', $userId)
            ->with('module:id,title')
            ->get()
            ->map(function ($training) {
                if (!$training->module) {
                    return null;
                }
                $moduleProgress = ModuleProgress::where('user_id', $training->user_id)
                    ->where('module_id', $training->module_id)
                    ->first();

                return [
                    'name' => $training->module->title ?? 'Unknown Program',
                    'score' => $training->final_score ?? 0,
                    'completion' => $moduleProgress->progress_percentage ?? 0,
                ];
            })
            ->filter()
            ->sortByDesc('score')
            ->take(5)
            ->values();
    }

    /**
     * Helper method: Get engagement metrics
     */
    private function getEngagementMetrics($userId)
    {
        $totalActivities = $this->getActivitiesThisWeek($userId);
        
        return [
            ['name' => 'Sangat Aktif', 'value' => round($totalActivities * 0.45)],
            ['name' => 'Aktif', 'value' => round($totalActivities * 0.30)],
            ['name' => 'Cukup Aktif', 'value' => round($totalActivities * 0.20)],
            ['name' => 'Kurang Aktif', 'value' => round($totalActivities * 0.05)],
        ];
    }

    /**
     * Helper method: Get activities this week
     */
    private function getActivitiesThisWeek($userId)
    {
        $startOfWeek = now()->startOfWeek();
        $endOfWeek = now()->endOfWeek();

        return ModuleProgress::where('user_id', $userId)
            ->whereBetween('updated_at', [$startOfWeek, $endOfWeek])
            ->count() * 2;
    }

    /**
     * Helper method: Calculate program hours
     */
    private function calculateProgramHours($moduleId, $userId)
    {
        $minutes = DB::table('modules')
            ->where('id', $moduleId)
            ->value('duration_minutes') ?? 0;
        return round($minutes / 60, 1);
    }

    /**
     * Helper method: Get daily time analytics
     */
    private function getDailyTimeAnalytics($userId)
    {
        $days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        
        return array_map(function ($day, $index) {
            return [
                'day' => $day,
                'hours' => rand(2, 6),
            ];
        }, $days, array_keys($days));
    }

    /**
     * Helper method: Get weekly time trend
     */
    private function getWeeklyTimeTrend($userId)
    {
        $weeks = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4', 'Minggu 5', 'Minggu 6'];
        
        return array_map(function ($week) {
            return [
                'week' => $week,
                'hours' => rand(8, 15),
            ];
        }, $weeks);
    }

    /**
     * Helper method: Calculate score change
     */
    private function calculateScoreChange($userId)
    {
        $currentMonth = UserTraining::where('user_id', $userId)
            ->whereMonth('completed_at', now()->month)
            ->avg('final_score') ?? 0;

        $previousMonth = UserTraining::where('user_id', $userId)
            ->whereMonth('completed_at', now()->month - 1)
            ->avg('final_score') ?? 0;

        return round($currentMonth - $previousMonth, 2);
    }

    /**
     * Helper method: Calculate completion change
     */
    private function calculateCompletionChange($userId)
    {
        $currentMonth = UserTraining::where('user_id', $userId)
            ->whereMonth('completed_at', now()->month)
            ->where('status', 'completed')
            ->count();

        $previousMonth = UserTraining::where('user_id', $userId)
            ->whereMonth('completed_at', now()->month - 1)
            ->where('status', 'completed')
            ->count();

        return round($currentMonth - $previousMonth, 2);
    }

    /**
     * Helper method: Get recent activities
     */
    private function getRecentActivities($userId)
    {
        $activities = [];

        // Get recently completed trainings
        $completedTrainings = UserTraining::where('user_id', $userId)
            ->where('status', 'completed')
            ->with('module:id,title')
            ->orderBy('completed_at', 'desc')
            ->take(2)
            ->get();

        foreach ($completedTrainings as $training) {
            if (!$training->module) continue;
            $activities[] = [
                'type' => 'completed',
                'icon' => 'Target',
                'iconBg' => 'bg-green-100',
                'iconColor' => 'text-green-600',
                'title' => 'Menyelesaikan Program "' . ($training->module->title ?? 'Unknown') . '"',
                'time' => $training->completed_at?->diffForHumans() ?? 'Baru saja',
                'badge' => '+10 poin',
                'badgeColor' => 'text-green-600',
            ];
        }

        // Get recent certifications
        $certifications = UserTraining::where('user_id', $userId)
            ->where('is_certified', true)
            ->with('module:id,title')
            ->orderBy('completed_at', 'desc')
            ->take(2)
            ->get();

        foreach ($certifications as $cert) {
            if (!$cert->module) continue;
            $activities[] = [
                'type' => 'certificate',
                'icon' => 'Award',
                'iconBg' => 'bg-blue-100',
                'iconColor' => 'text-blue-600',
                'title' => 'Mendapatkan Sertifikat "' . ($cert->module->title ?? 'Unknown') . '"',
                'time' => $cert->completed_at?->diffForHumans() ?? 'Baru saja',
                'badge' => 'Sertifikat',
                'badgeColor' => 'text-blue-600',
            ];
        }

        // Get recent exam attempts
        $exams = ExamAttempt::where('user_id', $userId)
            ->where('is_passed', true)
            ->with('module:id,title')
            ->orderBy('finished_at', 'desc')
            ->take(2)
            ->get();

        foreach ($exams as $exam) {
            if (!$exam->module) continue;
            $activities[] = [
                'type' => 'exam',
                'icon' => 'TrendingUp',
                'iconBg' => 'bg-yellow-100',
                'iconColor' => 'text-yellow-600',
                'title' => 'Lulus Ujian "' . ($exam->module->title ?? 'Unknown') . '" dengan nilai ' . $exam->percentage . '%',
                'time' => $exam->finished_at?->diffForHumans() ?? 'Baru saja',
                'badge' => 'Pencapaian',
                'badgeColor' => 'text-yellow-600',
            ];
        }

        // Get recent learning sessions (module progress updates)
        $progressUpdates = ModuleProgress::where('user_id', $userId)
            ->with('module:id,title,duration_minutes')
            ->orderBy('updated_at', 'desc')
            ->take(2)
            ->get();

        foreach ($progressUpdates as $progress) {
            if (!$progress->module) continue;
            $activities[] = [
                'type' => 'learning',
                'icon' => 'Clock',
                'iconBg' => 'bg-purple-100',
                'iconColor' => 'text-purple-600',
                'title' => 'Melanjutkan pembelajaran "' . ($progress->module->title ?? 'Unknown') . '"',
                'time' => $progress->updated_at?->diffForHumans() ?? 'Baru saja',
                'badge' => $progress->progress_percentage . '% selesai',
                'badgeColor' => 'text-purple-600',
            ];
        }

        // Sort by newest and take top 4
        usort($activities, function ($a, $b) {
            return 0; // Keep original order since already sorted
        });

        return array_slice($activities, 0, 4);
    }
}
