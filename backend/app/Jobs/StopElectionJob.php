<?php

namespace App\Jobs;

use App\Events\ElectionCompleted;
use App\Models\Election;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class StopElectionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Election $election) {}

    public function handle(): void
    {
        $election = Election::find($this->election->id);

        if (! $election || $election->status !== 'active') {
            return;
        }

        $now = now('Asia/Dhaka');

        if ($now->lt($election->votingEndsAt())) {
            return;
        }

        $election->update([
            'status'       => 'completed',
            'completed_at' => now(),
        ]);

        event(new ElectionCompleted($election));
    }
}
