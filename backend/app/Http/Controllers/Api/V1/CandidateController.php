<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Candidate;
use App\Models\Election;
use App\Models\Post;
use App\Models\User;
use App\Models\Voter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CandidateController extends ApiController
{
    public function index(Request $request, Election $election, Post $post): JsonResponse
    {
        $this->authorize('viewAny', [Candidate::class, $post]);

        // In 'open' mode, every enrolled voter is an eligible candidate.
        // Use the voter's user_id as the candidate identifier (no candidate record exists yet).
        if ($election->candidate_mode === 'open') {
            $voters = $election->voters()
                ->with('user:id,name,email,office_name,designation')
                ->get()
                ->map(fn ($v) => [
                    'id'   => $v->user_id,   // user_id acts as the ballot identifier in open mode
                    'user' => $v->user,
                    'bio'  => null,
                    'mode' => 'open',
                ]);

            return $this->success($voters);
        }

        $candidates = $post->candidates()
            ->with('user:id,name,email,office_name,designation')
            ->get();

        return $this->success($candidates);
    }

    public function store(Request $request, Election $election, Post $post): JsonResponse
    {
        $this->authorize('create', [Candidate::class, $post]);

        if ($election->candidate_mode === 'open') {
            return $this->error(
                'Candidates cannot be manually assigned when candidate mode is "open".',
                422
            );
        }

        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'bio'     => ['nullable', 'string', 'max:1000'],
        ]);

        $orgId = $request->user()->isSuperAdmin()
            ? $election->organization_id
            : $request->user()->organization_id;

        // Must be an enrolled voter in this election
        $isEnrolled = Voter::where('election_id', $election->id)
            ->where('user_id', $data['user_id'])
            ->exists();

        if (! $isEnrolled) {
            return $this->error('The selected user is not enrolled as a voter in this election.', 422);
        }

        // Enforce allow_multi_post = false
        if (! $election->allow_multi_post) {
            $alreadyCandidate = Candidate::where('election_id', $election->id)
                ->where('user_id', $data['user_id'])
                ->exists();

            if ($alreadyCandidate) {
                return $this->error(
                    'This voter is already a candidate for another post in this election. Multi-post candidacy is not allowed.',
                    422
                );
            }
        }

        // Prevent duplicate on same post
        $alreadyOnPost = Candidate::where('post_id', $post->id)
            ->where('user_id', $data['user_id'])
            ->exists();

        if ($alreadyOnPost) {
            return $this->error('This voter is already a candidate for this post.', 422);
        }

        $candidate = Candidate::create([
            'election_id'     => $election->id,
            'post_id'         => $post->id,
            'user_id'         => $data['user_id'],
            'organization_id' => $orgId,
            'bio'             => $data['bio'] ?? null,
        ]);

        // ─── Auto-assign candidate role ───────────────────────────────────────
        $user = User::find($data['user_id']);
        if ($user && ! $user->hasRole('candidate')) {
            $user->assignRole('candidate');
        }

        return $this->created($candidate->load('user:id,name,email,office_name,designation'));
    }

    public function destroy(Election $election, Post $post, Candidate $candidate): JsonResponse
    {
        $this->authorize('delete', $candidate);

        $userId = $candidate->user_id;

        $candidate->delete();

        // ─── Auto-remove candidate role if no remaining candidacies ──────────
        $this->syncCandidateRole($userId);

        return $this->noContent();
    }

    /**
     * Recompute whether a user should have the 'candidate' role.
     * A user is a candidate if:
     *   (a) they have at least one Candidate record (selected mode), OR
     *   (b) they are a voter in at least one election with candidate_mode = 'open'
     */
    private function syncCandidateRole(int $userId): void
    {
        $user = User::find($userId);
        if (! $user) {
            return;
        }

        $hasManualCandidacy = Candidate::where('user_id', $userId)->exists();

        $hasOpenModeCandidacy = Voter::where('user_id', $userId)
            ->whereHas('election', fn ($q) => $q->where('candidate_mode', 'open'))
            ->exists();

        $shouldBeCandidate = $hasManualCandidacy || $hasOpenModeCandidacy;

        if ($shouldBeCandidate && ! $user->hasRole('candidate')) {
            $user->assignRole('candidate');
        } elseif (! $shouldBeCandidate && $user->hasRole('candidate')) {
            $user->removeRole('candidate');
        }
    }
}
