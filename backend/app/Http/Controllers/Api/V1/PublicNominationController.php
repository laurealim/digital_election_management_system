<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\StoreNominationRequest;
use App\Models\Election;
use App\Models\Nomination;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Mccarlosen\LaravelMpdf\Facades\LaravelMpdf as PDF;

class PublicNominationController extends ApiController
{
    /**
     * GET /public/designations
     * Return the designations lookup array (key => label).
     */
    public function designations(): JsonResponse
    {
        return $this->success(config('constants.designations'));
    }

    /**
     * GET /public/elections
     * List elections that are open for nomination (status = published).
     */
    public function elections(Request $request): JsonResponse
    {
        $elections = Election::withoutGlobalScopes()
            ->where('status', 'published')
            ->where('candidate_mode', 'nominated')
            ->with(['organization:id,name', 'posts:id,election_id,title'])
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->latest()
            ->paginate($request->per_page ?? 12);

        return $this->paginated($elections);
    }

    /**
     * POST /public/nominations
     * Submit a nomination application.
     */
    public function store(StoreNominationRequest $request): JsonResponse
    {
        $election = Election::withoutGlobalScopes()
            ->with('posts')
            ->findOrFail($request->election_id);

        if (! $election->isNominationOpen()) {
            return $this->error('Nominations are not open for this election.', 422);
        }

        // Check duplicate email per election (skipped when allow_multi_post is true,
        // because the same person may apply for multiple posts separately)
        if (! $election->allow_multi_post) {
            $duplicate = Nomination::withoutGlobalScopes()
                ->where('election_id', $election->id)
                ->where('email', $request->email)
                ->exists();

            if ($duplicate) {
                return $this->error(
                    'এই ইমেইল দিয়ে ইতিমধ্যে মনোনয়ন জমা দেওয়া হয়েছে।',
                    422,
                    ['email' => ['এই ইমেইল দিয়ে ইতিমধ্যে মনোনয়ন জমা দেওয়া হয়েছে।']]
                );
            }
        }

        // Validate posts belong to this election
        $validPostIds = $election->posts->pluck('id')->toArray();
        $requestedIds = $request->post_ids;
        $invalid = array_diff($requestedIds, $validPostIds);

        if (! empty($invalid)) {
            return $this->error('One or more selected posts do not belong to this election.', 422);
        }

        // Enforce single-post nomination when allow_multi_post is false
        if (! $election->allow_multi_post && count($requestedIds) > 1) {
            return $this->error('This election only allows nomination for a single post.', 422);
        }

        $nomination = DB::transaction(function () use ($election, $request, $requestedIds) {
            $nomination = Nomination::create([
                'election_id'        => $election->id,
                'organization_id'    => $election->organization_id,
                'token_number'       => Nomination::generateToken(),
                'name'               => $request->name,
                'father_name'        => $request->father_name,
                'mother_name'        => $request->mother_name,
                'nid'                => $request->nid,
                'designation'        => $request->designation,
                'address'            => $request->address,
                'email'              => $request->email,
                'mobile'             => $request->mobile,
                'organization_name'  => $request->organization_name,
                'status'             => 'pending',
            ]);

            $nomination->posts()->attach($requestedIds);
            $nomination->logTransition(null, null, 'Nomination submitted');

            return $nomination;
        });

        $nomination->load('posts:id,title');

        return $this->created([
            'token_number' => $nomination->token_number,
            'nomination'   => $nomination,
        ]);
    }

    /**
     * GET /public/nominations/track
     * Track nomination by token OR by email+mobile.
     */
    public function track(Request $request): JsonResponse
    {
        $request->validate([
            'token'  => ['nullable', 'string'],
            'email'  => ['nullable', 'email'],
            'mobile' => ['nullable', 'string'],
        ]);

        $query = Nomination::withoutGlobalScopes()
            ->with(['posts:id,title', 'election:id,name,status', 'statusLogs']);

        if ($request->token) {
            $nomination = $query->where('token_number', strtoupper($request->token))->first();
        } elseif ($request->email && $request->mobile) {
            $nomination = $query
                ->where('email', $request->email)
                ->where('mobile', $request->mobile)
                ->latest()
                ->first();
        } else {
            return $this->error('Provide a token number, or both email and mobile number.', 422);
        }

        if (! $nomination) {
            return $this->error('Nomination not found.', 404);
        }

        return $this->success($nomination);
    }

    /**
     * GET /public/nominations/{token}/pdf
     * Download nomination form as PDF (rendered with mPDF for proper Bengali text shaping).
     */
    public function downloadPdf(string $token): Response
    {
        $nomination = Nomination::withoutGlobalScopes()
            ->with([
                'posts:id,title',
                'election:id,name,election_date,voting_start_time,voting_end_time,organization_id',
                'organization:id,name',
                'approvedBy:id,name',
                'statusLogs',
            ])
            ->where('token_number', strtoupper($token))
            ->firstOrFail();

        if ($nomination->isAccepted()) {
            $pdf      = PDF::loadView('pdf.nomination-acceptance', compact('nomination'));
            $filename = "acceptance-{$nomination->token_number}.pdf";
        } else {
            $pdf      = PDF::loadView('pdf.nomination-form', compact('nomination'));
            $filename = "nomination-{$nomination->token_number}.pdf";
        }

        return $pdf->download($filename);
    }
}