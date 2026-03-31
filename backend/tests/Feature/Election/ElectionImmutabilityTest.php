<?php

namespace Tests\Feature\Election;

use Tests\TestCase;

class ElectionImmutabilityTest extends TestCase
{
    public function test_cannot_update_completed_election(): void
    {
        $org      = $this->createOrganization();
        $admin    = $this->createOrgAdmin($org);
        $election = $this->createElection($org, [
            'status'       => 'completed',
            'completed_at' => now(),
        ]);

        $response = $this->actingAs($admin)->putJson(
            "/api/v1/elections/{$election->id}",
            ['name' => 'Updated Name']
        );

        $response->assertStatus(403);
        $this->assertNotEquals('Updated Name', $election->fresh()->name);
    }

    public function test_cannot_delete_completed_election(): void
    {
        $org      = $this->createOrganization();
        $admin    = $this->createOrgAdmin($org);
        $election = $this->createElection($org, [
            'status'       => 'completed',
            'completed_at' => now(),
        ]);

        $response = $this->actingAs($admin)->deleteJson(
            "/api/v1/elections/{$election->id}"
        );

        $response->assertStatus(403);
        $this->assertDatabaseHas('elections', ['id' => $election->id]);
    }

    public function test_cannot_update_cancelled_election(): void
    {
        $org      = $this->createOrganization();
        $admin    = $this->createOrgAdmin($org);
        $election = $this->createElection($org, ['status' => 'cancelled']);

        $response = $this->actingAs($admin)->putJson(
            "/api/v1/elections/{$election->id}",
            ['name' => 'Updated Name']
        );

        $response->assertStatus(403);
    }

    public function test_cannot_delete_cancelled_election(): void
    {
        $org      = $this->createOrganization();
        $admin    = $this->createOrgAdmin($org);
        $election = $this->createElection($org, ['status' => 'cancelled']);

        $response = $this->actingAs($admin)->deleteJson(
            "/api/v1/elections/{$election->id}"
        );

        $response->assertStatus(403);
    }

    public function test_cannot_add_voter_to_active_election(): void
    {
        $org      = $this->createOrganization();
        $admin    = $this->createOrgAdmin($org);
        $election = $this->createElection($org, ['status' => 'active']);

        $response = $this->actingAs($admin)->postJson(
            "/api/v1/elections/{$election->id}/voters",
            [
                'name'  => 'New Voter',
                'email' => 'newvoter@test.com',
            ]
        );

        // VoterPolicy::create checks isEditable()
        $response->assertStatus(403);
    }

    public function test_cannot_add_post_to_completed_election(): void
    {
        $org      = $this->createOrganization();
        $admin    = $this->createOrgAdmin($org);
        $election = $this->createElection($org, [
            'status'       => 'completed',
            'completed_at' => now(),
        ]);

        $response = $this->actingAs($admin)->postJson(
            "/api/v1/elections/{$election->id}/posts",
            ['title' => 'New Post', 'max_votes' => 1]
        );

        $response->assertStatus(403);
    }

    public function test_can_update_draft_election(): void
    {
        $org      = $this->createOrganization();
        $admin    = $this->createOrgAdmin($org);
        $election = $this->createElection($org, ['status' => 'draft']);

        $response = $this->actingAs($admin)->putJson(
            "/api/v1/elections/{$election->id}",
            ['name' => 'Updated Draft']
        );

        $response->assertOk()
            ->assertJsonPath('data.name', 'Updated Draft');
    }

    public function test_vote_records_are_immutable(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Vote records are immutable.');

        $data = $this->buildActiveElectionWithVoter();

        $vote = \App\Models\Vote::create([
            'election_id'     => $data['election']->id,
            'post_id'         => $data['post1']->id,
            'voter_id'        => $data['voter']->id,
            'candidate_id'    => $data['cand1']->id,
            'organization_id' => $data['org']->id,
            'vote_hash'       => hash('sha256', 'test'),
            'created_at'      => now(),
        ]);

        $vote->update(['vote_hash' => 'tampered']);
    }

    public function test_vote_records_cannot_be_deleted(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Vote records cannot be deleted.');

        $data = $this->buildActiveElectionWithVoter();

        $vote = \App\Models\Vote::create([
            'election_id'     => $data['election']->id,
            'post_id'         => $data['post1']->id,
            'voter_id'        => $data['voter']->id,
            'candidate_id'    => $data['cand1']->id,
            'organization_id' => $data['org']->id,
            'vote_hash'       => hash('sha256', 'test-delete'),
            'created_at'      => now(),
        ]);

        $vote->delete();
    }
}
