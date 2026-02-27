<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ComplianceEvidenceHistory extends Model
{
    protected $table = 'compliance_evidence_history';

    protected $fillable = [
        'evidence_id',
        'version',
        'evidence_type',
        'file_path',
        'description',
        'status',
        'verified_at',
        'verified_by',
        'verification_notes',
        'changed_by',
        'change_notes',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function evidence()
    {
        return $this->belongsTo(ComplianceEvidence::class);
    }

    public function changedByUser()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }

    public function verifiedByUser()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
