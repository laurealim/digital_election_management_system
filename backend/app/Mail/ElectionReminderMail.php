<?php

namespace App\Mail;

use App\Models\Election;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ElectionReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $loginUrl;

    public function __construct(
        public readonly User $user,
        public readonly Election $election,
    ) {
        $this->loginUrl = rtrim(config('app.frontend_url'), '/') . '/login';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reminder: ' . $this->election->name . ' starts soon',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.election-reminder',
        );
    }
}
