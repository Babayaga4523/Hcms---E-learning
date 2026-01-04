<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'training_program_id',
        'certificate_number',
        'final_score',
        'materials_completed',
        'learning_hours',
        'issued_at',
        'completed_at',
        'expires_at',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'completed_at' => 'datetime',
        'expires_at' => 'datetime',
        'final_score' => 'integer',
        'materials_completed' => 'integer',
        'learning_hours' => 'decimal:2',
    ];

    /**
     * Get the user that owns the certificate
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the training program for the certificate
     */
    public function trainingProgram()
    {
        return $this->belongsTo(TrainingProgram::class);
    }

    /**
     * Generate a unique certificate number
     */
    public static function generateCertificateNumber()
    {
        $prefix = 'CERT';
        $year = date('Y');
        $random = strtoupper(substr(md5(uniqid()), 0, 6));
        
        return "{$prefix}-{$year}-{$random}";
    }

    /**
     * Scope for valid (non-expired) certificates
     */
    public function scopeValid($query)
    {
        return $query->where(function($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', now());
        });
    }
}
