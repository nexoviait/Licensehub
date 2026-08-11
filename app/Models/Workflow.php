<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Workflow extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'trigger',
        'action',
        'status',
        'runs',
        'last_run',
        'success_rate',
    ];

    protected $casts = [
        'runs' => 'integer',
        'success_rate' => 'integer',
    ];
}
