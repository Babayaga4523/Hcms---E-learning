<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class ComplianceEvidence extends Model
{
    protected $fillable = [
        'module_id',
        'user_id',
        'evidence_type',
        'file_path',
        'description',
        'status',
        'verified_at',
        'verified_by',
        'verification_notes',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function verifiedByUser()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /**
     * Verify the evidence
     */
    public function verify(?string $notes = null, ?User $verifier = null)
    {
        $verifierId = $verifier?->id ?? Auth::id();
        
        $this->update([
            'status' => 'verified',
            'verified_by' => $verifierId,
            'verification_notes' => $notes,
            'verified_at' => now(),
        ]);

        return $this;
    }

    /**
     * Reject the evidence
     */
    public function reject(?string $notes = null, ?User $verifier = null)
    {
        $verifierId = $verifier?->id ?? Auth::id();
        
        $this->update([
            'status' => 'rejected',
            'verified_by' => $verifierId,
            'verification_notes' => $notes,
            'verified_at' => now(),
        ]);

        return $this;
    }
}
