<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LegalMatter extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'title',
        'matter_type',
        'lawyer',
        'priority',
        'status',
        'next_hearing',
    ];

    protected $casts = [
        'next_hearing' => 'date:Y-m-d',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
