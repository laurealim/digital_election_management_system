<?php

namespace Tests\Feature\Election;

use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ElectionStatusTransitionTest extends TestCase
{
    public function test_draft_can_transition_to_scheduled(): void
    {
        Queue::fake();

        $org      = $this->createOrganization();
        $admin    = $this->createOrgAdmin($org);
        $election = $this->createElection($org, ['status' => 'draft']);

        $response = $this->actingAs($admin)->patchJson(
            "/api/v1/elections/{$election->id}/status",
            ['status' => 'scheduled']
        );

        $response->assertOk()
            ->assertJsonPath('data.status', 'scheduled');
    }

    public function test_scheduled_can_transition_back_to_draft(): void
    {
        Queue::fake();

        $org      = $this->createOrganization();
        $admin    = $this->createOrgAdmin($org);
        $election = $this->createElection($org, ['status' => 'scheduled']);

        $response = $this->actingAs($admin)->patchJson(
            "/api/v1/elections/{$election->id}/status",
            ['status' => 'draft']
        );

        $response->assertOk()
            ->assertJsonPath('data.status', 'draft');
    }

    public function test_draft_can_transition_to_cancelled(): void
    {
        Queue::fake();

        $org      = $this->createOrganization();
        $admin    = $this->createOrgAdmin($org);
        $election = $this->createElection($org, ['status' => 'draft']);

        $response = $this->actingAs($admin)->patchJson(
            "/api/v1/elections/{$election->id}/status",
            ['status' => 'cancelled']
        );

        $response->assertOk()
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_scheduled_can_transition_to_cancelled(): void
    {
        Queue::fake();

        $org      = $this->createOrganization();
        $admin    = $this->createOrgAdmin($org);
        $election = $this->createElection($org, ['status' => 'scheduled']);

        $response = $this->actingAs($admin)->patchJson(
            "/api/v1/elections/{$election->id}/status",
            ['status' => 'cancelled']
        );

        $response->assertOk()
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_cannot_manually_transition_to_active(): void
    {
        Queue::fake();

        $org      = $this->createOrganization();
        $admin    = $this->createOrgAdmin($org);
        $election = $this->createElection($org, ['status' => 'draft']);

        $response = $this->actingAs($admin)->patchJson(
            "/api/v1/elections/{$election->id}/status",
            ['status' => 'active']
        );

        $response->assertStatus(422);
    }

    public function test_cannot_transition_from_active_to_draft(): void
    {
        $org      = $this->createOrganization();
        $admin    = $this->createOrgAdmin($org);
        $election = $this->createElection($org, ['status' => 'active']);

        $response = $this->actingAs($admin)->patchJson(
            "/api/v1/elections/{$election->id}/status",
            ['status' => 'draft']
        );

        $response->assertStatus(422);
    }

    public function test_cannot_transition_from_completed_state(): void
    {
        $org      = $this->createOrganization();
        $admin    = $this->createOrgAdmin($org);
        $election = $this->createElection($org, [
            'status'       => 'completed',
            'completed_at' => now(),
        ]);

        $response = $this->actingAs($admin)->patchJson(
            "/api/v1/elections/{$election->id}/status",
            ['status' => 'draft']
        );

        $response->assertStatus(403);
    }

    public function test_start_election_job_activates_scheduled_election(): void
    {
        $org      = $this->createOrganization();
        $admin    = $this->createOrgAdmin($org);
        $election = $this->createElection($org, [
            'status'            => 'scheduled',
            'election_date'     => now('Asia/Dhaka')->format('Y-m-d'),
            'voting_start_time' => now('Asia/Dhaka')->subMinute()->format('H:i'),
            'voting_end_time'   => now('Asia/Dhaka')->addHours(2)->format('H:i'),
        ]);

        $job = new \App\Jobs\StartElectionJob($election);
        $job->handle();

        $election->refresh();
        $this->assertEquals('active', $election->status);
    }

    public function test_stop_election_job_completes_active_election(): void
    {
        $org      = $this->createOrganization();
        $admin    = $this->createOrgAdmin($org);
        $election = $this->createElection($org, [
            'status'            => 'active',
            'election_date'     => now('Asia/Dhaka')->format('Y-m-d'),
            'voting_start_time' => now('Asia/Dhaka')->subHours(2)->format('H:i'),
            'voting_end_time'   => now('Asia/Dhaka')->subMinute()->format('H:i'),
        ]);

        $job = new \App\Jobs\StopElectionJob($election);
        $job->handle();

        $election->refresh();
        $this->assertEquals('completed', $election->status);
        $this->assertNotNull($election->completed_at);
    }
}
