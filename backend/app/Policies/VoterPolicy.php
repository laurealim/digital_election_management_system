<?php

namespace App\Policies;

use App\Models\Election;
use App\Models\User;
use App\Models\Voter;

class VoterPolicy
{
    public function viewAny(User $user, Election $election): bool
    {
        if ($user->isSuperAdmin()) return true;

        return $user->can('view-voters')
            && $user->organization_id === $election->organization_id;
    }

    public function create(User $user, Election $election): bool
    {
        if ($user->isSuperAdmin()) return $election->isEditable();

        return $user->can('manage-voters')
            && $user->organization_id === $election->organization_id
            && $election->isEditable();
    }

    public function update(User $user, Voter $voter): bool
    {
        if ($user->isSuperAdmin()) return true;

        return $user->can('manage-voters')
            && $user->organization_id === $voter->organization_id;
    }

    public function delete(User $user, Voter $voter): bool
    {
        if ($user->isSuperAdmin()) return $voter->election->isEditable();

        return $user->can('delete-voters')
            && $user->organization_id === $voter->organization_id
            && $voter->election->isEditable();
    }

    public function resendInvitation(User $user, Voter $voter): bool
    {
        if ($user->isSuperAdmin()) return true;

        return $user->can('manage-voters')
            && $user->organization_id === $voter->organization_id;
    }
}
