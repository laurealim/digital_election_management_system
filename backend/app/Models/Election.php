<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Election extends \App\Models\TenantModel
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'election_date',
        'voting_start_time',
        'voting_end_time',
        'status',
        'candidate_mode',
        'allow_multi_post',
        'is_result_published',
        'is_public_result',
        'is_public_voter_list',
        'is_live_display',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'election_date'          => 'date',
            'allow_multi_post'       => 'boolean',
            'is_result_published'    => 'boolean',
            'is_public_result'       => 'boolean',
            'is_public_voter_list'   => 'boolean',
            'is_live_display'        => 'boolean',
            'completed_at'           => 'datetime',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class)->orderBy('order');
    }

    public function voters(): HasMany
    {
        return $this->hasMany(Voter::class);
    }

    public function candidates(): HasMany
    {
        return $this->hasMany(Candidate::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }

    // ─── Status Helpers ───────────────────────────────────────────────────────

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isScheduled(): bool
    {
        return $this->status === 'scheduled';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    /**
     * Election is immutable once completed or cancelled.
     */
    public function isImmutable(): bool
    {
        return in_array($this->status, ['completed', 'cancelled']);
    }

    /**
     * Election can be edited (not yet started).
     */
    public function isEditable(): bool
    {
        return in_array($this->status, ['draft', 'scheduled']);
    }

    /**
     * Compute the full voting start datetime (date + time) as Carbon.
     */
    public function votingStartsAt(): \Carbon\Carbon
    {
        return \Carbon\Carbon::parse(
            $this->election_date->format('Y-m-d') . ' ' . $this->voting_start_time,
            'Asia/Dhaka'
        );
    }

    /**
     * Compute the full voting end datetime (date + time) as Carbon.
     */
    public function votingEndsAt(): \Carbon\Carbon
    {
        return \Carbon\Carbon::parse(
            $this->election_date->format('Y-m-d') . ' ' . $this->voting_end_time,
            'Asia/Dhaka'
        );
    }
}
