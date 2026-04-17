<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Nomination extends \App\Models\TenantModel
{
    protected $fillable = [
        'election_id',
        'organization_id',
        'token_number',
        'name',
        'email',
        'mobile',
        'organization_name',
        'father_name',
        'mother_name',
        'nid',
        'designation',
        'address',
        'status',
        'rejection_reason',
        'payment_status',
        'payment_verified_at',
        'approved_by',
    ];

    protected function casts(): array
    {
        return [
            'payment_status'      => 'boolean',
            'payment_verified_at' => 'datetime',
        ];
    }

    // ─── Token Generation ─────────────────────────────────────────────────────

    /**
     * Generate a unique 8-character uppercase hex token.
     * Uses cryptographically random bytes; retries on collision.
     */
    public static function generateToken(): string
    {
        do {
            $token = strtoupper(bin2hex(random_bytes(4)));
        } while (static::withoutGlobalScopes()->where('token_number', $token)->exists());

        return $token;
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function posts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'nomination_posts');
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(NominationStatusLog::class)->orderBy('id');
    }

    // ─── Status Helpers ───────────────────────────────────────────────────────

    public function isPending(): bool   { return $this->status === 'pending'; }
    public function isVerified(): bool  { return $this->status === 'verified'; }
    public function isRejected(): bool  { return $this->status === 'rejected'; }
    public function isAccepted(): bool  { return $this->status === 'accepted'; }

    /**
     * Log a status transition. Call AFTER updating status on the model.
     */
    public function logTransition(?string $fromStatus, ?int $changedBy = null, ?string $note = null): void
    {
        $this->statusLogs()->create([
            'from_status' => $fromStatus,
            'to_status'   => $this->status,
            'changed_by'  => $changedBy,
            'note'        => $note,
        ]);
    }
}