<?php

namespace App\Services;

use App\Models\Election;
use Illuminate\Support\Collection;

class ResultService
{
    /**
     * Aggregate votes for an election.
     *
     * Returns a structured array ready for JSON, chart rendering, and exports.
     */
    public function getResults(Election $election): array
    {
        $election->load([
            'organization:id,name',
            'posts' => fn ($q) => $q->orderBy('order'),
            'posts.candidates.user:id,name,email,designation',
        ]);

        $posts = $election->posts->map(function ($post) use ($election) {
            // Count votes per candidate for this post
            $voteCounts = \App\Models\Vote::where('election_id', $election->id)
                ->where('post_id', $post->id)
                ->selectRaw('candidate_id, COUNT(*) as vote_count')
                ->groupBy('candidate_id')
                ->pluck('vote_count', 'candidate_id');

            $totalVotes = $voteCounts->sum();

            // Build candidate rows ordered by votes DESC
            $candidates = $post->candidates
                ->map(fn ($candidate) => [
                    'id'         => $candidate->id,
                    'user'       => [
                        'id'          => $candidate->user->id,
                        'name'        => $candidate->user->name,
                        'email'       => $candidate->user->email,
                        'designation' => $candidate->user->designation,
                    ],
                    'bio'        => $candidate->bio,
                    'vote_count' => (int) ($voteCounts[$candidate->id] ?? 0),
                ])
                ->sortByDesc('vote_count')
                ->values();

            // Winners = top max_votes candidates (by vote count)
            $winners = $candidates->take($post->max_votes);

            // Chart data (Chart.js compatible)
            $chart = [
                'labels'   => $candidates->pluck('user.name')->values()->all(),
                'datasets' => [[
                    'data' => $candidates->pluck('vote_count')->values()->all(),
                ]],
            ];

            return [
                'id'          => $post->id,
                'title'       => $post->title,
                'description' => $post->description,
                'max_votes'   => $post->max_votes,
                'total_votes' => $totalVotes,
                'winners'     => $winners->values()->all(),
                'candidates'  => $candidates->all(),
                'chart'       => $chart,
            ];
        });

        $totalVoters   = $election->voters()->count();
        $votedCount    = $election->voters()->where('has_voted', true)->count();
        $turnoutPct    = $totalVoters > 0
            ? round(($votedCount / $totalVoters) * 100, 2)
            : 0;

        return [
            'election' => [
                'id'                   => $election->id,
                'name'                 => $election->name,
                'election_date'        => $election->election_date->format('Y-m-d'),
                'organization'         => $election->organization->name,
                'status'               => $election->status,
                'is_result_published'  => $election->is_result_published,
                'completed_at'         => $election->completed_at?->toIso8601String(),
            ],
            'turnout' => [
                'total_voters'  => $totalVoters,
                'voted_count'   => $votedCount,
                'turnout_pct'   => $turnoutPct,
            ],
            'posts' => $posts->all(),
        ];
    }
}
