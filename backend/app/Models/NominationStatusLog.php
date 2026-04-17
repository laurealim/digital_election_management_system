<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NominationStatusLog extends Model
{
    // Append-only — no updated_at
    const UPDATED_AT = null;

    protected $fillable = [
        'nomination_id',
        'from_status',
        'to_status',
        'changed_by',
        'note',
    ];

    public function nomination(): BelongsTo
    {
        return $this->belongsTo(Nomination::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}