<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'head_id',
        'parent_id',
        'level',
        'path',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Relasi ke Users
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Relasi ke Department Head
     */
    public function head(): BelongsTo
    {
        return $this->belongsTo(User::class, 'head_id');
    }

    /**
     * Relasi ke Parent Department (hierarchy)
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'parent_id');
    }

    /**
     * Relasi ke Child Departments (hierarchy)
     */
    public function children(): HasMany
    {
        return $this->hasMany(Department::class, 'parent_id');
    }

    /**
     * Get all ancestors (parents, grandparents, etc)
     */
    public function getAncestors()
    {
        $ancestors = collect();
        $current = $this;

        while ($current->parent) {
            $ancestors->push($current->parent);
            $current = $current->parent;
        }

        return $ancestors;
    }

    /**
     * Get all descendants (children, grandchildren, etc)
     */
    public function getDescendants()
    {
        $descendants = collect();

        foreach ($this->children as $child) {
            $descendants->push($child);
            $descendants = $descendants->merge($child->getDescendants());
        }

        return $descendants;
    }

    /**
     * Get hierarchy path as breadcrumb
     */
    public function getBreadcrumb(): array
    {
        $path = [];
        $current = $this;

        while ($current) {
            array_unshift($path, $current->name);
            $current = $current->parent;
        }

        return $path;
    }

    /**
     * Scope for root departments (no parent)
     */
    public function scopeRoot($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Scope for active departments
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get all users including subordinate departments
     */
    public function getAllUsers()
    {
        $departments = collect([$this])->merge($this->getDescendants());
        return User::whereIn('department_id', $departments->pluck('id'))->get();
    }
}
