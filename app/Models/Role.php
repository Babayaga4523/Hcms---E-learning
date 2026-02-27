<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permissions');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_roles')
            ->withPivot('assigned_at', 'assigned_by', 'active')
            ->withTimestamps();
    }

    /**
     * Department compatibility constraints
     */
    public function departmentCompatibility(): HasMany
    {
        return $this->hasMany(RoleDepartmentCompatibility::class);
    }

    /**
     * Role permission sync logs
     */
    public function permissionSyncLogs(): HasMany
    {
        return $this->hasMany(RolePermissionSyncLog::class);
    }

    /**
     * Check if role has permission
     */
    public function hasPermission($permission)
    {
        return $this->permissions()
            ->where('slug', $permission)
            ->exists();
    }

    /**
     * Check if role is department restricted
     */
    public function isDepartmentRestricted(): bool
    {
        return $this->departmentCompatibility()
            ->where('is_restricted', true)
            ->exists();
    }

    /**
     * Get allowed departments for this role
     */
    public function getAllowedDepartments()
    {
        return $this->departmentCompatibility()
            ->where('is_restricted', true)
            ->with('allowedDepartment')
            ->get()
            ->pluck('allowedDepartment');
    }

    /**
     * Check if role can be assigned to a department
     */
    public function canAssignToDepartment($departmentId): bool
    {
        if (!$this->isDepartmentRestricted()) {
            return true;
        }

        return $this->departmentCompatibility()
            ->where('allowed_department_id', $departmentId)
            ->where('is_restricted', true)
            ->exists();
    }

    /**
     * Get all active users with this role
     */
    public function activeUsers()
    {
        return $this->users()
            ->wherePivot('active', true);
    }

    /**
     * Scope for active roles
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}

