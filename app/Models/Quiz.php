<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quiz extends Model
{
    use HasFactory;

    protected $fillable = [
        'module_id',
        'name',
        'type',
        'description',
        'passing_score',
        'time_limit',
        'show_answers',
        'is_active',
        'title',
        'training_program_id',
        'difficulty',
        'question_count',
        'status',
        'quality_score',
        'coverage_score',
        'created_by',
        'published_by',
        'published_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'show_answers' => 'boolean',
        'published_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    const QUIZ_TYPES = [
        'pretest' => 'Pre-Test',
        'posttest' => 'Post-Test',
    ];

    /**
     * Relasi ke Module
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    /**
     * Relasi ke TrainingProgram (legacy)
     */
    public function trainingProgram(): BelongsTo
    {
        return $this->belongsTo(TrainingProgram::class);
    }

    /**
     * Relasi ke Questions
     */
    public function questions(): HasMany
    {
        return $this->hasMany(Question::class)->orderBy('order');
    }

    /**
     * Get the user who created this quiz
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who published this quiz
     */
    public function publisher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    /**
     * Get quiz type label
     */
    public function getTypeLabel(): string
    {
        return self::QUIZ_TYPES[$this->type] ?? 'Unknown';
    }

    /**
     * Get total points for quiz
     */
    public function getTotalPoints(): int
    {
        return $this->questions()->sum('points');
    }

    /**
     * Get question count
     */
    public function getQuestionCount(): int
    {
        return $this->questions()->count();
    }
}
