<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VaultDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'name',
        'category',
        'size',
        'uploaded_at',
        'starred',
        'confidential',
        'ext',
        'file_path',
    ];

    protected $casts = [
        'uploaded_at' => 'date:Y-m-d',
        'starred' => 'boolean',
        'confidential' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
