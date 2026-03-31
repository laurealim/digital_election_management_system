<?php

namespace App\Policies;

use App\Models\Election;
use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    public function viewAny(User $user, Election $election): bool
    {
        if ($user->isSuperAdmin()) return true;

        return $user->can('view-elections')
            && $user->organization_id === $election->organization_id;
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
