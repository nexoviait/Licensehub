<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaxFiling extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'tax_type',
        'period',
        'amount',
        'due_date',
        'status',
        'reference',
    ];

    protected $casts = [
        'amount' => 'float',
        'due_date' => 'date:Y-m-d',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
