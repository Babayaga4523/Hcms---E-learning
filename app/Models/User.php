<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'nip',
        'name',
        'email',
        'password',
        'role',
        'department',
        'location',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Relasi ke Module Progress
     */
    public function moduleProgress(): HasMany
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
     * Relasi ke User Exam Answers
     */
    public function examAnswers(): HasMany
    {
        return $this->hasMany(UserExamAnswer::class);
    }

    /**
     * Relasi ke User Trainings
     */
    public function trainings(): HasMany
    {
        return $this->hasMany(UserTraining::class);
    }

    /**
     * Relasi ke Modules (Many-to-Many)
     */
    public function modules(): BelongsToMany
    {
        return $this->belongsToMany(Module::class, 'user_trainings')
            ->withPivot('status', 'final_score', 'is_certified', 'enrolled_at', 'completed_at')
            ->withTimestamps();
    }

    /**
     * Relasi ke Audit Logs
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    /**
     * Relasi ke Roles (Many-to-Many)
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles');
    }

    /**
     * Relasi ke Department
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Relasi ke ModuleAssignments
     */
    public function moduleAssignments()
    {
        return $this->hasMany(ModuleAssignment::class);
    }

    /**
     * Cek apakah user adalah admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Cek apakah user adalah learner
     */
    public function isLearner(): bool
    {
        return $this->role === 'user';
    }

    /**
     * Get completed trainings
     */
    public function getCompletedTrainings()
    {
        return $this->trainings()->wherePivot('status', 'completed');
    }

    /**
     * Get certified trainings
     */
    public function getCertifiedTrainings()
    {
        return $this->trainings()->wherePivot('is_certified', true);
    }

    /**
     * Relasi ke completed modules
     */
    public function completedModules()
    {
        return $this->belongsToMany(Module::class, 'user_trainings')
            ->wherePivot('status', 'completed')
            ->withPivot('final_score', 'is_certified', 'completed_at');
    }

    /**
     * Relasi ke User Progress
     */
    public function userProgress(): HasMany
    {
        return $this->hasMany(UserProgress::class);
    }

    /**
     * Relasi ke Activity Logs
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    /**
     * Relasi ke Notifications
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Relasi ke User Bookmarks
     */
    public function bookmarks(): HasMany
    {
        return $this->hasMany(UserBookmark::class);
    }
}
