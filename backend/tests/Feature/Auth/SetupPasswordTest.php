<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Services\PasswordResetService;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SetupPasswordTest extends TestCase
{
    public function test_voter_can_setup_password_with_valid_token(): void
    {
        $org  = $this->createOrganization();
        $user = User::create([
            'organization_id' => $org->id,
            'name'            => 'New Voter',
            'email'           => 'voter@test.com',
            'password'        => null,
            'password_set_at' => null,
            'is_active'       => true,
        ]);
        $user->assignRole('voter');

        $service = app(PasswordResetService::class);
        $token   = $service->generateToken('voter@test.com', 'setup');

        $response = $this->postJson('/api/v1/auth/setup-password', [
            'email'                 => 'voter@test.com',
            'token'                 => $token,
            'password'              => 'NewPass@123',
            'password_confirmation' => 'NewPass@123',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $user->refresh();
        $this->assertNotNull($user->password_set_at);
        $this->assertTrue(Hash::check('NewPass@123', $user->password));
    }

    public function test_setup_blocked_if_password_already_set(): void
    {
        $org  = $this->createOrganization();
        $user = User::create([
            'organization_id' => $org->id,
            'name'            => 'Existing Voter',
            'email'           => 'existing@test.com',
            'password'        => Hash::make('OldPass@123'),
            'password_set_at' => now(),
            'is_active'       => true,
        ]);
        $user->assignRole('voter');

        $service = app(PasswordResetService::class);
        $token   = $service->generateToken('existing@test.com', 'setup');

        $response = $this->postJson('/api/v1/auth/setup-password', [
            'email'                 => 'existing@test.com',
            'token'                 => $token,
            'password'              => 'NewPass@123',
            'password_confirmation' => 'NewPass@123',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_setup_fails_with_invalid_token(): void
    {
        $org  = $this->createOrganization();
        $user = User::create([
            'organization_id' => $org->id,
            'name'            => 'New Voter',
            'email'           => 'voter2@test.com',
            'password'        => null,
            'password_set_at' => null,
            'is_active'       => true,
        ]);
        $user->assignRole('voter');

        // Generate valid token but use a wrong one
        app(PasswordResetService::class)->generateToken('voter2@test.com', 'setup');

        $response = $this->postJson('/api/v1/auth/setup-password', [
            'email'                 => 'voter2@test.com',
            'token'                 => 'totally-wrong-token',
            'password'              => 'NewPass@123',
            'password_confirmation' => 'NewPass@123',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_setup_fails_with_expired_token(): void
    {
        $org  = $this->createOrganization();
        $user = User::create([
            'organization_id' => $org->id,
            'name'            => 'New Voter',
            'email'           => 'voter3@test.com',
            'password'        => null,
            'password_set_at' => null,
            'is_active'       => true,
        ]);
        $user->assignRole('voter');

        $service = app(PasswordResetService::class);
        $token   = $service->generateToken('voter3@test.com', 'setup');

        // Manually expire the token
        \Illuminate\Support\Facades\DB::table('password_reset_tokens')
            ->where('email', 'voter3@test.com')
            ->update(['created_at' => now()->subMinutes(61)]);

        $response = $this->postJson('/api/v1/auth/setup-password', [
            'email'                 => 'voter3@test.com',
            'token'                 => $token,
            'password'              => 'NewPass@123',
            'password_confirmation' => 'NewPass@123',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_voter_can_login_after_setup(): void
    {
        $org  = $this->createOrganization();
        $user = User::create([
            'organization_id' => $org->id,
            'name'            => 'New Voter',
            'email'           => 'voter4@test.com',
            'password'        => null,
            'password_set_at' => null,
            'is_active'       => true,
        ]);
        $user->assignRole('voter');

        $service = app(PasswordResetService::class);
        $token   = $service->generateToken('voter4@test.com', 'setup');

        // Setup password
        $this->postJson('/api/v1/auth/setup-password', [
            'email'                 => 'voter4@test.com',
            'token'                 => $token,
            'password'              => 'NewPass@123',
            'password_confirmation' => 'NewPass@123',
        ])->assertOk();

        // Now login should succeed
        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'voter4@test.com',
            'password' => 'NewPass@123',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.role', 'voter');
    }
}
