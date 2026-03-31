<?php

namespace App\Listeners;

use App\Events\VoteCast;
use App\Models\AuditLog;

class LogVoteCast
{
    public function handle(VoteCast $event): void
    {
        AuditLog::create([
            'organization_id' => $event->election->organization_id,
            'election_id'     => $event->election->id,
            'user_id'         => $event->voter->user_id,
            'event'           => 'vote_cast',
            'payload'         => [
                'voter_id'   => $event->voter->id,
                'vote_ids'   => $event->voteIds,
            ],
            'ip_address'      => $event->ipAddress,
            'user_agent'      => $event->userAgent,
            'created_at'      => now(),
        ]);
    }
}
