<?php

namespace Tests\Unit\Services;

use App\Models\Vote;
use App\Services\ResultService;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ResultServiceTest extends TestCase
{
    private ResultService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new ResultService();
    }

    public function test_results_contain_expected_structure(): void
    {
        Event::fake();

        $data = $this->buildActiveElectionWithVoter();
        $election = $data['election'];

        // Cast a vote
        Vote::create([
            'election_id'     => $election->id,
            'post_id'         => $data['post1']->id,
            'voter_id'        => $data['voter']->id,
            'candidate_id'    => $data['cand1']->id,
            'organization_id' => $data['org']->id,
            'vote_hash'       => hash('sha256', 'struct-test'),
            'created_at'      => now(),
        ]);

        $data['voter']->update(['has_voted' => true]);

        $result = $this->service->getResults($election);

        $this->assertArrayHasKey('election', $result);
        $this->assertArrayHasKey('turnout', $result);
        $this->assertArrayHasKey('posts', $result);

        $this->assertEquals($election->id, $result['election']['id']);
        $this->assertCount(2, $result['posts']); // post1 + post2
    }

    public function test_winner_determined_by_highest_votes(): void
    {
        Event::fake();

        $data = $this->buildActiveElectionWithVoter();
        $election = $data['election'];

        // Enroll 2 more voters
        $voterUser2 = $this->createVoterUser($data['org']);
        $voterUser3 = $this->createVoterUser($data['org']);
        $voter2 = $this->enrollVoter($election, $voterUser2);
        $voter3 = $this->enrollVoter($election, $voterUser3);

        // Cast 2 votes for cand1 and 1 for cand2 on post1
        foreach ([$data['voter'], $voter2] as $v) {
            Vote::create([
                'election_id' => $election->id, 'post_id' => $data['post1']->id,
                'voter_id' => $v->id, 'candidate_id' => $data['cand1']->id,
                'organization_id' => $data['org']->id,
                'vote_hash' => hash('sha256', "winner-{$v->id}"),
                'created_at' => now(),
            ]);
        }

        Vote::create([
            'election_id' => $election->id, 'post_id' => $data['post1']->id,
            'voter_id' => $voter3->id, 'candidate_id' => $data['cand2']->id,
            'organization_id' => $data['org']->id,
            'vote_hash' => hash('sha256', 'winner-loser'),
            'created_at' => now(),
        ]);

        $result = $this->service->getResults($election);
        $post1  = $result['posts'][0]; // post1 is first (order=1)

        // Winner is cand1 with 2 votes
        $this->assertEquals($data['cand1']->id, $post1['winners'][0]['id']);
        $this->assertEquals(2, $post1['winners'][0]['vote_count']);
        $this->assertEquals(3, $post1['total_votes']);
    }

    public function test_turnout_calculated_correctly(): void
    {
        Event::fake();

        $data = $this->buildActiveElectionWithVoter();
        $election = $data['election'];

        // buildActiveElectionWithVoter already creates 4 voters (3 candidate-voters + 1 voter)
        // Mark first voter has_voted
        $data['voter']->update(['has_voted' => true]);

        $result = $this->service->getResults($election);

        $this->assertEquals(4, $result['turnout']['total_voters']);
        $this->assertEquals(1, $result['turnout']['voted_count']);
        $this->assertEquals(25.0, $result['turnout']['turnout_pct']);
    }

    public function test_chart_data_structure(): void
    {
        Event::fake();

        $data = $this->buildActiveElectionWithVoter();

        $result = $this->service->getResults($data['election']);
        $chart  = $result['posts'][0]['chart'];

        $this->assertArrayHasKey('labels', $chart);
        $this->assertArrayHasKey('datasets', $chart);
        $this->assertCount(2, $chart['labels']); // 2 candidates
        $this->assertCount(2, $chart['datasets'][0]['data']);
    }

    public function test_zero_votes_yields_zero_turnout(): void
    {
        Event::fake();

        $data   = $this->buildActiveElectionWithVoter();
        $result = $this->service->getResults($data['election']);

        $this->assertEquals(0, $result['turnout']['voted_count']);
        // turnout_pct = 0 when nobody voted
        $this->assertEquals(0, $result['turnout']['turnout_pct']);
    }
}
