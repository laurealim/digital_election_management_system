<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Requests\Api\V1\Auth\ResetPasswordRequest;
use App\Services\PasswordResetService;
use Illuminate\Http\JsonResponse;

class ResetPasswordController extends ApiController
{
    public function __construct(private PasswordResetService $passwordResetService) {}

    public function store(ResetPasswordRequest $request): JsonResponse
    {
        $valid = $this->passwordResetService->validateToken(
            $request->email,
            $request->token,
            'reset'
        );

        if (! $valid) {
            return $this->error('This password reset link is invalid or has expired.', 422);
        }

        $this->passwordResetService->resetPassword($request->email, $request->password);

        return $this->success(null, 'Password has been reset successfully. You can now log in.');
    }
}
