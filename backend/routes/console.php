<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Jobs\PublishElectionJob;
use App\Jobs\StartElectionJob;
use App\Jobs\StopElectionJob;
use App\Jobs\SendElectionReminderJob;
use App\Models\Election;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ─── Election Scheduler ───────────────────────────────────────────────────────
// Runs every minute — checks for elections that should start or stop right now.
// Individual start/stop jobs are also dispatched with delays when an election
// is scheduled, but this cron acts as a safety net for any missed dispatches.
Schedule::call(function () {
    $now = now();

    // Start elections whose scheduled start time has arrived
    Election::withoutGlobalScopes()
        ->where('status', 'scheduled')
        ->whereDate('election_date', $now->toDateString())
        ->whereTime('voting_start_time', '<=', $now->toTimeString())
        ->each(fn (Election $election) => StartElectionJob::dispatch($election));

    // Stop elections whose scheduled end time has passed
    Election::withoutGlobalScopes()
        ->where('status', 'active')
        ->whereDate('election_date', $now->toDateString())
        ->whereTime('voting_end_time', '<=', $now->toTimeString())
        ->each(fn (Election $election) => StopElectionJob::dispatch($election));

    // Auto-publish draft elections whose publish_at time has arrived
    Election::withoutGlobalScopes()
        ->where('status', 'draft')
        ->whereNotNull('publish_at')
        ->where('publish_at', '<=', $now)
        ->each(fn (Election $election) => PublishElectionJob::dispatch($election));

})->everyMinute()->name('election-lifecycle')->withoutOverlapping();

// ─── Election Reminder (24 h before voting opens) ─────────────────────────────
// Runs every minute — dispatches reminder job for elections starting in ~24 hours.
Schedule::call(function () {
    $windowStart = now()->addHours(24);
    $windowEnd   = now()->addHours(24)->addMinutes(1);

    Election::withoutGlobalScopes()
        ->where('status', 'scheduled')
        ->whereDate('election_date', $windowStart->toDateString())
        ->whereBetween('voting_start_time', [
            $windowStart->format('H:i:s'),
            $windowEnd->format('H:i:s'),
        ])
        ->each(fn (Election $election) => SendElectionReminderJob::dispatch($election));

})->everyMinute()->name('election-reminders')->withoutOverlapping();
