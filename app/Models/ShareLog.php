<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShareLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'subject',
        'recipients',
        'body',
        'attachments',
        'sent_at',
        'status',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
