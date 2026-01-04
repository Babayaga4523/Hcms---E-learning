<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentUpload extends Model
{
    use HasFactory;

    protected $table = 'content_uploads';

    protected $fillable = [
        'title',
        'description',
        'file_path',
        'original_filename',
        'file_type',
        'file_size',
        'status',
        'progress',
        'conversion_type',
        'conversion_details',
        'conversion_completed_at',
        'error_message',
        'created_by',
    ];

    protected $casts = [
        'conversion_details' => 'json',
        'conversion_completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who uploaded this content
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
