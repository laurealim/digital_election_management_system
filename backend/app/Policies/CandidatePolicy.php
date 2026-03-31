<?php

namespace App\Policies;

use App\Models\Candidate;
use App\Models\Post;
use App\Models\User;

class CandidatePolicy
{
    public function viewAny(User $user, Post $post): bool
    {
        if ($user->isSuperAdmin()) return true;

        return $user->can('view-elections')
            && $user->organization_id === $post->organization_id;
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
