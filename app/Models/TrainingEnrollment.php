<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingEnrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'training_program_id',
        'status', // not_started, in_progress, completed, expired
        'progress', // percentage 0-100
        'enrolled_at',
        'started_at',
        'completed_at',
        'due_date',
        'time_spent', // total time in minutes
        'materials_completed',
        'enrolled_by', // user_id who enrolled this user
    ];

    protected $casts = [
        'progress' => 'integer',
        'enrolled_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'due_date' => 'datetime',
        'materials_completed' => 'integer',
    ];

    /**
     * Get the user that is enrolled
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
     * Get the user who enrolled this user
     */
    public function enrolledBy()
    {
        return $this->belongsTo(User::class, 'enrolled_by');
    }

    /**
     * Scope for active enrollments (not completed)
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['not_started', 'in_progress']);
    }

    /**
     * Scope for completed enrollments
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope for in progress enrollments
     */
    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    /**
     * Scope for overdue enrollments
     */
    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now())
                     ->whereIn('status', ['not_started', 'in_progress']);
    }

    /**
     * Check if enrollment is overdue
     */
    public function isOverdue()
    {
        return $this->due_date && 
               $this->due_date < now() && 
               in_array($this->status, ['not_started', 'in_progress']);
    }
}
