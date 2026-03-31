<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    protected $fillable = [
        'organization_id',
        'name',
        'email',
        'mobile',
        'office_name',
        'designation',
        'password',
        'password_set_at',
        'is_active',
        'setup_email_status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password_set_at'   => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function voters(): HasMany
    {
        return $this->hasMany(Voter::class);
    }

    public function candidates(): HasMany
    {
        return $this->hasMany(Candidate::class);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function hasSetPassword(): bool
    {
        return $this->password_set_at !== null;
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super_admin');
    }

    public function isOrgAdmin(): bool
    {
        return $this->hasRole('org_admin');
    }

    public function isOrgUser(): bool
    {
        return $this->hasRole('org_user');
    }

    public function isElectionAdmin(): bool
    {
        return $this->hasRole('election_admin');
    }

    public function isElectionUser(): bool
    {
        return $this->hasRole('election_user');
    }

    public function isVoter(): bool
    {
        return $this->hasRole('voter');
    }

    public function isCandidate(): bool
    {
        return $this->hasRole('candidate');
    }

    /** Any org-level management role (admin or user). */
    public function isOrgManager(): bool
    {
        return $this->hasAnyRole(['super_admin', 'org_admin', 'org_user']);
    }

    /** Any role that can manage election-level resources. */
    public function isElectionManager(): bool
    {
        return $this->hasAnyRole(['super_admin', 'org_admin', 'org_user', 'election_admin', 'election_user']);
    }
}
