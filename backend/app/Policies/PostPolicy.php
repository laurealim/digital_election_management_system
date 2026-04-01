<?php

namespace App\Policies;

use App\Models\Election;
use App\Models\Post;
use App\Models\User;
use App\Models\Voter;

class PostPolicy
{
    public function viewAny(User $user, Election $election): bool
    {
        if ($user->isSuperAdmin()) return true;

        // Management roles with view-elections permission
        if ($user->can('view-elections')
            && $user->organization_id === $election->organization_id) {
            return true;
        }

        // Voters/candidates enrolled in the election can view posts (ballot page)
        if ($user->can('cast-vote')) {
            return Voter::where('election_id', $election->id)
                ->where('user_id', $user->id)
                ->exists();
        }

        return false;
    }

    public function create(User $user, Election $election): bool
    {
        if ($user->isSuperAdmin()) return $election->isEditable();

        return $user->can('manage-posts')
            && $user->organization_id === $election->organization_id
            && $election->isEditable();
    }

    public function update(User $user, Post $post): bool
    {
        if ($user->isSuperAdmin()) return $post->election->isEditable();

        return $user->can('manage-posts')
            && $user->organization_id === $post->organization_id
            && $post->election->isEditable();
    }

    public function delete(User $user, Post $post): bool
    {
        if ($user->isSuperAdmin()) return $post->election->isEditable();

        return $user->can('manage-posts')
            && $user->organization_id === $post->organization_id
            && $post->election->isEditable();
    }
}
