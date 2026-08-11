<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExportRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_name',
        'format',
        'generated_by',
        'generated_at',
        'size',
        'file_path',
    ];
}
