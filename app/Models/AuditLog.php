<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    public $timestamps = false; // Kita hanya punya logged_at
    protected $table = 'audit_logs';

    protected $fillable = [
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'changes',
        'ip_address',
        'logged_at',
    ];

    protected $casts = [
        'changes' => 'json',
        'logged_at' => 'datetime',
    ];

    /**
     * Relasi ke User
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope untuk filter berdasarkan action
     */
    public function scopeAction($query, $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope untuk filter berdasarkan entity
     */
    public function scopeEntity($query, $type, $id)
    {
        return $query->where('entity_type', $type)->where('entity_id', $id);
    }
}
