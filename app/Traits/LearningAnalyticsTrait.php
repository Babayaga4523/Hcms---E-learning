<?php

namespace App\Traits;

use Illuminate\Support\Facades\Auth;
use App\Models\UserTraining;
use App\Models\ModuleProgress;

/**
 * Trait untuk learning analytics
 * Menyediakan helper methods untuk menghitung metrics pembelajaran
 */
trait LearningAnalyticsTrait
{
    /**
     * Hitung rata-rata skor learner
     */
    public static function calculateAverageScore($userId)
    {
        $scores = UserTraining::where('user_id', $userId)
            ->where('final_score', '!=', null)
            ->pluck('final_score')
            ->all();

        if (empty($scores)) {
            return 0;
        }

        return round(collect($scores)->average(), 2);
    }

    /**
     * Hitung tingkat penyelesaian
     */
    public static function calculateCompletionRate($userId)
    {
        $total = UserTraining::where('user_id', $userId)->count();
        
        if ($total === 0) {
            return 0;
        }

        $completed = UserTraining::where('user_id', $userId)
            ->where('status', 'completed')
            ->count();

        return round(($completed / $total) * 100, 2);
    }

    /**
     * Hitung jumlah sertifikasi
     */
    public static function countCertifications($userId)
    {
        return UserTraining::where('user_id', $userId)
            ->where('is_certified', true)
            ->count();
    }

    /**
     * Hitung total jam pembelajaran
     */
    public static function calculateTotalHours($userId)
    {
        return ModuleProgress::where('user_id', $userId)
            ->join('modules', 'module_progress.module_id', '=', 'modules.id')
            ->sum('modules.duration') ?? 0;
    }

    /**
     * Hitung progres rata-rata
     */
    public static function calculateAverageProgress($userId)
    {
        $progress = ModuleProgress::where('user_id', $userId)
            ->pluck('progress_percentage')
            ->all();

        if (empty($progress)) {
            return 0;
        }

        return round(collect($progress)->average(), 2);
    }

    /**
     * Ambil program yang sedang berlangsung
     */
    public static function getInProgressPrograms($userId)
    {
        return UserTraining::where('user_id', $userId)
            ->where('status', 'in_progress')
            ->with('module')
            ->count();
    }

    /**
     * Ambil program yang sudah selesai
     */
    public static function getCompletedPrograms($userId)
    {
        return UserTraining::where('user_id', $userId)
            ->where('status', 'completed')
            ->with('module')
            ->count();
    }

    /**
     * Ambil skor tertinggi
     */
    public static function getHighestScore($userId)
    {
        return UserTraining::where('user_id', $userId)
            ->where('final_score', '!=', null)
            ->max('final_score') ?? 0;
    }

    /**
     * Ambil skor terendah
     */
    public static function getLowestScore($userId)
    {
        return UserTraining::where('user_id', $userId)
            ->where('final_score', '!=', null)
            ->min('final_score') ?? 0;
    }

    /**
     * Hitung learning streak (hari berturut-turut belajar)
     */
    public static function calculateLearningStreak($userId)
    {
        $activities = ModuleProgress::where('user_id', $userId)
            ->orderBy('updated_at', 'desc')
            ->pluck('updated_at')
            ->all();

        if (empty($activities)) {
            return 0;
        }

        $streak = 0;
        $today = now();

        foreach ($activities as $activity) {
            $daysDiff = $today->diffInDays($activity);
            
            if ($daysDiff === 0 || $daysDiff === $streak) {
                $streak++;
                $today = $activity;
            } else {
                break;
            }
        }

        return $streak;
    }

    /**
     * Hitung engagement score (0-100)
     */
    public static function calculateEngagementScore($userId)
    {
        $activities = ModuleProgress::where('user_id', $userId)
            ->count();

        $programs = UserTraining::where('user_id', $userId)->count();
        $completionRate = self::calculateCompletionRate($userId);
        $averageScore = self::calculateAverageScore($userId);

        // Formula: (activities * 10% + programs * 20% + completion * 40% + avgScore * 30%) / 10
        $score = (($activities * 10) + ($programs * 20) + ($completionRate * 40) + ($averageScore * 30)) / 10;

        return min(round($score, 2), 100);
    }

    /**
     * Ambil rekomendasi pembelajaran berdasarkan performance
     */
    public static function getLearningRecommendations($userId)
    {
        $recommendations = [];
        $avgScore = self::calculateAverageScore($userId);
        $completionRate = self::calculateCompletionRate($userId);
        $inProgressCount = self::getInProgressPrograms($userId);

        // Rekomendasi berdasarkan skor
        if ($avgScore < 70) {
            $recommendations[] = [
                'type' => 'improvement',
                'message' => 'Skor Anda masih di bawah rata-rata. Pertimbangkan untuk mengulang materi atau mencari bantuan.',
                'priority' => 'high'
            ];
        }

        // Rekomendasi berdasarkan penyelesaian
        if ($completionRate < 50) {
            $recommendations[] = [
                'type' => 'completion',
                'message' => 'Fokus pada menyelesaikan program yang ada sebelum memulai yang baru.',
                'priority' => 'high'
            ];
        }

        // Rekomendasi untuk tetap konsisten
        if ($inProgressCount === 0 && $completionRate === 100) {
            $recommendations[] = [
                'type' => 'advancement',
                'message' => 'Sempurna! Semua program selesai. Pertimbangkan program lanjutan.',
                'priority' => 'medium'
            ];
        }

        return $recommendations;
    }

    /**
     * Hitung waktu rata-rata per program
     */
    public static function getAverageTimePerProgram($userId)
    {
        $programs = UserTraining::where('user_id', $userId)
            ->with('module')
            ->get();

        if ($programs->isEmpty()) {
            return 0;
        }

        $totalHours = 0;
        foreach ($programs as $program) {
            $totalHours += $program->module->duration ?? 0;
        }

        return round($totalHours / count($programs), 2);
    }

    /**
     * Ambil program dengan skor tertinggi
     */
    public static function getTopPerformingProgram($userId)
    {
        return UserTraining::where('user_id', $userId)
            ->where('final_score', '!=', null)
            ->with('module')
            ->orderBy('final_score', 'desc')
            ->first();
    }

    /**
     * Ambil program dengan skor terendah
     */
    public static function getBottomPerformingProgram($userId)
    {
        return UserTraining::where('user_id', $userId)
            ->where('final_score', '!=', null)
            ->with('module')
            ->orderBy('final_score', 'asc')
            ->first();
    }

    /**
     * Hitung learning velocity (progress per hari)
     */
    public static function calculateLearningVelocity($userId)
    {
        $firstActivity = ModuleProgress::where('user_id', $userId)
            ->orderBy('created_at', 'asc')
            ->first();

        $lastActivity = ModuleProgress::where('user_id', $userId)
            ->orderBy('updated_at', 'desc')
            ->first();

        if (!$firstActivity || !$lastActivity) {
            return 0;
        }

        $days = $firstActivity->created_at->diffInDays($lastActivity->updated_at);
        if ($days === 0) {
            return 0;
        }

        $totalProgress = ModuleProgress::where('user_id', $userId)->count();

        return round($totalProgress / $days, 2);
    }
}
