<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComplianceAuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_training_id',
        'action',
        'old_value',
        'new_value',
        'triggered_by',
        'reason',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relasi ke UserTraining
     */
    public function userTraining(): BelongsTo
    {
        return $this->belongsTo(UserTraining::class);
    }

    /**
     * Relasi ke User (who triggered the change)
     */
    public function triggeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'triggered_by');
    }

    /**
     * Scope for recent logs
     */
    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Scope for specific action
     */
    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }
}
