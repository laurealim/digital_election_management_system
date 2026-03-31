<?php

namespace App\Policies;

use App\Models\Election;
use App\Models\User;

class ElectionPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // all authenticated users can attempt; controller filters by role
    }

    public function view(User $user, Election $election): bool
    {
        if ($user->isSuperAdmin()) return true;

        return $user->organization_id === $election->organization_id;
    }

    public function create(User $user): bool
    {
        if ($user->isSuperAdmin()) return true;

        return $user->can('create-elections');
    }

    public function update(User $user, Election $election): bool
    {
        if ($user->isSuperAdmin()) return $election->isEditable();

        return $user->can('edit-elections')
            && $user->organization_id === $election->organization_id
            && $election->isEditable();
    }

    public function delete(User $user, Election $election): bool
    {
        if ($user->isSuperAdmin()) return $election->isEditable();

        return $user->can('delete-elections')
            && $user->organization_id === $election->organization_id
            && $election->isEditable();
    }

    public function duplicate(User $user, Election $election): bool
    {
        if ($user->isSuperAdmin()) return true;

        return $user->can('create-elections')
            && $user->organization_id === $election->organization_id;
    }

    public function updateStatus(User $user, Election $election): bool
    {
        if ($user->isSuperAdmin()) return ! $election->isImmutable();

        return $user->can('edit-elections')
            && $user->organization_id === $election->organization_id
            && ! $election->isImmutable();
    }

    public function togglePublicResult(User $user, Election $election): bool
    {
        if ($user->isSuperAdmin()) return true;

        return $user->can('edit-elections')
            && $user->organization_id === $election->organization_id;
    }
}
