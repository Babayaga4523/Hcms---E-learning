<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoleDepartmentCompatibility extends Model
{
    use HasFactory;

    protected $fillable = [
        'role_id',
        'allowed_department_id',
        'is_restricted',
        'notes',
    ];

    protected $casts = [
        'is_restricted' => 'boolean',
    ];

    /**
     * Relasi ke Role
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Relasi ke Department
     */
    public function allowedDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'allowed_department_id');
    }
}
