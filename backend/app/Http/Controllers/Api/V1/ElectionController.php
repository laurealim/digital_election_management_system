<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Election\CreateElectionRequest;
use App\Http\Requests\Api\V1\Election\UpdateElectionRequest;
use App\Models\Election;
use App\Models\Voter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ElectionController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Election::class);

        $user = $request->user();

        $query = Election::query()
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            // Voters and candidates only see elections they are enrolled in
            ->when(
                $user->hasAnyRole(['voter', 'candidate']),
                fn ($q) => $q->whereHas('voters', fn ($vq) => $vq->where('user_id', $user->id))
            )
            ->latest('election_date');

        $paginated = $query->paginate($request->per_page ?? 15);

        // Append has_voted flag for voter/candidate users (single extra query, no N+1)
        if ($user->hasAnyRole(['voter', 'candidate'])) {
            $electionIds = $paginated->pluck('id');
            $votedIds    = Voter::where('user_id', $user->id)
                ->whereIn('election_id', $electionIds)
                ->where('has_voted', true)
                ->pluck('election_id')
                ->flip();

            $paginated->getCollection()->transform(function ($election) use ($votedIds) {
                $election->has_voted = isset($votedIds[$election->id]);
                return $election;
            });
        }

        return $this->paginated($paginated);
    }

    public function store(CreateElectionRequest $request): JsonResponse
    {
        $this->authorize('create', Election::class);

        $election = Election::create([
            'name'              => $request->name,
            'description'       => $request->description,
            'election_date'     => $request->election_date,
            'voting_start_time' => $request->voting_start_time,
            'voting_end_time'   => $request->voting_end_time,
            'candidate_mode'    => $request->input('candidate_mode', 'selected'),
            'allow_multi_post'  => $request->boolean('allow_multi_post', false),
            'status'            => 'draft',
        ]);

        return $this->created($election);
    }

    public function show(Election $election): JsonResponse
    {
        $this->authorize('view', $election);

        $election->load(['posts', 'organization:id,name']);

        return $this->success($election);
    }

    public function update(UpdateElectionRequest $request, Election $election): JsonResponse
    {
        $this->authorize('update', $election);

        $election->update($request->only([
            'name',
            'description',
            'election_date',
            'voting_start_time',
            'voting_end_time',
            'candidate_mode',
            'allow_multi_post',
        ]));

        return $this->success($election->fresh());
    }

    public function destroy(Election $election): JsonResponse
    {
        $this->authorize('delete', $election);

        $election->delete();

        return $this->noContent();
    }

    public function updateStatus(Request $request, Election $election): JsonResponse
    {
        $this->authorize('updateStatus', $election);

        $request->validate([
            'status' => ['required', 'in:draft,scheduled,active,completed,cancelled'],
        ]);

        $newStatus = $request->status;
        $current   = $election->status;

        $allowed = $this->allowedTransitions($current);

        if (! in_array($newStatus, $allowed)) {
            return $this->error(
                "Cannot transition election from '{$current}' to '{$newStatus}'.",
                422
            );
        }

        $updateData = ['status' => $newStatus];

        // Auto-publish results and stamp completion time when manually completing
        if ($newStatus === 'completed') {
            $updateData['is_result_published'] = true;
            $updateData['completed_at']        = now();
        }

        $election->update($updateData);

        return $this->success($election->fresh());
    }

    public function duplicate(Election $election): JsonResponse
    {
        $this->authorize('duplicate', $election);

        $copy = $election->replicate([
            'status',
            'is_result_published',
            'completed_at',
        ]);

        $copy->name   = $election->name . ' (Copy)';
        $copy->status = 'draft';
        $copy->is_result_published = false;
        $copy->completed_at = null;
        $copy->save();

        // Duplicate posts without candidates
        foreach ($election->posts as $post) {
            $copy->posts()->create([
                'title'            => $post->title,
                'description'      => $post->description,
                'max_votes'        => $post->max_votes,
                'order'            => $post->order,
            ]);
        }

        return $this->created($copy->load('posts'));
    }

    /**
     * PATCH /elections/{election}/public-result
     * Toggle whether this election's results appear on the public /results page.
     * Only org_admin and election_admin may call this.
     */
    public function togglePublicResult(Election $election): JsonResponse
    {
        $this->authorize('togglePublicResult', $election);

        $election->update(['is_public_result' => ! $election->is_public_result]);

        return $this->success(
            $election->fresh(),
            $election->is_public_result
                ? 'Results are now publicly visible.'
                : 'Results are no longer publicly visible.'
        );
    }

    /**
     * PATCH /elections/{election}/public-voter-list
     * Toggle whether this election's voter list appears on the public landing page.
     */
    public function togglePublicVoterList(Election $election): JsonResponse
    {
        $this->authorize('togglePublicResult', $election);

        $election->update(['is_public_voter_list' => ! $election->is_public_voter_list]);

        return $this->success(
            $election->fresh(),
            $election->is_public_voter_list
                ? 'Voter list is now publicly visible.'
                : 'Voter list is no longer publicly visible.'
        );
    }

    private function allowedTransitions(string $current): array
    {
        return match ($current) {
            'draft'      => ['scheduled', 'cancelled'],
            'scheduled'  => ['draft', 'active', 'cancelled'],
            'active'     => ['completed', 'cancelled'],
            default      => [],
        };
    }
}
