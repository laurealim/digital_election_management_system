<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $actionUrl;
    public string $mailSubject;

    public function __construct(
        public readonly User $user,
        public readonly string $token,
        public readonly string $type, // 'reset' or 'setup'
    ) {
        $route = $type === 'setup' ? 'setup-password' : 'reset-password';

        $this->actionUrl = config('app.frontend_url', env('FRONTEND_URL'))
            . "/{$route}?token={$token}&email=" . urlencode($user->email);

        $this->mailSubject = $type === 'setup'
            ? 'DEMS একাউন্ট সেটআপ — পাসওয়ার্ড নির্ধারণ করুন'
            : 'DEMS একাউন্ট — পাসওয়ার্ড রিসেট অনুরোধ';
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->mailSubject);
    }

    public function content(): Content
    {
        return new Content(view: 'mail.password-reset');
    }

    public function attachments(): array
    {
        return [];
    }
}
