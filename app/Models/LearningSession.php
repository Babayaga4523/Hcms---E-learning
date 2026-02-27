<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LearningSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'module_id',
        'material_id',
        'started_at',
        'ended_at',
        'activity_type',
        'is_active',
        'duration_minutes',
        'metadata',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'is_active' => 'boolean',
        'metadata' => 'json',
    ];

    /**
     * Get the user associated with this session
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the module for this session
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    /**
     * Get the material associated with this session
     */
    public function material(): BelongsTo
    {
        return $this->belongsTo(TrainingMaterial::class);
    }

    /**
     * Calculate duration when session ends
     * Returns duration in minutes
     */
    public function getDurationMinutes(): int
    {
        if ($this->duration_minutes) {
            return $this->duration_minutes;
        }

        if ($this->ended_at && $this->started_at) {
            return (int) $this->ended_at->diffInMinutes($this->started_at);
        }

        if ($this->is_active && $this->started_at) {
            return (int) now()->diffInMinutes($this->started_at);
        }

        return 0;
    }

    /**
     * Get duration in hours (formatted)
     */
    public function getDurationHours(): float
    {
        return round($this->getDurationMinutes() / 60, 2);
    }

    /**
     * End the session and calculate duration
     */
    public function endSession(): self
    {
        if (!$this->ended_at) {
            $this->ended_at = now();
            $this->duration_minutes = $this->getDurationMinutes();
            $this->is_active = false;
            $this->save();
        }
        return $this;
    }

    /**
     * Scope: Get active sessions
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Get completed sessions
     */
    public function scopeCompleted($query)
    {
        return $query->where('is_active', false)->whereNotNull('ended_at');
    }

    /**
     * Scope: Get sessions for a user
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: Get sessions for a module
     */
    public function scopeForModule($query, $moduleId)
    {
        return $query->where('module_id', $moduleId);
    }

    /**
     * Scope: Get sessions between dates
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('started_at', [$startDate, $endDate]);
    }
}
