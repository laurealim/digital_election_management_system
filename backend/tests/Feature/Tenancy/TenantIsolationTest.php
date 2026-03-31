<?php

namespace Tests\Feature\Tenancy;

use App\Models\Election;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    public function test_org_a_voter_cannot_vote_in_org_b_election(): void
    {
        Event::fake();

        // ─── Org A: with a voter ───
        $orgA  = $this->createOrganization(['name' => 'Org A']);
        $userA = $this->createVoterUser($orgA);

        // ─── Org B: with an active election ───
        $orgB      = $this->createOrganization(['name' => 'Org B']);
        $electionB = $this->createElection($orgB, ['status' => 'active']);
        $postB     = $this->createPost($electionB, ['title' => 'President']);
        $candUserB = $this->createVoterUser($orgB);
        $this->enrollVoter($electionB, $candUserB);
        $candB     = $this->createCandidate($electionB, $postB, $candUserB);

        // Org A voter is NOT enrolled in Org B election
        $response = $this->actingAs($userA)->postJson(
            "/api/v1/elections/{$electionB->id}/vote",
            [
                'votes' => [
                    ['post_id' => $postB->id, 'candidate_id' => $candB->id],
                ],
            ]
        );

        // TenantScope hides the election entirely — returns 404 (not 403)
        $response->assertStatus(404);
        $this->assertDatabaseCount('votes', 0);
    }

    public function test_org_admin_cannot_see_other_org_elections(): void
    {
        $orgA  = $this->createOrganization(['name' => 'Org A']);
        $adminA = $this->createOrgAdmin($orgA);
        $this->createElection($orgA, ['name' => 'Election A']);

        $orgB  = $this->createOrganization(['name' => 'Org B']);
        $adminB = $this->createOrgAdmin($orgB);
        $this->createElection($orgB, ['name' => 'Election B']);

        // Admin A should only see Election A
        $response = $this->actingAs($adminA)->getJson('/api/v1/elections');

        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name')->toArray();
        $this->assertContains('Election A', $names);
        $this->assertNotContains('Election B', $names);
    }

    public function test_org_admin_cannot_update_other_org_election(): void
    {
        $orgA  = $this->createOrganization(['name' => 'Org A']);
        $adminA = $this->createOrgAdmin($orgA);

        $orgB  = $this->createOrganization(['name' => 'Org B']);
        $electionB = $this->createElection($orgB, ['name' => 'Election B']);

        $response = $this->actingAs($adminA)->putJson(
            "/api/v1/elections/{$electionB->id}",
            ['name' => 'Hacked Election']
        );

        // Should be denied (404 via tenant scope or 403 via policy)
        $this->assertTrue(in_array($response->status(), [403, 404]));
    }

    public function test_org_admin_cannot_view_other_org_voters(): void
    {
        $orgA   = $this->createOrganization(['name' => 'Org A']);
        $adminA = $this->createOrgAdmin($orgA);

        $orgB       = $this->createOrganization(['name' => 'Org B']);
        $electionB  = $this->createElection($orgB);
        $voterUserB = $this->createVoterUser($orgB);
        $this->enrollVoter($electionB, $voterUserB);

        $response = $this->actingAs($adminA)
            ->getJson("/api/v1/elections/{$electionB->id}/voters");

        // Tenant scope should prevent seeing the election entirely
        $this->assertTrue(in_array($response->status(), [403, 404]));
    }

    public function test_super_admin_can_see_all_elections(): void
    {
        $superAdmin = $this->createSuperAdmin();

        $orgA = $this->createOrganization(['name' => 'Org A']);
        $this->createElection($orgA, ['name' => 'Election A']);

        $orgB = $this->createOrganization(['name' => 'Org B']);
        $this->createElection($orgB, ['name' => 'Election B']);

        $response = $this->actingAs($superAdmin)->getJson('/api/v1/elections');

        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name')->toArray();
        $this->assertContains('Election A', $names);
        $this->assertContains('Election B', $names);
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private function createSuperAdmin(): \App\Models\User
    {
        $user = \App\Models\User::create([
            'name'            => 'Super Admin',
            'email'           => 'super@dems.app',
            'password'        => \Illuminate\Support\Facades\Hash::make('Admin@1234'),
            'password_set_at' => now(),
            'is_active'       => true,
        ]);

        $user->assignRole('super_admin');

        return $user;
    }
}
