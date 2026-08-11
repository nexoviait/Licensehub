<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'entity_type',
        'tin',
        'bin',
        'rjsc',
        'address',
        'email',
        'phone',
        'directors',
        'branches',
        'next_due',
        'next_due_label',
        'status',
        'logo',
        'assigned_user_ids',
    ];

    protected $casts = [
        'directors' => 'integer',
        'branches' => 'integer',
        'next_due' => 'date',
        'assigned_user_ids' => 'array',
    ];

    public function complianceEvents(): HasMany
    {
        return $this->hasMany(ComplianceEvent::class);
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(Reminder::class);
    }

    public function vaultDocuments(): HasMany
    {
        return $this->hasMany(VaultDocument::class);
    }

    public function taxFilings(): HasMany
    {
        return $this->hasMany(TaxFiling::class);
    }

    public function legalMatters(): HasMany
    {
        return $this->hasMany(LegalMatter::class);
    }

    public function engagements(): HasMany
    {
        return $this->hasMany(Engagement::class);
    }

    public function clientAccesses(): HasMany
    {
        return $this->hasMany(ClientAccess::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
