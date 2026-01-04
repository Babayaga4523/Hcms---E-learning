<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrainingSchedule extends Model
{
    protected $fillable = [
        'title',
        'date',
        'start_time',
        'end_time',
        'location',
        'description',
        'program_id',
        'type',
        'capacity',
        'enrolled',
        'status',
        'trainer_ids',
    ];

    protected $casts = [
        'date' => 'date',
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'trainer_ids' => 'array',
    ];

    /**
     * Get the training program this schedule belongs to
     */
    public function program(): BelongsTo
    {
        return $this->belongsTo(Module::class, 'program_id');
    }
}
