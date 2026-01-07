<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Certificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'module_id',
        'certificate_number',
        'user_name',
        'training_title',
        'score',
        'materials_completed',
        'hours',
        'issued_at',
        'completed_at',
        'instructor_name',
        'status',
        'metadata',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'completed_at' => 'datetime',
        'metadata' => 'array',
    ];

    /**
     * Get the user that owns the certificate
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the module/training for this certificate
     */
    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    /**
     * Generate a unique certificate number
     */
    public static function generateCertificateNumber($userId = null, $moduleId = null)
    {
        $year = date('Y');
        $month = date('m');
        $userPad = str_pad($userId ?? rand(1, 9999), 4, '0', STR_PAD_LEFT);
        $modulePad = str_pad($moduleId ?? rand(1, 999), 3, '0', STR_PAD_LEFT);
        $random = strtoupper(substr(md5(uniqid()), 0, 4));
        
        return "CERT-{$year}{$month}-{$userPad}-{$modulePad}-{$random}";
    }

    /**
     * Create certificate for a user who completed training
     */
    public static function createForUser($userId, $moduleId)
    {
        $user = User::find($userId);
        $module = Module::find($moduleId);
        
        if (!$user || !$module) {
            return null;
        }

        // Check if certificate already exists
        $existing = self::where('user_id', $userId)->where('module_id', $moduleId)->first();
        if ($existing) {
            return $existing;
        }

        // Get exam attempts to calculate score
        $pretest = ExamAttempt::where('user_id', $userId)
            ->where('module_id', $moduleId)
            ->where('exam_type', 'pre_test')
            ->where('is_passed', true)
            ->orderBy('created_at', 'desc')
            ->first();
            
        $posttest = ExamAttempt::where('user_id', $userId)
            ->where('module_id', $moduleId)
            ->where('exam_type', 'post_test')
            ->where('is_passed', true)
            ->orderBy('created_at', 'desc')
            ->first();

        // Calculate average score
        $scores = [];
        if ($pretest) $scores[] = $pretest->score;
        if ($posttest) $scores[] = $posttest->score;
        $avgScore = count($scores) > 0 ? array_sum($scores) / count($scores) : 0;

        // Count materials
        $materialsCount = 0;
        if ($module->video_url) $materialsCount++;
        if ($module->document_url) $materialsCount++;
        if ($module->presentation_url) $materialsCount++;
        if ($materialsCount === 0) $materialsCount = 1;

        // Calculate hours
        $hours = ceil(($module->duration_minutes ?? 60) / 60);

        // Get instructor name
        $instructor = $module->instructor_id ? User::find($module->instructor_id) : null;
        $instructorName = $instructor ? $instructor->name : 'Admin LMS';

        // Create certificate
        $certificate = self::create([
            'user_id' => $userId,
            'module_id' => $moduleId,
            'certificate_number' => self::generateCertificateNumber($userId, $moduleId),
            'user_name' => $user->name,
            'training_title' => $module->title,
            'score' => round($avgScore),
            'materials_completed' => $materialsCount,
            'hours' => $hours,
            'issued_at' => now(),
            'completed_at' => now(),
            'instructor_name' => $instructorName,
            'status' => 'active',
            'metadata' => json_encode([
                'pretest_score' => $pretest ? $pretest->score : null,
                'posttest_score' => $posttest ? $posttest->score : null,
                'duration_minutes' => $module->duration_minutes,
            ]),
        ]);

        // Update user_trainings with certificate_id
        DB::table('user_trainings')
            ->where('user_id', $userId)
            ->where('module_id', $moduleId)
            ->update(['certificate_id' => $certificate->id]);

        return $certificate;
    }

    /**
     * Scope for valid (active) certificates
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
