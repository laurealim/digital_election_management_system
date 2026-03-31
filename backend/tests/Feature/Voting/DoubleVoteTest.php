<?php

namespace Tests\Feature\Voting;

use App\Models\Vote;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class DoubleVoteTest extends TestCase
{
    public function test_voter_cannot_vote_twice_in_same_election(): void
    {
        Event::fake();

        $data = $this->buildActiveElectionWithVoter();

        // First vote — success
        $this->actingAs($data['voterUser'])->postJson(
            "/api/v1/elections/{$data['election']->id}/vote",
            [
                'votes' => [
                    ['post_id' => $data['post1']->id, 'candidate_id' => $data['cand1']->id],
                    ['post_id' => $data['post2']->id, 'candidate_id' => $data['cand3']->id],
                ],
            ]
        )->assertOk();

        // Second vote — must be rejected
        $response = $this->actingAs($data['voterUser'])->postJson(
            "/api/v1/elections/{$data['election']->id}/vote",
            [
                'votes' => [
                    ['post_id' => $data['post1']->id, 'candidate_id' => $data['cand2']->id],
                    ['post_id' => $data['post2']->id, 'candidate_id' => $data['cand3']->id],
                ],
            ]
        );

        $response->assertStatus(409);

        // Still only 2 vote records in DB (one per post from first vote)
        $this->assertEquals(2, Vote::where('election_id', $data['election']->id)->count());
    }

    public function test_voter_flag_is_set_after_first_vote(): void
    {
        Event::fake();

        $data = $this->buildActiveElectionWithVoter();

        $this->assertNotTrue($data['voter']->has_voted);

        $this->actingAs($data['voterUser'])->postJson(
            "/api/v1/elections/{$data['election']->id}/vote",
            [
                'votes' => [
                    ['post_id' => $data['post1']->id, 'candidate_id' => $data['cand1']->id],
                    ['post_id' => $data['post2']->id, 'candidate_id' => $data['cand3']->id],
                ],
            ]
        )->assertOk();

        $data['voter']->refresh();
        $this->assertTrue($data['voter']->has_voted);
    }

    public function test_duplicate_post_in_single_ballot_is_rejected(): void
    {
        Event::fake();

        $data = $this->buildActiveElectionWithVoter();

        $response = $this->actingAs($data['voterUser'])->postJson(
            "/api/v1/elections/{$data['election']->id}/vote",
            [
                'votes' => [
                    ['post_id' => $data['post1']->id, 'candidate_id' => $data['cand1']->id],
                    ['post_id' => $data['post1']->id, 'candidate_id' => $data['cand2']->id],
                ],
            ]
        );

        $response->assertStatus(422);
        $this->assertDatabaseCount('votes', 0);
    }
}
