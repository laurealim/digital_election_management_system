<?php

namespace App\Jobs;

use App\Mail\VoterInvitationMail;
use App\Models\Election;
use App\Models\EmailLog;
use App\Models\EmailOutbox;
use App\Models\User;
use App\Models\Voter;
use App\Services\PasswordResetService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendVoterInvitationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public readonly User $user,
        public readonly Election $election,
        public readonly Voter $voter,
    ) {
        $this->onQueue('emails');
    }

    public function handle(PasswordResetService $passwordResetService): void
    {
        // Generate a setup token so the voter can set their password
        $token = $passwordResetService->generateToken($this->user->email, 'setup');

        $mail = new VoterInvitationMail($this->user, $this->election, $token);

        // Save full email to outbox before sending so it can be resent via SMS/other channel if mail is down
        EmailOutbox::create([
            'type'            => 'voter_invitation',
            'to_address'      => $this->user->email,
            'subject'         => $mail->envelope()->subject,
            'body'            => $mail->render(),
            'reference_id'    => $this->voter->id,
            'organization_id' => $this->voter->organization_id,
            'status'          => 'pending',
        ]);

        Mail::to($this->user->email)->send($mail);

        EmailLog::record(
            VoterInvitationMail::class,
            $this->user->email,
            'You have been invited to vote',
            $this->election->id,
            Election::class,
        );

        // Record send time and mark as sent
        $this->voter->update([
            'invitation_sent_at' => now(),
            'invitation_status'  => 'sent',
        ]);
    }

    /**
     * Called by Laravel when a queued job fails after all retries.
     */
    public function failed(\Throwable $exception): void
    {
        $this->voter->update(['invitation_status' => 'failed']);
    }
}
