<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class LoginController extends ApiController
{
    public function store(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return $this->error('Invalid credentials.', 401);
        }

        if (! $user->is_active) {
            return $this->error('Your account has been deactivated. Please contact your administrator.', 403);
        }

        if (! $user->hasSetPassword()) {
            return $this->error('Please set up your password before logging in.', 403, [
                'requires_setup' => true,
            ]);
        }

        // Revoke previous tokens (single-session per user)
        $user->tokens()->delete();

        $token = $user->createToken('api-token')->plainTextToken;

        return $this->success([
            'token' => $token,
            'user'  => [
                'id'              => $user->id,
                'name'            => $user->name,
                'email'           => $user->email,
                'role'            => $user->getRoleNames()->first(),
                'organization_id' => $user->organization_id,
            ],
        ], 'Login successful.');
    }
}
