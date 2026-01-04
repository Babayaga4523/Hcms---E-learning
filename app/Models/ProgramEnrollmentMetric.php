<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgramEnrollmentMetric extends Model
{
    protected $fillable = [
        'module_id',
        'metric_date',
        'total_enrolled',
        'completed',
        'in_progress',
        'not_started',
        'average_score',
    ];

    protected $casts = [
        'metric_date' => 'date',
        'average_score' => 'float',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function getCompletionRateAttribute()
    {
        return $this->total_enrolled > 0 ? round(($this->completed / $this->total_enrolled) * 100, 2) : 0;
    }

    public function getInProgressRateAttribute()
    {
        return $this->total_enrolled > 0 ? round(($this->in_progress / $this->total_enrolled) * 100, 2) : 0;
    }

    public static function recordMetrics($moduleId)
    {
        // This will be called daily via scheduled job
        $module = Module::find($moduleId);
        if (!$module) return;

        $totalEnrolled = $module->users()->count();
        $completed = $module->users()->where('status', 'completed')->count();
        $inProgress = $module->users()->where('status', 'in_progress')->count();
        $notStarted = $totalEnrolled - $completed - $inProgress;

        return self::create([
            'module_id' => $moduleId,
            'metric_date' => now()->date(),
            'total_enrolled' => $totalEnrolled,
            'completed' => $completed,
            'in_progress' => $inProgress,
            'not_started' => $notStarted,
            'average_score' => $module->users()->avg('score') ?? 0,
        ]);
    }
}
