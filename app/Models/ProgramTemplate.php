<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgramTemplate extends Model
{
    protected $fillable = [
        'name',
        'description',
        'category',
        'structure',
        'questions_template',
        'created_by',
        'is_active',
        'usage_count',
    ];

    protected $casts = [
        'structure' => 'json',
        'questions_template' => 'json',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function use()
    {
        $this->increment('usage_count');
        return $this;
    }

    public static function getCategories()
    {
        return [
            'Compliance' => 'Program Kepatuhan',
            'Technical' => 'Program Teknis',
            'HR' => 'Program SDM',
            'Sales' => 'Program Penjualan',
            'Leadership' => 'Program Kepemimpinan',
            'Custom' => 'Kustom',
        ];
    }
}
