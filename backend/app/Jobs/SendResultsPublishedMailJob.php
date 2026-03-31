<?php

namespace App\Jobs;

use App\Mail\ResultsPublishedMail;
use App\Models\Election;
use App\Models\EmailLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendResultsPublishedMailJob implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    public int $tries = 3;

    public function __construct(public readonly Election $election)
    {
        $this->onQueue('emails');
    }

    public function handle(): void
    {
        // Notify all org admins of the election's organization
        $this->election->load('organization');

        $this->election->organization->admins()->each(function ($admin) {
            try {
                Mail::to($admin->email)->send(
                    new ResultsPublishedMail($admin, $this->election)
                );

                EmailLog::record(
                    ResultsPublishedMail::class,
                    $admin->email,
                    'Results Published: ' . $this->election->name,
                    $this->election->id,
                    Election::class,
                );
            } catch (\Throwable $e) {
                EmailLog::recordFailure(
                    ResultsPublishedMail::class,
                    $admin->email,
                    $e->getMessage(),
                    $this->election->id,
                    Election::class,
                );
            }
        });
    }
}
