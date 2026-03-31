<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vote extends Model
{
    // Votes are append-only — no updated_at
    public $timestamps = false;

    protected static function booted(): void
    {
        // Votes must never be modified or deleted once written
        static::updating(fn () => throw new \RuntimeException('Vote records are immutable.'));
        static::deleting(fn () => throw new \RuntimeException('Vote records cannot be deleted.'));
    }

    protected $fillable = [
        'election_id',
        'post_id',
        'voter_id',
        'candidate_id',
        'organization_id',
        'vote_hash',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    public function voter(): BelongsTo
    {
        return $this->belongsTo(Voter::class);
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
