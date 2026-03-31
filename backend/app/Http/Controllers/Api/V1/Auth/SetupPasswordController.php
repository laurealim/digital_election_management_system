<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Requests\Api\V1\Auth\SetupPasswordRequest;
use App\Models\User;
use App\Services\PasswordResetService;
use Illuminate\Http\JsonResponse;

class SetupPasswordController extends ApiController
{
    public function __construct(private PasswordResetService $passwordResetService) {}

    public function store(SetupPasswordRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return $this->error('Invalid setup link.', 422);
        }

        if ($user->hasSetPassword()) {
            return $this->error('Password has already been set up. Please use the forgot password flow instead.', 422);
        }

        $valid = $this->passwordResetService->validateToken(
            $request->email,
            $request->token,
            'setup'
        );

        if (! $valid) {
            return $this->error('This setup link is invalid or has expired. Please contact your administrator.', 422);
        }

        $this->passwordResetService->resetPassword($request->email, $request->password);

        return $this->success(null, 'Password set up successfully. You can now log in.');
    }
}
