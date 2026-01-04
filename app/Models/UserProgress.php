<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProgress extends Model
{
    protected $fillable = [
        'user_id',
        'training_material_id',
        'module_id',
        'progress_percentage',
        'completion_status',
        'time_spent',
        'last_accessed_at',
        'completed_at'
    ];

    protected $casts = [
        'progress_percentage' => 'decimal:2',
        'time_spent' => 'integer',
        'last_accessed_at' => 'datetime',
        'completed_at' => 'datetime'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function trainingMaterial(): BelongsTo
    {
        return $this->belongsTo(TrainingMaterial::class);
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }
}
