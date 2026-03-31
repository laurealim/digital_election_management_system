<?php

namespace Tests\Feature\Voting;

use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class CastVoteTest extends TestCase
{
    public function test_voter_can_cast_vote_successfully(): void
    {
        Event::fake();

        $data = $this->buildActiveElectionWithVoter();

        $response = $this->actingAs($data['voterUser'])->postJson(
            "/api/v1/elections/{$data['election']->id}/vote",
            [
                'votes' => [
                    ['post_id' => $data['post1']->id, 'candidate_id' => $data['cand1']->id],
                    ['post_id' => $data['post2']->id, 'candidate_id' => $data['cand3']->id],
                ],
            ]
        );

        $response->assertOk()
            ->assertJsonPath('success', true);

        // Voter should be marked as having voted
        $data['voter']->refresh();
        $this->assertTrue($data['voter']->has_voted);
        $this->assertNotNull($data['voter']->voted_at);

        // Votes should exist in the database
        $this->assertDatabaseCount('votes', 2);
        $this->assertDatabaseHas('votes', [
            'election_id'  => $data['election']->id,
            'post_id'      => $data['post1']->id,
            'candidate_id' => $data['cand1']->id,
            'voter_id'     => $data['voter']->id,
        ]);
    }

    public function test_vote_fails_when_election_is_not_active(): void
    {
        $org       = $this->createOrganization();
        $election  = $this->createElection($org, ['status' => 'draft']);
        $post      = $this->createPost($election);
        $candUser  = $this->createVoterUser($org);
        $this->enrollVoter($election, $candUser);
        $candidate = $this->createCandidate($election, $post, $candUser);

        $voterUser = $this->createVoterUser($org);
        $this->enrollVoter($election, $voterUser);

        $response = $this->actingAs($voterUser)->postJson(
            "/api/v1/elections/{$election->id}/vote",
            [
                'votes' => [
                    ['post_id' => $post->id, 'candidate_id' => $candidate->id],
                ],
            ]
        );

        $response->assertStatus(422);
    }

    public function test_vote_fails_for_non_enrolled_voter(): void
    {
        Event::fake();

        $org       = $this->createOrganization();
        $election  = $this->createElection($org, ['status' => 'active']);
        $post      = $this->createPost($election);
        $candUser  = $this->createVoterUser($org);
        $this->enrollVoter($election, $candUser);
        $candidate = $this->createCandidate($election, $post, $candUser);

        // Voter NOT enrolled in this election
        $outsider = $this->createVoterUser($org);

        $response = $this->actingAs($outsider)->postJson(
            "/api/v1/elections/{$election->id}/vote",
            [
                'votes' => [
                    ['post_id' => $post->id, 'candidate_id' => $candidate->id],
                ],
            ]
        );

        $response->assertStatus(403);
    }

    public function test_voting_status_endpoint_returns_correct_status(): void
    {
        Event::fake();

        $data = $this->buildActiveElectionWithVoter();

        // Before voting
        $response = $this->actingAs($data['voterUser'])
            ->getJson("/api/v1/elections/{$data['election']->id}/voting-status");

        $response->assertOk()
            ->assertJsonPath('data.has_voted', false)
            ->assertJsonPath('data.voted_at', null);

        // Cast vote
        $this->actingAs($data['voterUser'])->postJson(
            "/api/v1/elections/{$data['election']->id}/vote",
            [
                'votes' => [
                    ['post_id' => $data['post1']->id, 'candidate_id' => $data['cand1']->id],
                    ['post_id' => $data['post2']->id, 'candidate_id' => $data['cand3']->id],
                ],
            ]
        )->assertOk();

        // After voting
        $response = $this->actingAs($data['voterUser'])
            ->getJson("/api/v1/elections/{$data['election']->id}/voting-status");

        $response->assertOk()
            ->assertJsonPath('data.has_voted', true);
    }

    public function test_vote_generates_unique_hash_per_ballot(): void
    {
        Event::fake();

        $data = $this->buildActiveElectionWithVoter();

        $this->actingAs($data['voterUser'])->postJson(
            "/api/v1/elections/{$data['election']->id}/vote",
            [
                'votes' => [
                    ['post_id' => $data['post1']->id, 'candidate_id' => $data['cand1']->id],
                    ['post_id' => $data['post2']->id, 'candidate_id' => $data['cand3']->id],
                ],
            ]
        )->assertOk();

        $hashes = \App\Models\Vote::where('election_id', $data['election']->id)
            ->pluck('vote_hash')
            ->toArray();

        $this->assertCount(2, $hashes);
        $this->assertNotEquals($hashes[0], $hashes[1]);
    }
}
