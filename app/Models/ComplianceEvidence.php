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
        'version',
        'is_current_version',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_current_version' => 'boolean',
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
     * Get version history for this evidence
     */
    public function history()
    {
        return $this->hasMany(ComplianceEvidenceHistory::class, 'evidence_id')
            ->orderBy('version', 'desc');
    }

    /**
     * Get specific version from history
     */
    public function getVersion(int $version)
    {
        return $this->history()
            ->where('version', $version)
            ->first();
    }

    /**
     * Create new version when evidence is updated
     */
    public function createNewVersion(array $data, ?string $changeNotes = null): self
    {
        $userId = Auth::id();
        
        // Store current version in history
        ComplianceEvidenceHistory::create([
            'evidence_id' => $this->id,
            'version' => $this->version,
            'evidence_type' => $this->evidence_type,
            'file_path' => $this->file_path,
            'description' => $this->description,
            'status' => $this->status,
            'verified_at' => $this->verified_at,
            'verified_by' => $this->verified_by,
            'verification_notes' => $this->verification_notes,
            'changed_by' => $userId,
            'change_notes' => $changeNotes,
        ]);

        // Increment version and update with new data
        $data['version'] = $this->version + 1;
        $data['is_current_version'] = true;
        
        $this->update($data);
        
        return $this;
    }

    /**
     * Rollback to specific version
     */
    public function rollbackToVersion(int $version, ?string $rollbackNotes = null): ?self
    {
        $historyEntry = $this->getVersion($version);
        
        if (!$historyEntry) {
            return null;
        }

        $userId = Auth::id();
        
        // Store current version before rollback
        ComplianceEvidenceHistory::create([
            'evidence_id' => $this->id,
            'version' => $this->version,
            'evidence_type' => $this->evidence_type,
            'file_path' => $this->file_path,
            'description' => $this->description,
            'status' => $this->status,
            'verified_at' => $this->verified_at,
            'verified_by' => $this->verified_by,
            'verification_notes' => $this->verification_notes,
            'changed_by' => $userId,
            'change_notes' => "Rollback from version {$this->version} to version {$version}. {$rollbackNotes}",
        ]);

        // Rollback to previous version (increment version number)
        $newVersion = $this->version + 1;
        
        $this->update([
            'evidence_type' => $historyEntry->evidence_type,
            'file_path' => $historyEntry->file_path,
            'description' => $historyEntry->description,
            'status' => $historyEntry->status,
            'verified_at' => $historyEntry->verified_at,
            'verified_by' => $historyEntry->verified_by,
            'verification_notes' => $historyEntry->verification_notes,
            'version' => $newVersion,
            'is_current_version' => true,
        ]);

        return $this;
    }

    /**
     * Get all versions with metadata
     */
    public function getAllVersions()
    {
        $versions = [
            [
                'version' => $this->version,
                'type' => 'current',
                'evidence_type' => $this->evidence_type,
                'file_path' => $this->file_path,
                'description' => $this->description,
                'status' => $this->status,
                'verified_at' => $this->verified_at,
                'verified_by' => $this->verified_by,
                'verification_notes' => $this->verification_notes,
                'changed_by' => $this->updated_by ?? null,
                'changed_at' => $this->updated_at,
                'change_notes' => null,
            ]
        ];

        // Add history entries
        foreach ($this->history as $history) {
            $versions[] = [
                'version' => $history->version,
                'type' => 'history',
                'evidence_type' => $history->evidence_type,
                'file_path' => $history->file_path,
                'description' => $history->description,
                'status' => $history->status,
                'verified_at' => $history->verified_at,
                'verified_by' => $history->verified_by,
                'verification_notes' => $history->verification_notes,
                'changed_by' => $history->changed_by,
                'changed_at' => $history->created_at,
                'change_notes' => $history->change_notes,
            ];
        }

        return $versions;
    }

    /**
     * Verify the evidence (with versioning)
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
     * Reject the evidence (with versioning)
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

