<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Requests\Api\V1\Auth\ForgotPasswordRequest;
use App\Jobs\SendPasswordResetMailJob;
use App\Models\User;
use App\Services\PasswordResetService;
use Illuminate\Http\JsonResponse;

class ForgotPasswordController extends ApiController
{
    public function __construct(private PasswordResetService $passwordResetService) {}

    public function store(ForgotPasswordRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        // Always return the same response to prevent email enumeration
        if ($user && $user->is_active) {
            $token = $this->passwordResetService->generateToken($user->email, 'reset');
            SendPasswordResetMailJob::dispatch($user, $token, 'reset');
        }

        return $this->success(
            null,
            'If that email exists in our system, you will receive a password reset link shortly.'
        );
    }
}
