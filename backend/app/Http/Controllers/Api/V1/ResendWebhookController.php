<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\User;
use App\Models\Voter;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ResendWebhookController extends ApiController
{
    /**
     * POST /api/v1/webhooks/resend
     *
     * Receives delivery events from Resend and updates invitation_status /
     * setup_email_status so the UI reflects real delivery outcomes.
     *
     * Events handled:
     *   email.bounced   → mark as 'bounced'  (hard or soft bounce)
     *   email.complained → mark as 'bounced' (spam complaint = treat as failed)
     *
     * Signature verification uses the Svix signing secret configured in
     * Resend Dashboard → Webhooks → your endpoint → Signing Secret.
     * Set RESEND_WEBHOOK_SECRET in .env to enable verification.
     * If the env var is empty, verification is skipped (dev/testing only).
     */
    public function handle(Request $request): Response
    {
        // ── 1. Verify Resend webhook signature ───────────────────────────────
        $secret = config('services.resend.webhook_secret');

        if ($secret) {
            $svixId        = $request->header('svix-id');
            $svixTimestamp = $request->header('svix-timestamp');
            $svixSignature = $request->header('svix-signature');

            if (! $svixId || ! $svixTimestamp || ! $svixSignature) {
                return response('Missing Svix headers.', 400);
            }

            // Reconstruct the signed content and verify
            $signedContent = "{$svixId}.{$svixTimestamp}.{$request->getContent()}";
            $secretBytes   = base64_decode(explode('_', $secret)[1] ?? '');
            $computedSig   = base64_encode(hash_hmac('sha256', $signedContent, $secretBytes, true));
            $signatures    = collect(explode(' ', $svixSignature))
                ->map(fn ($s) => explode(',', $s)[1] ?? '');

            if (! $signatures->contains($computedSig)) {
                return response('Invalid signature.', 401);
            }
        }

        // ── 2. Parse payload ─────────────────────────────────────────────────
        $payload = $request->json()->all();
        $type    = $payload['type'] ?? null;

        if (! in_array($type, ['email.bounced', 'email.complained'])) {
            // Acknowledge other events without processing
            return response('ok', 200);
        }

        $toAddresses = $payload['data']['to'] ?? [];

        if (empty($toAddresses)) {
            return response('ok', 200);
        }

        // ── 3. Update status for every recipient in the event ────────────────
        foreach ($toAddresses as $email) {
            $email = strtolower(trim($email));

            // Update voter invitation_status for any un-resolved voter with this email
            Voter::whereHas('user', fn ($q) => $q->where('email', $email))
                ->whereIn('invitation_status', ['sent', null])
                ->update(['invitation_status' => 'bounced']);

            // Update staff user setup_email_status
            User::where('email', $email)
                ->whereIn('setup_email_status', ['sent', null])
                ->update(['setup_email_status' => 'bounced']);
        }

        \Log::info('Resend webhook processed', ['type' => $type, 'to' => $toAddresses]);

        return response('ok', 200);
    }
}
