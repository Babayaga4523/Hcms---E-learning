<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserTrainingProgress extends Model
{
    use HasFactory;

    protected $table = 'user_training_progress';

    protected $fillable = [
        'user_id',
        'training_program_id',
        'module_id',
        'material_id',
        'material_completed',
        'time_spent', // in seconds
        'completed_at',
        'last_accessed_at',
    ];

    protected $casts = [
        'material_completed' => 'boolean',
        'time_spent' => 'integer',
        'completed_at' => 'datetime',
        'last_accessed_at' => 'datetime',
    ];

    /**
     * Get the user that owns the progress
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the training program
     */
    public function trainingProgram()
    {
        return $this->belongsTo(TrainingProgram::class);
    }

    /**
     * Get the module
     */
    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    /**
     * Get the material
     */
    public function material()
    {
        return $this->belongsTo(Material::class);
    }

    /**
     * Scope for completed materials
     */
    public function scopeCompleted($query)
    {
        return $query->where('material_completed', true);
    }
}
