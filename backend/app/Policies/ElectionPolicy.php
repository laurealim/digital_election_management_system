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

        if (! $user->can('edit-elections') || ! $election->isEditable()) return false;

        return $this->hasElectionAccess($user, $election);
    }

    public function delete(User $user, Election $election): bool
    {
        if ($user->isSuperAdmin()) return $election->isEditable();

        if (! $user->can('delete-elections') || ! $election->isEditable()) return false;

        return $this->hasElectionAccess($user, $election);
    }

    public function duplicate(User $user, Election $election): bool
    {
        if ($user->isSuperAdmin()) return true;

        if (! $user->can('create-elections')) return false;

        return $this->hasElectionAccess($user, $election);
    }

    public function updateStatus(User $user, Election $election): bool
    {
        if ($user->isSuperAdmin()) return ! $election->isImmutable();

        if (! $user->can('edit-elections') || $election->isImmutable()) return false;

        return $this->hasElectionAccess($user, $election);
    }

    public function togglePublicResult(User $user, Election $election): bool
    {
        if ($user->isSuperAdmin()) return true;

        if (! $user->can('edit-elections')) return false;

        return $this->hasElectionAccess($user, $election);
    }

    /**
     * org_admin / org_user — access by organization_id.
     * election_admin / election_user — org match OR explicit moderator_election assignment.
     */
    private function hasElectionAccess(User $user, Election $election): bool
    {
        if ($user->hasAnyRole(['org_admin', 'org_user'])) {
            return $user->organization_id === $election->organization_id;
        }

        if ($user->hasAnyRole(['election_admin', 'election_user'])) {
            // Allow if same org
            if ($user->organization_id && $user->organization_id === $election->organization_id) {
                return true;
            }
            // Allow if explicitly assigned via moderator_election pivot
            return $user->assignedElections()
                ->whereKey($election->id)
                ->exists();
        }

        return false;
    }
}
