<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Election;
use App\Models\Voter;
use App\Services\PasswordResetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModeratorResetPasswordController extends ApiController
{
    /**
     * GET /api/v1/moderator/elections
     * Super admin: all elections.
     * Voter-moderator: elections where they are enrolled as voter.
     * Normal-moderator: elections assigned via moderator_election pivot.
     */
    public function elections(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            $elections = Election::select('id', 'name', 'status', 'organization_id')
                ->with('organization:id,name')
                ->orderByDesc('created_at')
                ->get();
        } else {
            // Union: elections where user is a voter + elections assigned via pivot
            $voterElectionIds   = Voter::where('user_id', $user->id)->pluck('election_id');
            $assignedElectionIds = $user->assignedElections()->pluck('elections.id');
            $allElectionIds      = $voterElectionIds->merge($assignedElectionIds)->unique();

            $elections = Election::select('id', 'name', 'status', 'organization_id')
                ->whereIn('id', $allElectionIds)
                ->with('organization:id,name')
                ->orderByDesc('created_at')
                ->get();
        }

        return $this->success($elections);
    }

    /**
     * GET /api/v1/moderator/elections/{election}/voters
     * List all voters for the election (with search).
     */
    public function voters(Request $request, Election $election): JsonResponse
    {
        $user = $request->user();

        // Moderator must be a voter in this election OR have it assigned
        if (! $user->isSuperAdmin()) {
            $hasAccess = Voter::where('election_id', $election->id)
                    ->where('user_id', $user->id)
                    ->exists()
                || $user->assignedElections()->where('elections.id', $election->id)->exists();

            if (! $hasAccess) {
                return $this->forbidden('You do not have access to this election.');
            }
        }

        $voters = $election->voters()
            ->with('user:id,name,email,mobile,office_name,designation')
            ->when($request->search, function ($q, $s) {
                $q->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%")
                    ->orWhere('mobile', 'like', "%{$s}%"));
            })
            ->orderBy('id')
            ->get();

        return $this->success($voters);
    }

    /**
     * PUT /api/v1/moderator/voters/{voter}
     * Update voter user profile (inline edit).
     */
    public function updateVoter(Request $request, Voter $voter): JsonResponse
    {
        $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'mobile'      => ['nullable', 'string', 'max:20'],
            'office_name' => ['nullable', 'string', 'max:255'],
            'designation' => ['nullable', 'string', 'max:255'],
        ]);

        $user = $request->user();

        // Moderator must be a voter in the same election OR have it assigned
        if (! $user->isSuperAdmin()) {
            $hasAccess = Voter::where('election_id', $voter->election_id)
                    ->where('user_id', $user->id)
                    ->exists()
                || $user->assignedElections()->where('elections.id', $voter->election_id)->exists();

            if (! $hasAccess) {
                return $this->forbidden('You do not have access to this election.');
            }
        }

        $voter->user->update([
            'name'        => $request->name,
            'mobile'      => $request->mobile,
            'office_name' => $request->office_name,
            'designation' => $request->designation,
        ]);

        return $this->success(
            $voter->load('user:id,name,email,mobile,office_name,designation'),
            'Voter updated successfully.'
        );
    }

    /**
     * POST /api/v1/moderator/voters/{voter}/generate-reset-link
     * Generate a password reset link — returns the URL (no email sent).
     */
    public function generateResetLink(Request $request, Voter $voter, PasswordResetService $resetService): JsonResponse
    {
        $user = $request->user();

        // Moderator must be a voter in the same election OR have it assigned
        if (! $user->isSuperAdmin()) {
            $hasAccess = Voter::where('election_id', $voter->election_id)
                    ->where('user_id', $user->id)
                    ->exists()
                || $user->assignedElections()->where('elections.id', $voter->election_id)->exists();

            if (! $hasAccess) {
                return $this->forbidden('You do not have access to this election.');
            }
        }

        $voterUser = $voter->user;

        if (! $voterUser) {
            return $this->error('Voter has no associated user account.', 404);
        }

        $token = $resetService->generateToken($voterUser->email, 'reset');

        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
        $resetLink   = $frontendUrl . '/reset-password?token=' . $token . '&email=' . urlencode($voterUser->email);

        return $this->success([
            'reset_link'  => $resetLink,
            'voter_name'  => $voterUser->name,
            'voter_email' => $voterUser->email,
        ], 'Reset password link generated successfully.');
    }
}
