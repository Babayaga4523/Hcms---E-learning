<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class ProgramApproval extends Model
{
    protected $fillable = [
        'module_id',
        'status',
        'requested_by',
        'reviewed_by',
        'request_notes',
        'reviewer_notes',
        'requested_at',
        'reviewed_at',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Approve the program
     */
    public function approve(?string $notes = null, ?User $reviewer = null)
    {
        $reviewerId = $reviewer?->id ?? Auth::id();
        
        $this->update([
            'status' => 'approved',
            'reviewed_by' => $reviewerId,
            'reviewer_notes' => $notes,
            'reviewed_at' => now(),
        ]);

        $this->module()->update(['approval_status' => 'approved']);
        
        return $this;
    }

    /**
     * Reject the program
     */
    public function reject(?string $notes = null, ?User $reviewer = null)
    {
        $reviewerId = $reviewer?->id ?? Auth::id();
        
        $this->update([
            'status' => 'rejected',
            'reviewed_by' => $reviewerId,
            'reviewer_notes' => $notes,
            'reviewed_at' => now(),
        ]);

        $this->module()->update(['approval_status' => 'rejected']);
        
        return $this;
    }
}
