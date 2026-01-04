<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Material extends Model
{
    use HasFactory;

    protected $fillable = [
        'module_id',
        'title',
        'description',
        'type', // video, pdf, document, text, download
        'content',
        'file_url',
        'file_path',
        'file_size',
        'file_type',
        'duration', // in minutes
        'order',
        'is_required',
        'is_active',
    ];

    protected $casts = [
        'duration' => 'integer',
        'order' => 'integer',
        'is_required' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * Get the module that owns the material
     */
    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    /**
     * Get user progress for this material
     */
    public function userProgress()
    {
        return $this->hasMany(UserTrainingProgress::class);
    }

    /**
     * Scope for active materials
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for ordered materials
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order', 'asc');
    }
}
