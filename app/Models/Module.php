<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Module extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        
        'passing_grade',
        'has_pretest',
        'has_posttest',
        'is_active',
        'approval_status',
        'approved_at',
        'approved_by',
        'compliance_required',
        'start_date',
        'end_date',
        'instructor_id',
        'template_id',
        'duration',
        'duration_minutes',
        'category',
        'difficulty',
        'rating',
        'allow_retake',
        'max_retake_attempts',
        'expiry_date',
        'prerequisite_module_id',
        'certificate_template',
        'cover_image',
        'xp',
    ];

    protected $casts = [
        'has_pretest' => 'boolean',
        'is_active' => 'boolean',
        'compliance_required' => 'boolean',
        'allow_retake' => 'boolean',
        'rating' => 'decimal:2',
        'approved_at' => 'datetime',
        'start_date' => 'date',
        'end_date' => 'date',
        'expiry_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relasi ke Questions
     */
    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    /**
     * Relasi ke Module Progress
     */
    public function progress(): HasMany
    {
        return $this->hasMany(ModuleProgress::class);
    }

    /**
     * Relasi ke Exam Attempts
     */
    public function examAttempts(): HasMany
    {
        return $this->hasMany(ExamAttempt::class);
    }

    /**
     * Relasi ke Users (Many-to-Many melalui user_trainings)
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_trainings')
            ->withPivot('status', 'final_score', 'is_certified', 'enrolled_at', 'completed_at')
            ->withTimestamps();
    }

    /**
     * Relasi ke User Trainings
     */
    public function userTrainings(): HasMany
    {
        return $this->hasMany(UserTraining::class);
    }

    /**
     * Relasi ke Training Materials
     */
    public function trainingMaterials(): HasMany
    {
        return $this->hasMany(TrainingMaterial::class);
    }

    /**
     * Relasi ke Instructor (User)
     */
    public function instructor()
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    /**
     * Relasi ke Program Template
     */
    public function template()
    {
        return $this->belongsTo(ProgramTemplate::class, 'template_id');
    }

    /**
     * Relasi ke Program Approvals
     */
    public function approvals()
    {
        return $this->hasMany(ProgramApproval::class);
    }

    /**
     * Relasi ke Compliance Evidences
     */
    public function complianceEvidences()
    {
        return $this->hasMany(ComplianceEvidence::class);
    }

    /**
     * Relasi ke Program Notifications
     */
    public function notifications()
    {
        return $this->hasMany(ProgramNotification::class);
    }

    /**
     * Relasi ke Enrollment Metrics
     */
    public function enrollmentMetrics()
    {
        return $this->hasMany(ProgramEnrollmentMetric::class);
    }

    /**
     * Relasi ke Module Assignments (Users assigned to this training)
     */
    public function assignedUsers()
    {
        return $this->hasMany(ModuleAssignment::class);
    }
}
