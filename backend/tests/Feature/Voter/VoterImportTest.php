<?php

namespace Tests\Feature\Voter;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class VoterImportTest extends TestCase
{
    private function createCsv(array $rows): UploadedFile
    {
        $lines = [];
        $lines[] = 'name,email,mobile,office_name,designation';
        foreach ($rows as $row) {
            $lines[] = implode(',', $row);
        }

        $content  = implode("\n", $lines);
        $tmpPath  = tempnam(sys_get_temp_dir(), 'csv');
        file_put_contents($tmpPath, $content);

        return new UploadedFile($tmpPath, 'voters.csv', 'text/csv', null, true);
    }

    public function test_import_valid_csv(): void
    {
        Queue::fake();

        $org      = $this->createOrganization();
        $admin    = $this->createOrgAdmin($org);
        $election = $this->createElection($org, ['status' => 'draft']);

        $file = $this->createCsv([
            ['Alice', 'alice@import.test', '123456', 'HQ', 'Manager'],
            ['Bob', 'bob@import.test', '789012', 'Branch', 'Officer'],
        ]);

        $response = $this->actingAs($admin)->postJson(
            "/api/v1/elections/{$election->id}/voters/import",
            ['file' => $file]
        );

        $response->assertOk()
            ->assertJsonPath('data.imported', 2);

        $this->assertDatabaseHas('voters', [
            'election_id' => $election->id,
        ]);
    }

    public function test_import_skips_invalid_rows(): void
    {
        Queue::fake();

        $org      = $this->createOrganization();
        $admin    = $this->createOrgAdmin($org);
        $election = $this->createElection($org, ['status' => 'draft']);

        $file = $this->createCsv([
            ['Valid User', 'valid@import.test', '', '', ''],
            ['', 'invalid-email', '', '', ''],  // no name, bad email
        ]);

        $response = $this->actingAs($admin)->postJson(
            "/api/v1/elections/{$election->id}/voters/import",
            ['file' => $file]
        );

        $response->assertOk()
            ->assertJsonPath('data.imported', 1);

        $this->assertTrue(count($response->json('data.errors')) > 0);
    }

    public function test_import_rejects_cross_org_email(): void
    {
        Queue::fake();

        $orgA  = $this->createOrganization();
        $orgB  = $this->createOrganization();
        $admin = $this->createOrgAdmin($orgA);

        // Create a user in org B
        \App\Models\User::withoutGlobalScopes()->create([
            'organization_id' => $orgB->id,
            'name'            => 'OrgB User',
            'email'           => 'crossorg@import.test',
            'password'        => bcrypt('secret'),
            'is_active'       => true,
        ]);

        $election = $this->createElection($orgA, ['status' => 'draft']);

        $file = $this->createCsv([
            ['CrossOrg', 'crossorg@import.test', '', '', ''],
        ]);

        $response = $this->actingAs($admin)->postJson(
            "/api/v1/elections/{$election->id}/voters/import",
            ['file' => $file]
        );

        // Zero imported → 422
        $response->assertStatus(422);
    }

    public function test_import_skips_duplicate_voter(): void
    {
        Queue::fake();

        $org      = $this->createOrganization();
        $admin    = $this->createOrgAdmin($org);
        $election = $this->createElection($org, ['status' => 'draft']);

        // Enroll a voter first
        $voterUser = $this->createVoterUser($org);
        $this->enrollVoter($election, $voterUser);

        $file = $this->createCsv([
            [$voterUser->name, $voterUser->email, '', '', ''],
        ]);

        $response = $this->actingAs($admin)->postJson(
            "/api/v1/elections/{$election->id}/voters/import",
            ['file' => $file]
        );

        // Zero imported → 422 (duplicate)
        $response->assertStatus(422);
    }

    public function test_import_requires_file(): void
    {
        $org      = $this->createOrganization();
        $admin    = $this->createOrgAdmin($org);
        $election = $this->createElection($org, ['status' => 'draft']);

        $response = $this->actingAs($admin)->postJson(
            "/api/v1/elections/{$election->id}/voters/import",
            []
        );

        $response->assertStatus(422)
            ->assertJsonValidationErrors('file');
    }
}
