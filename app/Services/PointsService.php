<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserTraining;
use App\Models\ExamAttempt;
use App\Models\UserPoints;
use Illuminate\Support\Facades\DB;

/**
 * Service untuk menghitung dan tracking poin user
 * 
 * Formula Poin Konsisten:
 * - Penyelesaian Modul/Training: 100 poin
 * - Sertifikasi: 200 poin bonus
 * - Exam Lulus: 50 poin + (score / 2) poin tambahan
 * - Maximum per exam: 50 + 50 = 100 poin
 */
class PointsService
{
    const MODULE_COMPLETION_POINTS = 100;
    const CERTIFICATION_BONUS_POINTS = 200;
    const EXAM_PASS_BASE_POINTS = 50;
    const EXAM_SCORE_MULTIPLIER = 0.5; // score/2, max 50 poin

    /**
     * Record poin untuk user ketika menyelesaikan modul
     * 
     * @param int $userId
     * @param int $moduleId
     * @param bool $isCertified (optional) Tambah bonus sertifikasi
     * @return int Total poin yang ditambahkan
     */
    public function recordModuleCompletion($userId, $moduleId, $isCertified = false)
    {
        $totalPoints = self::MODULE_COMPLETION_POINTS;
        
        // Add bonus jika certified
        if ($isCertified) {
            $totalPoints += self::CERTIFICATION_BONUS_POINTS;
        }

        // Record di user_points table
        UserPoints::create([
            'user_id' => $userId,
            'activity_type' => 'module_completion',
            'points' => self::MODULE_COMPLETION_POINTS,
            'module_id' => $moduleId,
            'description' => "Menyelesaikan modul",
        ]);

        // Add certification bonus jika ada
        if ($isCertified) {
            UserPoints::create([
                'user_id' => $userId,
                'activity_type' => 'certification',
                'points' => self::CERTIFICATION_BONUS_POINTS,
                'module_id' => $moduleId,
                'description' => "Sertifikasi modul",
            ]);
        }

        // Update total poin di users table
        User::findOrFail($userId)->increment('total_points', $totalPoints);

        return $totalPoints;
    }

    /**
     * Record poin untuk exam yang lulus
     * 
     * @param int $userId
     * @param int $examAttemptId
     * @param int $score (0-100)
     * @return int Total poin yang ditambahkan
     */
    public function recordExamPass($userId, $examAttemptId, $score = 0)
    {
        // Base points untuk lulus
        $scoreBonus = min(floor($score * self::EXAM_SCORE_MULTIPLIER), 50);
        $totalPoints = self::EXAM_PASS_BASE_POINTS + $scoreBonus;

        UserPoints::create([
            'user_id' => $userId,
            'activity_type' => 'exam_passed',
            'points' => $totalPoints,
            'exam_attempt_id' => $examAttemptId,
            'description' => "Lulus exam dengan skor {$score}",
            'metadata' => json_encode(['score' => $score]),
        ]);

        // Update total poin di users table
        User::findOrFail($userId)->increment('total_points', $totalPoints);

        return $totalPoints;
    }

    /**
     * Get total poin user
     * 
     * @param int $userId
     * @return int Total poin
     */
    public function getTotalPoints($userId)
    {
        return User::find($userId)?->total_points ?? 0;
    }

