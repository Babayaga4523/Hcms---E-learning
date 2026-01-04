<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Reminder extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'message',
        'recipient_count',
        'sent_count',
        'opened_count',
        'status',
        'scheduled_at',
        'sent_at',
        'department_id',
        'created_by',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the department this reminder belongs to
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the users this reminder is sent to
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'reminder_user')
            ->withPivot('opened_at')
            ->withTimestamps();
    }

    /**
     * Get the user who created this reminder
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
