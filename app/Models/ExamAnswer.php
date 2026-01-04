<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_attempt_id',
        'question_id',
        'answer',
        'is_correct',
        'points_earned',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'points_earned' => 'integer',
    ];

    /**
     * Get the exam attempt that owns this answer
     */
    public function examAttempt()
    {
        return $this->belongsTo(ExamAttempt::class);
    }

    /**
     * Get the question for this answer
     */
    public function question()
    {
        return $this->belongsTo(Question::class);
    }
}
