<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\ApiController;
use App\Models\Election;
use App\Models\SystemSetting;
use App\Models\Voter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LiveElectionController extends ApiController
{
    /**
     * GET /api/v1/admin/live-elections
     *
     * List all active elections with their live display status.
     */
    public function index(): JsonResponse
    {
        $elections = Election::withoutGlobalScopes()
            ->whereIn('status', ['active', 'scheduled'])
            ->with('organization:id,name')
            ->orderByDesc('is_live_display')
            ->orderBy('election_date')
            ->get(['id', 'name', 'organization_id', 'election_date', 'status', 'is_live_display']);

        $elections->each(function ($election) {
            $election->total_voters = Voter::where('election_id', $election->id)->count();
            $election->total_voted  = Voter::where('election_id', $election->id)->where('has_voted', true)->count();
        });

        $refreshInterval = (int) SystemSetting::getValue('live_refresh_interval', 30);

        return $this->success([
            'elections'        => $elections,
            'refresh_interval' => $refreshInterval,
        ]);
    }

    /**
     * PATCH /api/v1/admin/elections/{election}/toggle-live-display
     *
     * Toggle live display for a specific election.
     */
    public function toggleLiveDisplay(Election $election): JsonResponse
    {
        // Resolve without tenant scope
        $election = Election::withoutGlobalScopes()->findOrFail($election->id);

        $election->update(['is_live_display' => !$election->is_live_display]);

        return $this->success(
            $election->fresh(),
            $election->is_live_display
                ? 'Live display enabled for this election.'
                : 'Live display disabled for this election.'
        );
    }

    /**
     * PUT /api/v1/admin/settings/live-refresh-interval
     *
     * Update the live refresh interval (in seconds).
     */
    public function updateRefreshInterval(Request $request): JsonResponse
    {
        $request->validate([
            'interval' => ['required', 'integer', 'min:5', 'max:300'],
        ]);

        SystemSetting::setValue('live_refresh_interval', $request->interval);

        return $this->success(
            ['refresh_interval' => (int) $request->interval],
            'Refresh interval updated.'
        );
    }
}
