<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Election;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;

class EmailDispatchController extends ApiController
{
    /**
     * POST /api/v1/elections/{election}/trigger-email-dispatch
     * Triggers the n8n webhook to send all pending emails for this election's org.
     */
    public function trigger(Election $election): JsonResponse
    {
        $this->authorize('update', $election);

        $webhookUrl = config('services.n8n.webhook_url');

        if (! $webhookUrl) {
            return $this->error('Email dispatch service is not configured.', 503);
        }

        $response = Http::timeout(10)->post($webhookUrl, [
            'organization_id' => $election->organization_id,
            'election_id'     => $election->id,
        ]);

        if ($response->failed()) {
            return $this->error('Failed to trigger email dispatch. Please try again.', 502);
        }

        return $this->success(null, 'Email dispatch triggered successfully.');
    }
}