<?php

namespace App\Services;

use App\Models\User;
use App\Models\Module;
use App\Models\LearningSession;
use Illuminate\Support\Collection;
use Carbon\Carbon;

class LearningTimeService
{
    /**
     * Start a learning session when user opens a material or takes a quiz
     */
    public function startSession($userId, $moduleId, $materialId = null, $activityType = 'material')
    {
        // End any active sessions first
        $this->endActiveSessions($userId, $moduleId);

        // Create new session
        return LearningSession::create([
            'user_id' => $userId,
            'module_id' => $moduleId,
            'material_id' => $materialId,
            'activity_type' => $activityType,
            'is_active' => true,
            'metadata' => [
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]
        ]);
    }

    /**
     * End a learning session
     */
    public function endSession($sessionId)
    {
        $session = LearningSession::findOrFail($sessionId);
        return $session->endSession();
    }

    /**
     * End all active sessions for a user on a specific module
     */
    public function endActiveSessions($userId, $moduleId)
    {
        return LearningSession::forUser($userId)
            ->forModule($moduleId)
            ->active()
            ->get()
            ->each(fn($session) => $session->endSession());
    }

    /**
     * Calculate total learning hours for a user (all modules)
     * ACCURATE: Based on actual session durations
     */
    public function calculateTotalLearningHours($userId): float
    {
        $totalMinutes = LearningSession::forUser($userId)
            ->completed()
            ->sum('duration_minutes') ?? 0;

        return round($totalMinutes / 60, 2);
    }

    /**
     * Calculate learning hours for specific module
     */
    public function getModuleLearningHours($userId, $moduleId): float
    {
        $totalMinutes = LearningSession::forUser($userId)
            ->forModule($moduleId)
            ->completed()
            ->sum('duration_minutes') ?? 0;

        return round($totalMinutes / 60, 2);
    }

    /**
     * Get learning statistics for a user
     */
    public function getUserLearningStats($userId): array
    {
        $allSessions = LearningSession::forUser($userId)->completed()->get();

        $totalMinutes = $allSessions->sum('duration_minutes');
        $totalHours = round($totalMinutes / 60, 2);
        $sessionCount = $allSessions->count();
        $averageSessionLength = $sessionCount > 0 ? round($totalMinutes / $sessionCount, 1) : 0;

        return [
            'total_hours' => $totalHours,
            'total_minutes' => $totalMinutes,
            'total_sessions' => $sessionCount,
            'average_session_minutes' => $averageSessionLength,
        ];
    }

    /**
     * Get daily learning activity (for last 7 days)
     */
    public function getDailyActivity($userId): Collection
    {
        $days = collect();
        
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $dayName = now()->subDays($i)->format('D');
            
            $totalMinutes = LearningSession::forUser($userId)
                ->completed()
                ->whereDate('started_at', $date)
                ->sum('duration_minutes') ?? 0;

            $sessionCount = LearningSession::forUser($userId)
                ->completed()
                ->whereDate('started_at', $date)
                ->count();

            $days->push([
                'date' => $date,
                'day' => $dayName,
                'hours' => round($totalMinutes / 60, 2),
                'minutes' => $totalMinutes,
                'sessions' => $sessionCount,
            ]);
        }

        return $days;
    }

    /**
     * Get learning hours per module
     */
    public function getHoursByModule($userId): Collection
    {
        return Module::whereHas('userSessions', function ($query) use ($userId) {
            $query->where('user_id', $userId)->where('is_active', false);
        })->with(['userSessions' => function ($query) use ($userId) {
            $query->where('user_id', $userId)->where('is_active', false);
        }])->get()->map(function ($module) use ($userId) {
            $hours = $this->getModuleLearningHours($userId, $module->id);
            return [
                'module_id' => $module->id,
                'module_name' => $module->title,
                'hours' => $hours,
            ];
        });
    }

    /**
     * Get learning hours by activity type (materials, quizzes, etc)
     */
    public function getHoursByActivityType($userId): array
    {
        $activityTypes = [
            'material' => 'Material Pembelajaran',
            'pretest' => 'Pre-Test',
            'posttest' => 'Post-Test',
            'quiz' => 'Kuis',
            'review' => 'Review',
            'other' => 'Lainnya'
        ];

        $result = [];

        foreach (array_keys($activityTypes) as $type) {
            $minutes = LearningSession::forUser($userId)
                ->where('activity_type', $type)
                ->completed()
                ->sum('duration_minutes') ?? 0;

            $result[] = [
                'type' => $type,
                'label' => $activityTypes[$type],
                'hours' => round($minutes / 60, 2),
                'minutes' => $minutes,
            ];
        }

        return $result;
    }

    /**
     * Get learning streak (consecutive days of learning)
     */
    public function getLearningStreak($userId): int
    {
        $streak = 0;
        
        for ($i = 0; $i <= 365; $i++) {
            $date = now()->subDays($i)->format('Y-m-d');
            
            $hasSessions = LearningSession::forUser($userId)
                ->completed()
                ->whereDate('started_at', $date)
                ->exists();

            if ($hasSessions) {
                $streak++;
            } else {
                break;
            }
        }

        return $streak;
    }

    /**
     * Get peak learning hours (when user most active)
     */
    public function getPeakLearningHours($userId): Collection
    {
        $hourlyActivity = collect();

        for ($hour = 0; $hour < 24; $hour++) {
            $minutes = LearningSession::forUser($userId)
                ->completed()
                ->whereRaw("HOUR(started_at) = ?", [$hour])
                ->sum('duration_minutes') ?? 0;

            if ($minutes > 0) {
                $hourlyActivity->push([
                    'hour' => sprintf('%02d:00', $hour),
                    'hours' => round($minutes / 60, 2),
                    'minutes' => $minutes,
                ]);
            }
        }

        return $hourlyActivity->sortByDesc('minutes')->take(5);
    }

    /**
     * Check if user has been inactive for too long
     * End active sessions if idle > threshold (default 30 minutes)
     */
    public function handleInactiveSession($userId, $moduleId, $idleThresholdMinutes = 30)
    {
        $activeSessions = LearningSession::forUser($userId)
            ->forModule($moduleId)
            ->active()
            ->get();

        foreach ($activeSessions as $session) {
            $elapsedMinutes = now()->diffInMinutes($session->started_at);

            if ($elapsedMinutes > $idleThresholdMinutes) {
                $session->endSession();
            }
        }
    }

    /**
     * Get learning hours for date range
     */
    public function getHoursByDateRange($userId, $startDate, $endDate): float
    {
        $totalMinutes = LearningSession::forUser($userId)
            ->completed()
            ->betweenDates($startDate, $endDate)
            ->sum('duration_minutes') ?? 0;

        return round($totalMinutes / 60, 2);
    }
}
