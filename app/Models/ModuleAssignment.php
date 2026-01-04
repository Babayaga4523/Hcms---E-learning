<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModuleAssignment extends Model
{
    protected $fillable = [
        'module_id',
        'user_id',
        'department',
        'assigned_date',
        'due_date',
        'status',
    ];

    protected $casts = [
        'assigned_date' => 'date',
        'due_date' => 'date',
    ];

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
