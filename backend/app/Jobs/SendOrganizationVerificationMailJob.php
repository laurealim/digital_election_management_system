<?php

namespace App\Jobs;

use App\Mail\OrganizationVerificationMail;
use App\Models\Organization;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;

class SendOrganizationVerificationMailJob implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    public int $tries = 3;

    public function __construct(public readonly Organization $organization)
    {
        $this->onQueue('emails');
    }

    public function handle(): void
    {
        // Generate a signed URL that verifies the organization email
        $verifyUrl = URL::temporarySignedRoute(
            'org.verify',
            now()->addHours(24),
            ['id' => $this->organization->id]
        );

        Mail::to($this->organization->email)->send(
            new OrganizationVerificationMail($this->organization, $verifyUrl)
        );
    }
}
