<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingDiscussion extends Model
{
    protected $fillable = [
        'module_id',
        'user_id',
        'question',
        'answer',
        'answered_by',
        'helpful_count',
        'is_pinned',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
    ];

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function answeredBy()
    {
        return $this->belongsTo(User::class, 'answered_by');
    }
}
