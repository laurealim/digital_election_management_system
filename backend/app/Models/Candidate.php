<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Candidate extends \App\Models\TenantModel
{
    use HasFactory;

    protected $fillable = [
        'election_id',
        'post_id',
        'user_id',
        'organization_id',
        'bio',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function election(): BelongsTo
    {
        return $this->belongsTo(Election::class);
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
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
