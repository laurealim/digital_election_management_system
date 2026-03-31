<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Election;
use App\Services\ResultService;
use Illuminate\Http\JsonResponse;

class PublicResultController extends ApiController
{
    public function __construct(private readonly ResultService $resultService) {}

    /**
     * GET /api/v1/public/results
     * List elections with published results — no auth required.
     */
    public function index(): JsonResponse
    {
        $elections = Election::where('is_public_result', true)
            ->where('is_result_published', true)
            ->with('organization:id,name')
            ->withCount('posts', 'voters')
            ->latest('completed_at')
            ->paginate(12);

        $elections->getCollection()->transform(function ($election) {
            $votedCount = $election->voters()->where('has_voted', true)->count();

            return [
                'id'            => $election->id,
                'name'          => $election->name,
                'organization'  => $election->organization->name,
                'election_date' => $election->election_date->format('Y-m-d'),
                'completed_at'  => $election->completed_at?->toIso8601String(),
                'status'        => $election->status,
                'posts_count'   => $election->posts_count,
                'voters_count'  => $election->voters_count,
                'voted_count'   => $votedCount,
                'turnout_pct'   => $election->voters_count > 0
                    ? round(($votedCount / $election->voters_count) * 100, 1)
                    : 0,
            ];
        });

        return $this->paginated($elections);
    }

    /**
     * GET /api/v1/public/results/{id}
     * Full results for a single published election — no auth required.
     */
    public function show(int $id): JsonResponse
    {
        $election = Election::where('id', $id)
            ->where('is_public_result', true)
            ->where('is_result_published', true)
            ->firstOrFail();

        return $this->success($this->resultService->getResults($election));
    }
}
