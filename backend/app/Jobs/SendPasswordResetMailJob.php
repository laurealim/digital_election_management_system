<?php

namespace App\Jobs;

use App\Mail\PasswordResetMail;
use App\Models\EmailOutbox;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendPasswordResetMailJob implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public readonly User $user,
        public readonly string $token,
        public readonly string $type, // 'reset' or 'setup'
    ) {
        $this->onQueue('emails');
    }

    public function handle(): void
    {
        $mail = new PasswordResetMail($this->user, $this->token, $this->type);

        // Save full email to outbox before sending so it can be resent via SMS/other channel if mail is down
        EmailOutbox::create([
            'type'       => $this->type === 'setup' ? 'setup_password' : 'password_reset',
            'to_address' => $this->user->email,
            'subject'    => $mail->envelope()->subject,
            'body'       => $mail->render(),
            'reference_id'    => $this->user->id,
            'organization_id' => $this->user->organization_id,
            'status'     => 'pending',
        ]);

        Mail::to($this->user->email)->send($mail);
    }
}
