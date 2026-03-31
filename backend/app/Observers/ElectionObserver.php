<?php

namespace App\Observers;

use App\Jobs\StartElectionJob;
use App\Jobs\StopElectionJob;
use App\Models\Election;

class ElectionObserver
{
    /**
     * When an election is saved and its status transitions to 'scheduled',
     * dispatch delayed jobs to automatically start and stop it at the right time.
     */
    public function saved(Election $election): void
    {
        if (! $election->wasChanged('status')) {
            return;
        }

        if ($election->status !== 'scheduled') {
            return;
        }

        $startAt = $election->votingStartsAt();
        $endAt   = $election->votingEndsAt();
        $now     = now('Asia/Dhaka');

        // Only dispatch if the start time is still in the future
        if ($startAt->gt($now)) {
            StartElectionJob::dispatch($election)->onQueue('elections')->delay($startAt);
        }

        if ($endAt->gt($now)) {
            StopElectionJob::dispatch($election)->onQueue('elections')->delay($endAt);
        }
    }
}
