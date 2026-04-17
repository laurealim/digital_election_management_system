<?php

namespace App\Jobs;

use App\Models\Election;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class StartElectionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Election $election) {}

    public function handle(): void
    {
        // Re-fetch to get the latest status — avoid race conditions
        $election = Election::withoutGlobalScopes()->find($this->election->id);

        if (! $election || $election->status !== 'scheduled') {
            return;
        }

        $now = now('Asia/Dhaka');

        // Double-check voting window has actually started
        if ($now->lt($election->votingStartsAt())) {
            return;
        }

        $election->update(['status' => 'active']);
    }
}
