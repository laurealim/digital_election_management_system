<?php

namespace App\Services;

use App\Events\VoteCast;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\Vote;
use App\Models\Voter;
use Illuminate\Support\Facades\DB;

class VotingService
{
    /**
     * Cast a ballot for the given voter.
     *
     * @param  array  $votes  [['post_id' => int, 'candidate_id' => int], ...]
     */
    public function castVote(
        Voter $voter,
        Election $election,
        array $votes,
        string $ipAddress,
        string $userAgent,
    ): void {
        if (! $election->isActive()) {
            throw new \RuntimeException('This election is not currently active.');
        }

        DB::transaction(function () use ($voter, $election, $votes, $ipAddress, $userAgent) {
            // Lock the voter row to prevent double-voting under concurrent requests
            $lockedVoter = Voter::where('id', $voter->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedVoter->has_voted) {
                throw new \RuntimeException('You have already voted in this election.');
            }

            $createdIds = [];

            foreach ($votes as $ballot) {
                $candidateId = $ballot['candidate_id'];

                // In open mode, candidate_id is a user_id — auto-create the Candidate record
                if ($election->candidate_mode === 'open') {
                    $candidate = Candidate::firstOrCreate(
                        [
                            'election_id' => $election->id,
                            'post_id'     => $ballot['post_id'],
                            'user_id'     => $ballot['candidate_id'],
                        ],
                        [
                            'organization_id' => $election->organization_id,
                            'bio'             => null,
                        ]
                    );
                    $candidateId = $candidate->id;
                }

                $voteHash = hash_hmac(
                    'sha256',
                    "{$lockedVoter->id}|{$election->id}|{$ballot['post_id']}|{$candidateId}",
                    config('app.vote_hash_salt', env('VOTE_HASH_SALT', 'fallback'))
                );

                $vote = Vote::create([
                    'election_id'     => $election->id,
                    'post_id'         => $ballot['post_id'],
                    'voter_id'        => $lockedVoter->id,
                    'candidate_id'    => $candidateId,
                    'organization_id' => $election->organization_id,
                    'vote_hash'       => $voteHash,
                    'created_at'      => now(),
                ]);

                $createdIds[] = $vote->id;
            }

            // Mark voter as having voted
            $lockedVoter->update([
                'has_voted' => true,
                'voted_at'  => now(),
            ]);

            event(new VoteCast($lockedVoter, $election, $createdIds, $ipAddress, $userAgent));
        });
    }
}
