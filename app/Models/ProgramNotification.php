<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgramNotification extends Model
{
    protected $fillable = [
        'module_id',
        'user_id',
        'type',
        'title',
        'message',
        'recipients',
        'recipient_ids',
        'is_scheduled',
        'scheduled_at',
        'recipients_count',
        'is_read',
        'read_at',
        'data',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'data' => 'json',
        'recipient_ids' => 'array',
        'is_scheduled' => 'boolean',
        'scheduled_at' => 'datetime',
        'recipients_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function markAsRead()
    {
        $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
        return $this;
    }

    public static function createNotification($moduleId, $userId, $type, $title, $message, $data = null)
    {
        return self::create([
            'module_id' => $moduleId,
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);
    }
}
