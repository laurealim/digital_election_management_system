<?php

namespace App\Observers;

use App\Jobs\PublishElectionJob;
use App\Jobs\StartElectionJob;
use App\Jobs\StopElectionJob;
use App\Models\Election;

class ElectionObserver
{
    /**
     * When an election is saved, dispatch lifecycle jobs based on status/field changes.
     */
    public function saved(Election $election): void
    {
        $statusChanged    = $election->wasChanged('status');
        $publishAtChanged = $election->wasChanged('publish_at');

        // ── Dispatch Start/Stop jobs when transitioning to 'scheduled' ─────────
        if ($statusChanged && $election->status === 'scheduled') {
            $startAt = $election->votingStartsAt();
            $endAt   = $election->votingEndsAt();
            $now     = now('Asia/Dhaka');

            if ($startAt->gt($now)) {
                StartElectionJob::dispatch($election)->onQueue('elections')->delay($startAt);
            }

            if ($endAt->gt($now)) {
                StopElectionJob::dispatch($election)->onQueue('elections')->delay($endAt);
            }
        }

        // ── Dispatch PublishElectionJob when publish_at is set on a draft ──────
        if (
            ($statusChanged || $publishAtChanged)
            && $election->status === 'draft'
            && $election->publish_at
            && $election->publish_at->gt(now('Asia/Dhaka'))
        ) {
            PublishElectionJob::dispatch($election)
                ->onQueue('elections')
                ->delay($election->publish_at);
        }
    }
}