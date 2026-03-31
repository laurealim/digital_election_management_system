<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LoginTest extends TestCase
{
    public function test_login_with_valid_credentials(): void
    {
        $org  = $this->createOrganization();
        $user = $this->createOrgAdmin($org, [
            'email'    => 'admin@test.com',
            'password' => Hash::make('Secret@123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'admin@test.com',
            'password' => 'Secret@123',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => ['token', 'user' => ['id', 'name', 'email', 'role', 'organization_id']],
            ]);
    }

    public function test_login_with_wrong_password(): void
    {
        $org  = $this->createOrganization();
        $this->createOrgAdmin($org, [
            'email'    => 'admin@test.com',
            'password' => Hash::make('Secret@123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'admin@test.com',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    public function test_login_with_nonexistent_email(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'nobody@test.com',
            'password' => 'Secret@123',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    public function test_login_blocked_for_inactive_user(): void
    {
        $org  = $this->createOrganization();
        $this->createOrgAdmin($org, [
            'email'     => 'admin@test.com',
            'password'  => Hash::make('Secret@123'),
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'admin@test.com',
            'password' => 'Secret@123',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_login_blocked_when_password_not_set(): void
    {
        $org  = $this->createOrganization();
        $user = User::create([
            'organization_id' => $org->id,
            'name'            => 'New Voter',
            'email'           => 'newvoter@test.com',
            'password'        => Hash::make('Temp@123'),
            'password_set_at' => null,           // password not yet set up
            'is_active'       => true,
        ]);
        $user->assignRole('voter');

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'newvoter@test.com',
            'password' => 'Temp@123',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('errors.requires_setup', true);
    }

    public function test_login_validation_requires_email_and_password(): void
    {
        $response = $this->postJson('/api/v1/auth/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }
}
