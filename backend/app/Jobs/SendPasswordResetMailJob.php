<?php

namespace App\Jobs;

use App\Mail\PasswordResetMail;
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
        Mail::to($this->user->email)->send(
            new PasswordResetMail($this->user, $this->token, $this->type)
        );
    }
}
