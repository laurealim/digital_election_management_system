<?php

namespace App\Mail;

use App\Models\Election;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VoterInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $setupUrl;

    public function __construct(
        public readonly User $user,
        public readonly Election $election,
        public readonly string $token,
    ) {
        $this->setupUrl = config('app.frontend_url', env('FRONTEND_URL'))
            . '/setup-password?token=' . $token
            . '&email=' . urlencode($user->email);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'নির্বাচন-২০২৬: DEMS একাউন্ট সেটআপ করুন — ' . $this->election->name,
        );
    }

    public function content(): Content
    {
        return new Content(view: 'mail.voter-invitation');
    }

    public function attachments(): array
    {
        return [];
    }
}
