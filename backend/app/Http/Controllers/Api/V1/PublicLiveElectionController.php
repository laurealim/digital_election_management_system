<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Election;
use App\Models\SystemSetting;
use App\Models\Voter;
use Illuminate\Http\JsonResponse;

class PublicLiveElectionController extends ApiController
{
    /**
     * GET /api/v1/public/live-elections
     *
     * Returns live voting stats for elections marked as is_live_display.
     * No authentication required — public endpoint for landing page.
     */
    public function index(): JsonResponse
    {
        $elections = Election::withoutGlobalScopes()
            ->where('is_live_display', true)
            ->where('status', 'active')
            ->get(['id', 'name', 'organization_id', 'election_date', 'voting_start_time', 'voting_end_time']);

        $data = $elections->map(function (Election $election) {
            $totalVoters = Voter::where('election_id', $election->id)->count();
            $totalVoted  = Voter::where('election_id', $election->id)->where('has_voted', true)->count();
            $percentage  = $totalVoters > 0 ? round(($totalVoted / $totalVoters) * 100, 1) : 0;

            return [
                'id'            => $election->id,
                'name'          => $election->name,
                'election_date' => $election->election_date->format('Y-m-d'),
                'voting_start'  => $election->voting_start_time,
                'voting_end'    => $election->voting_end_time,
                'total_voters'  => $totalVoters,
                'total_voted'   => $totalVoted,
                'percentage'    => $percentage,
            ];
        });

        $refreshInterval = (int) SystemSetting::getValue('live_refresh_interval', 30);

        return $this->success([
            'elections'        => $data->values()->all(),
            'refresh_interval' => $refreshInterval,
        ]);
    }
}
