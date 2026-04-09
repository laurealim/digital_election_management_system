<?php

namespace App\Mail;

use App\Models\Election;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResultsPublishedMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $resultsUrl;

    public function __construct(
        public readonly User $user,
        public readonly Election $election,
    ) {
        $this->resultsUrl = rtrim(config('app.frontend_url'), '/')
            . '/elections/' . $this->election->id . '/results';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'নির্বাচনের ফলাফল প্রকাশিত — ' . $this->election->name,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.results-published',
        );
    }
}
