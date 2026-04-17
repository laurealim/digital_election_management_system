<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Candidate;
use App\Models\Election;
use App\Models\Nomination;
use App\Models\Post;
use App\Models\User;
use App\Models\Voter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NominationController extends ApiController
{
    /**
     * GET /elections/{election}/nominations
     * List nominations for an election. EC + super_admin only.
     */
    public function index(Request $request, Election $election): JsonResponse
    {
        $this->authorize('viewAny', [Nomination::class, $election]);

        $nominations = Nomination::withoutGlobalScopes()
            ->where('election_id', $election->id)
            ->with(['posts:id,title'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->search, fn ($q, $s) =>
                $q->where(function ($q) use ($s) {
                    $q->where('name', 'like', "%{$s}%")
                      ->orWhere('email', 'like', "%{$s}%")
                      ->orWhere('token_number', 'like', "%{$s}%");
                })
            )
            ->latest()
            ->paginate($request->per_page ?? 20);

        return $this->paginated($nominations);
    }

    /**
     * GET /elections/{election}/nominations/{nomination}
     */
    public function show(Election $election, Nomination $nomination): JsonResponse
    {
        $this->authorize('view', $nomination);

        $nomination->load(['posts:id,title', 'statusLogs.changedBy:id,name', 'approvedBy:id,name']);

        return $this->success($nomination);
    }

    /**
     * GET /elections/{election}/posts/{post}/accepted-nominations
     * Returns accepted nominations for a post that are NOT yet assigned as candidates.
     * Used to populate the "assign candidate" dropdown in nominated-mode elections.
     */
    public function acceptedForPost(Election $election, Post $post): JsonResponse
    {
        $this->authorize('viewAny', [Nomination::class, $election]);

        // Already-assigned user IDs for this post (bypass all scopes)
        $assignedUserIds = Candidate::withoutGlobalScopes()
            ->where('post_id', $post->id)
            ->pluck('user_id')
            ->toArray();

        // Use whereExists on the raw pivot table to avoid TenantScope
        // being injected into the whereHas('posts') subquery.
        $nominations = Nomination::withoutGlobalScopes()
            ->where('election_id', $election->id)
            ->where('status', 'accepted')
            ->whereExists(function ($query) use ($post) {
                $query->selectRaw('1')
                      ->from('nomination_posts')
                      ->whereColumn('nomination_posts.nomination_id', 'nominations.id')
                      ->where('nomination_posts.post_id', $post->id);
            })
            ->get();

        $result = $nominations->map(function ($nom) use ($assignedUserIds) {
                $user = User::withoutGlobalScopes()->where('email', $nom->email)->first();
                return [
                    'nomination_id'    => $nom->id,
                    'name'             => $nom->name,
                    'email'            => $nom->email,
                    'user_id'          => $user?->id,
                    'already_assigned' => $user && in_array($user->id, $assignedUserIds),
                ];
            })
            ->filter(fn ($n) => $n['user_id'] !== null && ! $n['already_assigned'])
            ->values();

        return $this->success($result);
    }

    /**
     * PATCH /elections/{election}/nominations/{nomination}/verify
     * pending → verified (waiting for payment)
     */
    public function verify(Election $election, Nomination $nomination): JsonResponse
    {
        $this->authorize('verify', $nomination);

        $fromStatus = $nomination->status;
        $nomination->update(['status' => 'verified']);
        $nomination->logTransition($fromStatus, auth()->id());

        return $this->success($nomination->fresh(), 'Nomination verified successfully.');
    }

    /**
     * PATCH /elections/{election}/nominations/{nomination}/reject
     * pending|verified → rejected (rejection_reason required)
     */
    public function reject(Request $request, Election $election, Nomination $nomination): JsonResponse
    {
        $this->authorize('reject', $nomination);

        $request->validate([
            'rejection_reason' => ['required', 'string', 'min:5'],
        ]);

        $fromStatus = $nomination->status;
        $nomination->update([
            'status'           => 'rejected',
            'rejection_reason' => $request->rejection_reason,
        ]);
        $nomination->logTransition($fromStatus, auth()->id(), $request->rejection_reason);

        return $this->success($nomination->fresh(), 'Nomination rejected.');
    }

    /**
     * PATCH /elections/{election}/nominations/{nomination}/mark-paid
     * Mark payment as received (must be in 'verified' status).
     */
    public function markPaid(Election $election, Nomination $nomination): JsonResponse
    {
        $this->authorize('markPaid', $nomination);

        $nomination->update([
            'payment_status'      => true,
            'payment_verified_at' => now(),
        ]);

        return $this->success($nomination->fresh(), 'Payment marked as received.');
    }

    /**
     * PATCH /elections/{election}/nominations/{nomination}/accept
     * verified + payment_status = true → accepted.
     * Also auto-creates a User (if needed), Voter enrollment, and Candidate records
     * for each applied post so the nominee appears on the ballot immediately.
     */
    public function accept(Election $election, Nomination $nomination): JsonResponse
    {
        $this->authorize('accept', $nomination);

        DB::transaction(function () use ($election, $nomination) {
            $fromStatus = $nomination->status;

            // ── 1. Accept the nomination ──────────────────────────────────────
            $nomination->update([
                'status'      => 'accepted',
                'approved_by' => auth()->id(),
            ]);
            $nomination->logTransition($fromStatus, auth()->id(), 'Nomination accepted by EC.');

            // ── 2. Find or create the User account ────────────────────────────
            $user = User::firstOrCreate(
                ['email' => $nomination->email],
                [
                    'name'            => $nomination->name,
                    'mobile'          => $nomination->mobile,
                    'office_name'     => $nomination->organization_name,
                    'organization_id' => $election->organization_id,
                    'password'        => bcrypt(Str::random(16)), // temp password; reset link sent separately
                ]
            );

            // Ensure the user is scoped to this org
            if (! $user->organization_id) {
                $user->update(['organization_id' => $election->organization_id]);
            }

            // ── 3. Assign candidate role ──────────────────────────────────────
            if (! $user->hasRole('candidate')) {
                $user->assignRole('candidate');
            }

            // ── 4. Enroll as voter if not already ─────────────────────────────
            Voter::firstOrCreate(
                ['election_id' => $election->id, 'user_id' => $user->id],
                ['organization_id' => $election->organization_id]
            );

            // ── 5. Create Candidate record for each applied post ──────────────
            $nomination->load('posts');
            foreach ($nomination->posts as $post) {
                Candidate::firstOrCreate(
                    [
                        'election_id' => $election->id,
                        'post_id'     => $post->id,
                        'user_id'     => $user->id,
                    ],
                    ['organization_id' => $election->organization_id]
                );
            }
        });

        return $this->success($nomination->fresh(), 'Nomination accepted. Candidate enrolled on ballot.');
    }
}