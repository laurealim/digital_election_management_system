<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Election;
use Illuminate\Http\JsonResponse;

class PublicVoterListController extends ApiController
{
    /**
     * GET /api/v1/public/voter-list
     * Returns elections that have public voter list enabled.
     */
    public function index(): JsonResponse
    {
        $elections = Election::where('is_public_voter_list', true)
            ->with('organization:id,name')
            ->withCount('voters')
            ->latest('election_date')
            ->get()
            ->map(fn ($e) => [
                'id'            => $e->id,
                'name'          => $e->name,
                'organization'  => $e->organization->name,
                'election_date' => $e->election_date->format('Y-m-d'),
                'voters_count'  => $e->voters_count,
            ]);

        return $this->success($elections);
    }

    /**
     * GET /api/v1/public/voter-list/{id}
     * Returns voters grouped by designation for a public election.
     */
    public function show(int $id): JsonResponse
    {
        $election = Election::where('id', $id)
            ->where('is_public_voter_list', true)
            ->with('organization:id,name')
            ->firstOrFail();

        $voters = $election->voters()
            ->with('user:id,name,email,mobile,designation,office_name')
            ->get()
            ->map(fn ($v) => [
                'id'          => $v->id,
                'name'        => $v->user->name ?? '',
                'email'       => $v->user->email ?? '',
                'mobile'      => $v->user->mobile ?? '',
                'designation' => $v->user->designation ?? 'অন্যান্য',
                'office_name' => $v->user->office_name ?? '',
            ])
            ->sortBy('name')
            ->values();

        // Group by designation
        $designations = $voters->groupBy('designation')
            ->map(fn ($group, $key) => [
                'designation' => $key,
                'count'       => $group->count(),
                'voters'      => $group->values(),
            ])
            ->sortBy('designation')
            ->values();

        return $this->success([
            'election' => [
                'id'            => $election->id,
                'name'          => $election->name,
                'organization'  => $election->organization->name,
                'election_date' => $election->election_date->format('Y-m-d'),
            ],
            'total_voters'  => $voters->count(),
            'designations'  => $designations,
        ]);
    }
}
