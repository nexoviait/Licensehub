<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
include_once __DIR__ . '/Company.php';
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'number',
        'amount',
        'issue_date',
        'due_date',
        'status',
    ];

    protected $casts = [
        'amount' => 'float',
        'issue_date' => 'date:Y-m-d',
        'due_date' => 'date:Y-m-d',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
