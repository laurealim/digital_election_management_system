<?php

namespace App\Jobs;

use App\Mail\ElectionReminderMail;
use App\Models\Election;
use App\Models\EmailLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendElectionReminderJob implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    public int $tries = 3;

    public function __construct(public readonly Election $election)
    {
        $this->onQueue('emails');
    }

    public function handle(): void
    {
        // Send reminder to every voter who has not yet voted
        $this->election->voters()
            ->where('has_voted', false)
            ->with('user')
            ->each(function ($voter) {
                try {
                    Mail::to($voter->user->email)->send(
                        new ElectionReminderMail($voter->user, $this->election)
                    );

                    EmailLog::record(
                        ElectionReminderMail::class,
                        $voter->user->email,
                        'Reminder: ' . $this->election->name . ' starts soon',
                        $this->election->id,
                        Election::class,
                    );
                } catch (\Throwable $e) {
                    EmailLog::recordFailure(
                        ElectionReminderMail::class,
                        $voter->user->email,
                        $e->getMessage(),
                        $this->election->id,
                        Election::class,
                    );
                }
            });
    }
}
