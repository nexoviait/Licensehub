<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientAccess extends Model
{
    use HasFactory;

    protected $table = 'client_accesses';

    protected $fillable = [
        'company_id',
        'contact_name',
        'contact_email',
        'role',
        'status',
        'last_login',
        'documents_shared',
    ];

    protected $casts = [
        'documents_shared' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
