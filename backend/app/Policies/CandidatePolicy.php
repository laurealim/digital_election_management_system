<?php

namespace App\Policies;

use App\Models\Candidate;
use App\Models\Post;
use App\Models\User;
use App\Models\Voter;

class CandidatePolicy
{
    public function viewAny(User $user, Post $post): bool
    {
        if ($user->isSuperAdmin()) return true;

        // Management roles with view-elections permission
        if ($user->can('view-elections')
            && $user->organization_id === $post->organization_id) {
            return true;
        }

        // Voters/candidates enrolled in the election can view candidates (ballot page)
        if ($user->can('cast-vote')) {
            return Voter::where('election_id', $post->election_id)
                ->where('user_id', $user->id)
                ->exists();
        }

        return false;
    }

    public function create(User $user, Post $post): bool
    {
        if ($user->isSuperAdmin()) return $post->election->isEditable();

        return $user->can('manage-candidates')
            && $user->organization_id === $post->organization_id
            && $post->election->isEditable();
    }

    public function delete(User $user, Candidate $candidate): bool
    {
        if ($user->isSuperAdmin()) return $candidate->election->isEditable();

        return $user->can('manage-candidates')
            && $user->organization_id === $candidate->organization_id
            && $candidate->election->isEditable();
    }
}
