<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Engagement extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'engagement_type',
        'accountant',
        'fee',
        'status',
        'next_milestone',
        'next_milestone_date',
    ];

    protected $casts = [
        'fee' => 'float',
        'next_milestone_date' => 'date:Y-m-d',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
