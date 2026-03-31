<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\ResultsExport;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\Vote;
use App\Services\ResultService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ResultController extends ApiController
{
    public function __construct(private readonly ResultService $resultService) {}

    public function show(Request $request, Election $election): JsonResponse
    {
        $this->authorize('view', $election);

        if (! $this->canViewResults($request, $election)) {
            return $this->error('Results have not been published yet.', 403);
        }

        $results = $this->resultService->getResults($election);

        return $this->success($results);
    }

    public function exportPdf(Request $request, Election $election): mixed
    {
        $this->authorize('view', $election);

        if (! $this->canViewResults($request, $election)) {
            return $this->error('Results have not been published yet.', 403);
        }

        $results  = $this->resultService->getResults($election);
        $filename = $this->filename($election, 'pdf');

        $pdf = Pdf::loadView('pdf.election-results', ['results' => $results])
            ->setPaper('a4', 'portrait');

        return $pdf->download($filename);
    }

    public function exportExcel(Request $request, Election $election): mixed
    {
        $this->authorize('view', $election);

        if (! $this->canViewResults($request, $election)) {
            return $this->error('Results have not been published yet.', 403);
        }

        $results  = $this->resultService->getResults($election);
        $filename = $this->filename($election, 'xlsx');

        return Excel::download(new ResultsExport($results), $filename);
    }

    /**
     * GET /api/v1/elections/{election}/results/mine
     * Returns the authenticated candidate's own vote tally per post.
     */
    public function myCandidateResults(Request $request, Election $election): JsonResponse
    {
        $this->authorize('view', $election);

        $user = $request->user();

        if (! $user->isSuperAdmin() && ! $user->can('view-own-candidate-results')) {
            return $this->error('Only candidates can access this endpoint.', 403);
        }

        if (! $election->is_result_published) {
            return $this->error('Results have not been published yet.', 403);
        }

        // Find the candidate records for this user in this election
        $candidateRecords = Candidate::where('election_id', $election->id)
            ->where('user_id', $user->id)
            ->with('post:id,title,max_votes')
            ->get();

        $data = $candidateRecords->map(function ($candidate) use ($election) {
            $votesReceived = Vote::where('election_id', $election->id)
                ->where('candidate_id', $candidate->id)
                ->count();

            $totalVotesForPost = Vote::where('election_id', $election->id)
                ->where('post_id', $candidate->post_id)
                ->count();

            return [
                'post_id'            => $candidate->post_id,
                'post_title'         => $candidate->post->title ?? '—',
                'candidate_id'       => $candidate->id,
                'votes_received'     => $votesReceived,
                'total_votes_cast'   => $totalVotesForPost,
                'percentage'         => $totalVotesForPost > 0
                    ? round(($votesReceived / $totalVotesForPost) * 100, 1)
                    : 0,
            ];
        });

        return $this->success([
            'election' => ['id' => $election->id, 'name' => $election->name],
            'posts'    => $data->values()->all(),
        ]);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function canViewResults(Request $request, Election $election): bool
    {
        $user = $request->user();

        // Super admin always sees results
        if ($user->isSuperAdmin()) return true;

        // Users with view-detailed-reports can always see results regardless of publish status
        if ($user->can('view-detailed-reports')) return true;

        // Everyone else (voters, candidates) only see published results
        return $election->is_result_published;
    }

    private function filename(Election $election, string $ext): string
    {
        $slug = str($election->name)->slug('-')->limit(40);
        return "results-{$slug}-{$election->election_date->format('Y-m-d')}.{$ext}";
    }
}
