<?php

namespace Tests;

use App\Models\Candidate;
use App\Models\Election;
use App\Models\Organization;
use App\Models\Post;
use App\Models\User;
use App\Models\Voter;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Hash;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    // ─── Helper Methods ───────────────────────────────────────────────────────

    protected function createOrganization(array $overrides = []): Organization
    {
        return Organization::create(array_merge([
            'name'              => 'Test Organization',
            'type'              => 'private',
            'email'             => fake()->unique()->safeEmail(),
            'phone'             => '01712345678',
            'email_verified_at' => now(),
            'is_active'         => true,
        ], $overrides));
    }

    protected function createOrgAdmin(Organization $org, array $overrides = []): User
    {
        $user = User::create(array_merge([
            'organization_id' => $org->id,
            'name'            => 'Org Admin',
            'email'           => fake()->unique()->safeEmail(),
            'password'        => Hash::make('Password@123'),
            'password_set_at' => now(),
            'is_active'       => true,
        ], $overrides));

        $user->assignRole('org_admin');

        return $user;
    }

    protected function createVoterUser(Organization $org, array $overrides = []): User
    {
        $user = User::create(array_merge([
            'organization_id' => $org->id,
            'name'            => fake()->name(),
            'email'           => fake()->unique()->safeEmail(),
            'password'        => Hash::make('Password@123'),
            'password_set_at' => now(),
            'is_active'       => true,
        ], $overrides));

        $user->assignRole('voter');

        return $user;
    }

    protected function createElection(Organization $org, array $overrides = []): Election
    {
        return Election::withoutGlobalScopes()->create(array_merge([
            'organization_id'  => $org->id,
            'name'             => 'Test Election',
            'election_date'    => now()->addDays(7)->format('Y-m-d'),
            'voting_start_time'=> '09:00:00',
            'voting_end_time'  => '16:00:00',
            'status'           => 'draft',
            'candidate_mode'   => 'selected',
            'allow_multi_post' => false,
        ], $overrides));
    }

    protected function createPost(Election $election, array $overrides = []): Post
    {
        return Post::withoutGlobalScopes()->create(array_merge([
            'election_id'     => $election->id,
            'organization_id' => $election->organization_id,
            'title'           => 'President',
            'max_votes'       => 1,
            'order'           => 0,
        ], $overrides));
    }

    protected function enrollVoter(Election $election, User $user): Voter
    {
        return Voter::withoutGlobalScopes()->create([
            'election_id'     => $election->id,
            'user_id'         => $user->id,
            'organization_id' => $election->organization_id,
        ]);
    }

    protected function createCandidate(Election $election, Post $post, User $user, array $overrides = []): Candidate
    {
        return Candidate::withoutGlobalScopes()->create(array_merge([
            'election_id'     => $election->id,
            'post_id'         => $post->id,
            'user_id'         => $user->id,
            'organization_id' => $election->organization_id,
        ], $overrides));
    }

    /**
     * Build a fully wired election with posts, candidates, and a voter ready to vote.
     */
    protected function buildActiveElectionWithVoter(): array
    {
        $org      = $this->createOrganization();
        $admin    = $this->createOrgAdmin($org);
        $election = $this->createElection($org, ['status' => 'active']);

        $post1 = $this->createPost($election, ['title' => 'President', 'order' => 1]);
        $post2 = $this->createPost($election, ['title' => 'Secretary', 'order' => 2]);

        $candidateUser1 = $this->createVoterUser($org);
        $candidateUser2 = $this->createVoterUser($org);
        $candidateUser3 = $this->createVoterUser($org);

        $this->enrollVoter($election, $candidateUser1);
        $this->enrollVoter($election, $candidateUser2);
        $this->enrollVoter($election, $candidateUser3);

        $cand1 = $this->createCandidate($election, $post1, $candidateUser1);
        $cand2 = $this->createCandidate($election, $post1, $candidateUser2);
        $cand3 = $this->createCandidate($election, $post2, $candidateUser3);

        $voterUser = $this->createVoterUser($org);
        $voter     = $this->enrollVoter($election, $voterUser);

        return compact(
            'org', 'admin', 'election',
            'post1', 'post2',
            'cand1', 'cand2', 'cand3',
            'voterUser', 'voter',
        );
    }
}