    /**
     * Get poin history user
     * 
     * @param int $userId
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getPointsHistory($userId, $limit = 50)
    {
        return UserPoints::where('user_id', $userId)
            ->with(['module', 'examAttempt'])
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    /**
     * Get points breakdown untuk user
     * Format: ['module_completion' => X, 'certification' => Y, 'exam' => Z, 'total' => sum]
     * 
     * @param int $userId
     * @return array
     */
    public function getPointsBreakdown($userId)
    {
        $breakdown = UserPoints::where('user_id', $userId)
            ->selectRaw('
                activity_type,
                SUM(points) as total_points
            ')
            ->groupBy('activity_type')
            ->get()
            ->pluck('total_points', 'activity_type')
            ->toArray();

        return [
            'module_completion' => $breakdown['module_completion'] ?? 0,
            'certification' => $breakdown['certification'] ?? 0,
            'exam_passed' => $breakdown['exam_passed'] ?? 0,
            'total' => array_sum($breakdown),
        ];
    }

    /**
     * Calculate poin untuk training completion (untuk backward compatibility & dashboard)
     * 
     * @param int $userId
     * @return array Points breakdown
     */
    public function calculateUserPoints($userId)
    {
        $user = User::find($userId);
        if (!$user) {
            return [
                'module_completion_points' => 0,
                'certification_bonus_points' => 0,
                'exam_points' => 0,
                'total_points' => 0,
            ];
        }

        $breakdown = self::getPointsBreakdown($userId);

        return [
            'module_completion_points' => $breakdown['module_completion'],
            'certification_bonus_points' => $breakdown['certification'],
            'exam_points' => $breakdown['exam_passed'],
            'total_points' => $breakdown['total'],
        ];
    }

    /**
     * Get top performers with points
     * 
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getTopPerformers($limit = 10)
    {
        return DB::table('users')
            ->select(
                'users.id',
                'users.name',
                'users.email',
                'users.nip',
                'users.department',
                'users.total_points',
                DB::raw('COUNT(DISTINCT user_trainings.module_id) as completed_modules'),
                DB::raw('SUM(CASE WHEN user_trainings.is_certified = true THEN 1 ELSE 0 END) as certifications'),
                DB::raw('ROUND(AVG(user_trainings.final_score), 2) as avg_score')
            )
            ->leftJoin('user_trainings', 'users.id', '=', 'user_trainings.user_id')
            ->groupBy('users.id', 'users.name', 'users.email', 'users.nip', 'users.department', 'users.total_points')
            ->orderByDesc('users.total_points')
            ->limit($limit)
            ->get()
            ->map(function ($user) {
                $totalPoints = (int)$user->total_points;
                $badge = $totalPoints >= 1000 ? 'PLATINUM' : ($totalPoints >= 500 ? 'GOLD' : ($totalPoints >= 300 ? 'SILVER' : 'BRONZE'));

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'nip' => $user->nip ?? 'N/A',
                    'department' => $user->department ?? 'Unassigned',
                    'total_points' => $totalPoints,
                    'completed_modules' => (int)($user->completed_modules ?? 0),
                    'certifications' => (int)($user->certifications ?? 0),
                    'avg_score' => (float)($user->avg_score ?? 0),
                    'badge' => $badge,
                ];
            });
    }

    /**
     * Recalculate poin untuk user (untuk migrasi data lama)
     * 
     * @param int $userId
     */
    public function recalculateUserPoints($userId)
    {
        DB::transaction(function () use ($userId) {
            // Clear existing points
            UserPoints::where('user_id', $userId)->delete();
            
            $user = User::findOrFail($userId);
            $user->total_points = 0;
            $user->save();

            // Recalculate dari training history
            $trainings = UserTraining::where('user_id', $userId)
                ->where('status', 'completed')
                ->get();

            foreach ($trainings as $training) {
                $this->recordModuleCompletion($userId, $training->module_id, $training->is_certified);
            }

            // Recalculate dari exam yang lulus
            $exams = ExamAttempt::where('user_id', $userId)
                ->where('is_passed', true)
                ->get();

            foreach ($exams as $exam) {
                $this->recordExamPass($userId, $exam->id, $exam->percentage ?? 0);
            }
        });
    }

    /**
     * Batch recalculate untuk semua user (untuk migrasi)
     */
    public function recalculateAllUserPoints()
    {
        $users = User::all();
        foreach ($users as $user) {
            $this->recalculateUserPoints($user->id);
        }
    }
}
