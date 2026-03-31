<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends \App\Models\TenantModel
{
    use HasFactory;

    protected $fillable = [
        'election_id',
        'organization_id',
        'title',
        'description',
        'max_votes',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'max_votes' => 'integer',
            'order'     => 'integer',
        ];
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

    public function candidates(): HasMany
    {
        return $this->hasMany(Candidate::class);
    }
}
