<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AdminAuditLog extends Model
{
    protected $table = 'admin_audit_logs';
    protected $fillable = [
        'admin_id',
        'admin_name',
        'action',
        'target_type',
        'target_id',
        'field_name',
        'old_value',
        'new_value',
        'metadata',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'metadata' => 'json',
        'created_at' => 'datetime',
    ];

    public $timestamps = false;

    /**
     * Get the admin user
     */
    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    /**
     * Add a new audit log entry
     */
    public static function log($action, $data = [])
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();
        $request = request();

        return self::create([
            'admin_id' => $user?->id,
            'admin_name' => $user?->name ?? 'Unknown',
            'action' => $action,
            'target_type' => $data['target_type'] ?? null,
            'target_id' => $data['target_id'] ?? null,
            'field_name' => $data['field_name'] ?? null,
            'old_value' => $data['old_value'] ?? null,
            'new_value' => $data['new_value'] ?? null,
            'metadata' => $data['metadata'] ?? null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }
}
