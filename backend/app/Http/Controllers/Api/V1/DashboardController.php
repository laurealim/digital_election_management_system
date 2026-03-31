<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\AuditLog;
use App\Models\Election;
use App\Models\Organization;
use App\Models\Voter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends ApiController
{
    /**
     * GET /api/v1/dashboard — org admin stats.
     */
    public function orgAdmin(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->isSuperAdmin() && ! $user->can('view-elections')) {
            return $this->error('Forbidden.', 403);
        }

        $orgId = $user->organization_id;

        $totalElections  = Election::where('organization_id', $orgId)->count();
        $activeElections = Election::where('organization_id', $orgId)->where('status', 'active')->count();
        $draftElections  = Election::where('organization_id', $orgId)->where('status', 'draft')->count();
        $totalVoters     = Voter::where('organization_id', $orgId)->distinct('user_id')->count('user_id');
        $totalVotes      = Voter::where('organization_id', $orgId)->where('has_voted', true)->count();

        // Participation rate (voted / enrolled) per election for chart
        $elections = Election::where('organization_id', $orgId)
            ->whereIn('status', ['active', 'completed'])
            ->orderBy('election_date')
            ->get(['id', 'name', 'election_date', 'status']);

        $participation = $elections->map(function ($election) {
            $total = Voter::where('election_id', $election->id)->count();
            $voted = Voter::where('election_id', $election->id)->where('has_voted', true)->count();
            return [
                'name'         => $election->name,
                'date'         => $election->election_date->format('M j'),
                'total_voters' => $total,
                'voted'        => $voted,
                'turnout_pct'  => $total > 0 ? round(($voted / $total) * 100, 1) : 0,
            ];
        });

        // Status breakdown for pie chart
        $statusCounts = Election::where('organization_id', $orgId)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return $this->success([
            'totals' => [
                'elections'        => $totalElections,
                'active_elections' => $activeElections,
                'draft_elections'  => $draftElections,
                'voters'           => $totalVoters,
                'votes_cast'       => $totalVotes,
            ],
            'participation' => $participation->values()->all(),
            'status_counts' => $statusCounts,
        ]);
    }

    /**
     * GET /api/v1/admin/dashboard — super admin platform stats.
     */
    public function superAdmin(Request $request): JsonResponse
    {
        $totalOrgs      = Organization::count();
        $activeOrgs     = Organization::where('is_active', true)->count();
        $totalElections = Election::withoutGlobalScopes()->count();
        $activeElections= Election::withoutGlobalScopes()->where('status', 'active')->count();
        $totalVoters    = Voter::withoutGlobalScopes()->distinct('user_id')->count('user_id');
        $totalVotes     = Voter::withoutGlobalScopes()->where('has_voted', true)->count();

        // Elections per month (last 6 months)
        $electionsPerMonth = Election::withoutGlobalScopes()
            ->where('created_at', '>=', now()->subMonths(6))
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count")
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('count', 'month');

        // Recent audit log entries (last 20)
        $recentAudit = AuditLog::withoutGlobalScopes()
            ->with('organization:id,name')
            ->latest('created_at')
            ->limit(20)
            ->get(['id', 'organization_id', 'election_id', 'user_id', 'event', 'ip_address', 'created_at']);

        // Orgs by type breakdown
        $orgsByType = Organization::selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type');

        return $this->success([
            'totals' => [
                'organizations'    => $totalOrgs,
                'active_orgs'      => $activeOrgs,
                'total_elections'  => $totalElections,
                'active_elections' => $activeElections,
                'total_voters'     => $totalVoters,
                'votes_cast'       => $totalVotes,
            ],
            'elections_per_month' => $electionsPerMonth,
            'orgs_by_type'        => $orgsByType,
            'recent_audit'        => $recentAudit,
        ]);
    }
}
