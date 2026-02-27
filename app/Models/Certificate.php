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

        // Prefer authoritative final score from user_trainings if present
        $userTraining = \App\Models\UserTraining::where('user_id', $userId)
            ->where('module_id', $moduleId)
            ->first();

        $finalScore = null;
        if ($userTraining && $userTraining->final_score !== null) {
            $finalScore = $userTraining->final_score;
        } elseif ($posttest && isset($posttest->percentage)) {
            $finalScore = $posttest->percentage;
        } elseif ($pretest && isset($pretest->percentage)) {
            $finalScore = $pretest->percentage;
        } else {
            // Fallback to average of available scores (if any)
            $scores = [];
            if ($pretest && isset($pretest->percentage)) $scores[] = $pretest->percentage;
            if ($posttest && isset($posttest->percentage)) $scores[] = $posttest->percentage;
            $finalScore = count($scores) > 0 ? array_sum($scores) / count($scores) : 0;
        }

        $finalScore = is_numeric($finalScore) ? round($finalScore) : 0;

        // Count materials (use training_materials table if present)
        $materialsCount = \App\Models\TrainingMaterial::where('module_id', $moduleId)->count();
        if ($materialsCount === 0) {
            // fallback: treat at least 1 material to avoid division by zero elsewhere
            $materialsCount = 1;
        }

        // Count completed materials for this user
        $materialsCompleted = \App\Models\UserMaterialProgress::where('user_id', $userId)
            ->whereIn('training_material_id', \App\Models\TrainingMaterial::where('module_id', $moduleId)->pluck('id')->toArray())
            ->where('is_completed', true)
            ->count();

        // Calculate hours
        $hours = ceil(($module->duration_minutes ?? 60) / 60);

        // Get instructor name
        $instructor = $module->instructor_id ? User::find($module->instructor_id) : null;
        $instructorName = $instructor ? $instructor->name : 'Admin LMS';

        // Build metadata as array (model casts it)
        $meta = [
            'pretest_score' => $pretest ? $pretest->score : null,
            'posttest_score' => $posttest ? $posttest->score : null,
            'duration_minutes' => $module->duration_minutes,
            'materials_total' => $materialsCount,
            'materials_completed' => $materialsCompleted,
        ];

        // Create certificate (use final computed score)
        // Ensure training_title has a fallback
        $trainingTitle = trim($module->title ?? '') ?: 'Program Pelatihan';
        
        \Log::info('Creating certificate', [
            'user_id' => $userId,
            'module_id' => $moduleId,
            'module_title' => $module->title,
            'training_title' => $trainingTitle,
            'final_score' => $finalScore,
        ]);
        
        $certificate = self::create([
            'user_id' => $userId,
            'module_id' => $moduleId,
            'certificate_number' => self::generateCertificateNumber($userId, $moduleId),
            'user_name' => $user->name,
            'training_title' => $trainingTitle,
            'score' => $finalScore,
            'materials_completed' => $materialsCompleted,
            'hours' => $hours,
            'issued_at' => now(),
            'completed_at' => now(),
            'instructor_name' => $instructorName,
            'status' => 'active',
            'metadata' => $meta,
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
