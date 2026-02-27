<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'passing_grade',
        'state_history',
        'certificate_issued_at',
        'prerequisites_met',
        'compliance_status',
        'escalation_level',
        'escalated_at',
    ];

    protected $casts = [
        'is_certified' => 'boolean',
        'enrolled_at' => 'datetime',
        'completed_at' => 'datetime',
        'certificate_issued_at' => 'datetime',
        'escalated_at' => 'datetime',
        'prerequisites_met' => 'boolean',
        'state_history' => 'json',
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
     * Relasi ke Compliance Audit Logs
     */
    public function complianceAuditLogs(): HasMany
    {
        return $this->hasMany(ComplianceAuditLog::class);
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
        return $query->where('is_certified', 1);
    }

    /**
     * Scope untuk non-compliant enrollments
     */
    public function scopeNonCompliant($query)
    {
        return $query->where('compliance_status', 'non_compliant');
    }

    /**
     * Scope untuk get escalated trainings
     */
    public function scopeEscalated($query)
    {
        return $query->where('escalation_level', '>', 0);
    }

    /**
     * Get state history as array
     */
    public function getStateHistoryArray(): array
    {
        return json_decode($this->state_history ?? '[]', true) ?? [];
    }

    /**
     * Check if enrollment can transition to given state
     */
    public function canTransitionTo(string $newState): bool
    {
        $validTransitions = \App\Services\EnrollmentService::VALID_STATE_TRANSITIONS;
        $allowedStates = $validTransitions[$this->status] ?? [];
        return in_array($newState, $allowedStates);
    }

    /**
     * Get allowed state transitions
     */
    public function getAllowedTransitions(): array
    {
        $validTransitions = \App\Services\EnrollmentService::VALID_STATE_TRANSITIONS;
        return $validTransitions[$this->status] ?? [];
    }

    /**
     * Check if enrollment is compliant
     */
    public function isCompliant(): bool
    {
        return $this->compliance_status === 'compliant';
    }

    /**
     * Check if certificate can be issued
     */
    public function canIssueCertificate(): bool
    {
        return !$this->is_certified
            && $this->status === 'completed'
            && $this->final_score !== null
            && $this->final_score >= ($this->passing_grade ?? 70)
            && $this->prerequisites_met;
    }
}

