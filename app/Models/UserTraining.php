<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserTraining extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'module_id',
        'status',
        'final_score',
        'is_certified',
        'enrolled_at',
        'completed_at',
    ];

    protected $casts = [
        'is_certified' => 'boolean',
        'enrolled_at' => 'datetime',
        'completed_at' => 'datetime',
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
     * Scope untuk get completed trainings
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope untuk get certified trainings
     */
    public function scopeCertified($query)
    {
        return $query->where('is_certified', true);
    }
}
