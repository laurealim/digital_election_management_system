<?php

namespace App\Listeners;

use App\Events\ElectionCompleted;
use App\Jobs\SendResultsPublishedMailJob;

class PublishElectionResults
{
    public function handle(ElectionCompleted $event): void
    {
        $event->election->update(['is_result_published' => true]);

        SendResultsPublishedMailJob::dispatch($event->election);
    }
}
