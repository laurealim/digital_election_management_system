<?php

namespace App\Events;

use App\Models\Election;
use App\Models\Voter;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VoteCast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Voter $voter,
        public readonly Election $election,
        public readonly array $voteIds,   // IDs of the Vote records just created
        public readonly string $ipAddress,
        public readonly string $userAgent,
    ) {}
}
