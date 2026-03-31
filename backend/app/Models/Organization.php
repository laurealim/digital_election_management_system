<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'email',
        'phone',
        'address',
        'email_verified_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_active'         => 'boolean',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function elections(): HasMany
    {
        return $this->hasMany(Election::class);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isVerified(): bool
    {
        return $this->email_verified_at !== null;
    }

    public function admins(): HasMany
    {
        return $this->hasMany(User::class)->role('org_admin');
    }
}
