<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PasswordResetService
{
    /**
     * Generate a reset/setup token, store it, return the plain token.
     */
    public function generateToken(string $email, string $type = 'reset'): string
    {
        $token = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token'      => Hash::make($token),
                'type'       => $type,
                'created_at' => now(),
            ]
        );

        return $token;
    }

    /**
     * Validate token — returns true if valid and not expired (60 min).
     */
    public function validateToken(string $email, string $token, string $type): bool
    {
        $record = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->where('type', $type)
            ->first();

        if (! $record) {
            return false;
        }

        // Check expiry (60 minutes)
        if (now()->diffInMinutes($record->created_at, absolute: true) > 60) {
            return false;
        }

        return Hash::check($token, $record->token);
    }

    /**
     * Set new password and clear token.
     */
    public function resetPassword(string $email, string $password): void
    {
        User::where('email', $email)->update([
            'password'        => Hash::make($password),
            'password_set_at' => now(),
        ]);

        DB::table('password_reset_tokens')->where('email', $email)->delete();
    }
}
