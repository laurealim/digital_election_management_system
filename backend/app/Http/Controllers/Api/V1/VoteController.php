<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Vote\CastVoteRequest;
use App\Models\Election;
use App\Models\Voter;
use App\Services\VotingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoteController extends ApiController
{
    public function __construct(private readonly VotingService $votingService) {}

    public function store(CastVoteRequest $request, Election $election): JsonResponse
    {
        $user = $request->user();

        // Resolve the voter record for this user in this election
        $voter = Voter::where('election_id', $election->id)
            ->where('user_id', $user->id)
            ->first();

        if (! $voter) {
            return $this->error('You are not enrolled as a voter in this election.', 403);
        }

        if ($voter->has_voted) {
            return $this->error('You have already voted in this election.', 409);
        }

        if (! $election->isActive()) {
            return $this->error('This election is not currently active.', 422);
        }

        try {
            $this->votingService->castVote(
                voter:      $voter,
                election:   $election,
                votes:      $request->input('votes'),
                ipAddress:  $request->ip() ?? '',
                userAgent:  $request->userAgent() ?? '',
            );
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }

        return $this->success(null, 'Your vote has been cast successfully.');
    }

    public function status(Request $request, Election $election): JsonResponse
    {
        $voter = Voter::where('election_id', $election->id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $voter) {
            return $this->error('You are not enrolled as a voter in this election.', 403);
        }

        return $this->success([
            'has_voted' => $voter->has_voted,
            'voted_at'  => $voter->voted_at,
        ]);
    }
}
