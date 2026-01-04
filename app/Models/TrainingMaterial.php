<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingMaterial extends Model
{
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
    ];

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}