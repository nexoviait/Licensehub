<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComplianceEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'type',
        'title',
        'status',
        'assignee',
        'date',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
