<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingMaterial extends Model
{
    use HasFactory;
    protected $fillable = [
        'module_id',
        'title',
        'description',
        'file_type',
        'file_path',
        'pdf_path',
        'file_name',
        'file_size',
        'duration_minutes',
        'order',
        'version',
        'uploaded_by',
        // Support external links
        'external_url',
    ];

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getUrlAttribute()
    {
        if ($this->external_url) {
            return $this->external_url;
        }
        if ($this->file_path) {
            // Use secure serving for all files
            return route('user.material.serve', ['trainingId' => $this->module_id, 'materialId' => $this->id]);
        }
        return null;
    }
}