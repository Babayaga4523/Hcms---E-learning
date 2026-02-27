<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserPoints extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'activity_type',
        'points',
        'module_id',
        'exam_attempt_id',
        'description',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'json',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function examAttempt()
    {
        return $this->belongsTo(ExamAttempt::class, 'exam_attempt_id');
    }
}
