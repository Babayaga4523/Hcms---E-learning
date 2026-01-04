<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'module_id',
        'exam_type',
        'score',
        'percentage',
        'is_passed',
        'started_at',
        'finished_at',
        'duration_minutes',
    ];

    protected $casts = [
        'is_passed' => 'boolean',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    /**
     * Relasi ke User
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relasi ke Module
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    /**
     * Relasi ke User Exam Answers
     */
    public function answers(): HasMany
    {
        return $this->hasMany(UserExamAnswer::class);
    }

    /**
     * Calculate percentage dari score
     */
    public function calculatePercentage(): void
    {
        // Asumsikan setiap soal bernilai sama
        $totalQuestions = $this->module->questions()->count();
        if ($totalQuestions > 0) {
            $this->percentage = ($this->score / $totalQuestions) * 100;
        }
    }

    /**
     * Cek apakah user lulus
     */
    public function checkIfPassed(): void
    {
        $this->is_passed = $this->percentage >= $this->module->passing_grade;
    }

    /**
     * Calculate durasi pengerjaan (dalam menit)
     */
    public function calculateDuration(): void
    {
        if ($this->finished_at) {
            $this->duration_minutes = $this->started_at->diffInMinutes($this->finished_at);
        }
    }
}
