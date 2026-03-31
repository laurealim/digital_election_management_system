<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Election;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends ApiController
{
    public function index(Request $request, Election $election): JsonResponse
    {
        $this->authorize('viewAny', [Post::class, $election]);

        $posts = $election->posts()
            ->withCount('candidates')
            ->get();

        return $this->success($posts);
    }

    public function store(Request $request, Election $election): JsonResponse
    {
        $this->authorize('create', [Post::class, $election]);

        $data = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'max_votes'   => ['sometimes', 'integer', 'min:1', 'max:255'],
            'order'       => ['sometimes', 'integer', 'min:0'],
        ]);

        $post = $election->posts()->create([
            'organization_id' => $request->user()->organization_id,
            'title'           => $data['title'],
            'description'     => $data['description'] ?? null,
            'max_votes'       => $data['max_votes'] ?? 1,
            'order'           => $data['order'] ?? ($election->posts()->max('order') + 1),
        ]);

        return $this->created($post);
    }

    public function update(Request $request, Election $election, Post $post): JsonResponse
    {
        $this->authorize('update', $post);

        $data = $request->validate([
            'title'       => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'max_votes'   => ['sometimes', 'integer', 'min:1', 'max:255'],
            'order'       => ['sometimes', 'integer', 'min:0'],
        ]);

        $post->update($data);

        return $this->success($post->fresh());
    }

    public function destroy(Election $election, Post $post): JsonResponse
    {
        $this->authorize('delete', $post);

        $post->delete();

        return $this->noContent();
    }
}
