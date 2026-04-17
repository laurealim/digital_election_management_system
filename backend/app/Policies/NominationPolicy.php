<?php

namespace App\Policies;

use App\Models\Election;
use App\Models\Nomination;
use App\Models\User;

class NominationPolicy
{
    /**
     * Super admin bypasses all policy checks.
     */
    public function before(User $user): ?bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return null;
    }

    /**
     * EC can view nominations for elections in their own org.
     */
    public function viewAny(User $user, Election $election): bool
    {
        return $user->hasPermissionTo('manage-nominations')
            && $user->organization_id === $election->organization_id;
    }

    public function view(User $user, Nomination $nomination): bool
    {
        return $user->hasPermissionTo('manage-nominations')
            && $user->organization_id === $nomination->organization_id;
    }

    public function verify(User $user, Nomination $nomination): bool
    {
        return $user->hasPermissionTo('manage-nominations')
            && $user->organization_id === $nomination->organization_id
            && $nomination->isPending();
    }

    public function reject(User $user, Nomination $nomination): bool
    {
        return $user->hasPermissionTo('manage-nominations')
            && $user->organization_id === $nomination->organization_id
            && in_array($nomination->status, ['pending', 'verified']);
    }

    public function markPaid(User $user, Nomination $nomination): bool
    {
        return $user->hasPermissionTo('manage-nominations')
            && $user->organization_id === $nomination->organization_id
            && $nomination->isVerified();
    }

    public function accept(User $user, Nomination $nomination): bool
    {
        return $user->hasPermissionTo('manage-nominations')
            && $user->organization_id === $nomination->organization_id
            && $nomination->isVerified()
            && $nomination->payment_status === true;
    }
}