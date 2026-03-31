<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Voter extends \App\Models\TenantModel
{
    use HasFactory;

    protected $fillable = [
        'election_id',
        'user_id',
        'organization_id',
        'has_voted',
        'voted_at',
        'invitation_sent_at',
        'invitation_status',
    ];

    protected function casts(): array
    {
        return [
            'has_voted'           => 'boolean',
            'voted_at'            => 'datetime',
            'invitation_sent_at'  => 'datetime',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
