<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Voter\StoreVoterRequest;
use App\Exports\VotersExport;
use App\Jobs\SendVoterInvitationJob;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\User;
use App\Models\Voter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class VoterController extends ApiController
{
    public function index(Request $request, Election $election): JsonResponse
    {
        $this->authorize('viewAny', [Voter::class, $election]);

        $voters = $election->voters()
            ->with(['user:id,name,email,mobile,office_name,designation', 'user.roles:id,name'])
            ->when($request->search, function ($q, $s) {
                $q->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%"));
            })
            ->when(isset($request->has_voted), fn ($q) => $q->where('has_voted', $request->boolean('has_voted')))
            ->latest()
            ->paginate($request->per_page ?? 20);

        return $this->paginated($voters);
    }

    public function store(StoreVoterRequest $request, Election $election): JsonResponse
    {
        $this->authorize('create', [Voter::class, $election]);

        $orgId = $election->organization_id;

        $voter = DB::transaction(function () use ($request, $election, $orgId) {
            // Find or create the user within this org
            $user = User::firstOrCreate(
                ['email' => $request->email],
                [
                    'organization_id' => $orgId,
                    'name'            => $request->name,
                    'mobile'          => $request->mobile,
                    'office_name'     => $request->office_name,
                    'designation'     => $request->designation,
                    'password'        => null,
                    'is_active'       => true,
                ]
            );

            // If user already exists, update non-credential fields
            if (! $user->wasRecentlyCreated) {
                $user->fill(array_filter([
                    'name'        => $request->name,
                    'mobile'      => $request->mobile,
                    'office_name' => $request->office_name,
                    'designation' => $request->designation,
                ]))->save();
            }

            // Always ensure voter role
            if (! $user->hasRole('voter')) {
                $user->assignRole('voter');
            }

            // In open mode, also assign candidate role
            if ($election->candidate_mode === 'open' && ! $user->hasRole('candidate')) {
                $user->assignRole('candidate');
            }

            // Enroll in election
            $voter = Voter::create([
                'election_id'     => $election->id,
                'user_id'         => $user->id,
                'organization_id' => $orgId,
            ]);

            // Dispatch invitation email
            // SendVoterInvitationJob::dispatch($user, $election, $voter)
            //     ->onQueue('emails');

            return $voter->load('user:id,name,email,mobile,office_name,designation');
        });

        return $this->created($voter);
    }

    public function destroy(Election $election, Voter $voter): JsonResponse
    {
        $this->authorize('delete', $voter);

        $userId = $voter->user_id;

        $voter->delete();

        // Sync candidate role: remove if no longer in any open-mode election or manual candidacy
        $this->syncCandidateRole($userId);

        return $this->noContent();
    }

    public function update(Request $request, Election $election, Voter $voter): JsonResponse
    {
        $this->authorize('update', $voter);

        $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'mobile'      => ['nullable', 'string', 'max:20'],
            'office_name' => ['nullable', 'string', 'max:255'],
            'designation' => ['nullable', 'string', 'max:255'],
        ]);

        $voter->user->update([
            'name'        => $request->name,
            'mobile'      => $request->mobile,
            'office_name' => $request->office_name,
            'designation' => $request->designation,
        ]);

        return $this->success(
            $voter->load('user:id,name,email,mobile,office_name,designation'),
            'Voter updated successfully.'
        );
    }

    public function export(Election $election)
    {
        $this->authorize('viewAny', [Voter::class, $election]);

        $filename = 'voters-' . str($election->name)->slug() . '.xlsx';

        return Excel::download(new VotersExport($election), $filename);
    }

    public function resendInvitation(Election $election, Voter $voter): JsonResponse
    {
        $this->authorize('resendInvitation', $voter);

        try {
            SendVoterInvitationJob::dispatchSync($voter->user, $election, $voter);
        } catch (\Throwable $e) {
            $voter->update(['invitation_status' => 'failed']);
            \Log::error('Voter invitation resend failed', ['voter_id' => $voter->id, 'error' => $e->getMessage()]);
            return $this->error('ইমেইল পাঠাতে ব্যর্থ হয়েছে।', 500);
        }

        return $this->success(
            ['invitation_status' => 'sent', 'invitation_sent_at' => $voter->fresh()->invitation_sent_at],
            'Invitation resent successfully.'
        );
    }

    /**
     * POST /api/v1/elections/{election}/voters/send-invitations
     * Send invitation emails to selected voters (or all if none specified).
     */
    public function sendBulkInvitations(Request $request, Election $election): JsonResponse
    {
        $this->authorize('viewAny', [Voter::class, $election]);

        $request->validate([
            'voter_ids'   => ['nullable', 'array'],
            'voter_ids.*' => ['integer'],
        ]);

        $voterIds = $request->voter_ids ?? [];

        $query = $election->voters()->with('user');

        if (! empty($voterIds)) {
            $query->whereIn('id', $voterIds);
        }

        $voters = $query->get();
        $sent   = 0;
        $failed = 0;

        foreach ($voters as $voter) {
            try {
                SendVoterInvitationJob::dispatchSync($voter->user, $election, $voter);
                $sent++;
            } catch (\Throwable $e) {
                $voter->update(['invitation_status' => 'failed']);
                \Log::error('Bulk voter invitation failed', ['voter_id' => $voter->id, 'error' => $e->getMessage()]);
                $failed++;
            }
        }

        return $this->success(
            ['sent' => $sent, 'failed' => $failed],
            "{$sent} invitation(s) sent, {$failed} failed."
        );
    }

    /**
     * POST /api/v1/elections/{election}/voters/copy-from/{source}
     * Copy all voters from a source election into this election.
     */
    public function copyFrom(Request $request, Election $election, Election $source): JsonResponse
    {
        $this->authorize('create', [Voter::class, $election]);

        if ($source->organization_id !== $election->organization_id) {
            return $this->error('Source election does not belong to your organization.', 403);
        }

        if ($source->id === $election->id) {
            return $this->error('Cannot copy voters from the same election.', 422);
        }

        $orgId   = $election->organization_id;
        $copied  = 0;
        $skipped = 0;

        $source->voters()->with('user')->each(function ($sourceVoter) use ($election, $orgId, &$copied, &$skipped) {
            $alreadyEnrolled = Voter::where('election_id', $election->id)
                ->where('user_id', $sourceVoter->user_id)
                ->exists();

            if ($alreadyEnrolled) {
                $skipped++;
                return;
            }

            $voter = Voter::create([
                'election_id'     => $election->id,
                'user_id'         => $sourceVoter->user_id,
                'organization_id' => $orgId,
            ]);

            SendVoterInvitationJob::dispatch($sourceVoter->user, $election, $voter)
                ->onQueue('emails');

            $copied++;
        });

        return $this->success(
            ['copied' => $copied, 'skipped' => $skipped],
            "{$copied} voter(s) copied, {$skipped} skipped (already enrolled)."
        );
    }

    public function import(Request $request, Election $election): JsonResponse
    {
        $this->authorize('create', [Voter::class, $election]);

        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:5120'],
        ]);

        $import = new \App\Imports\VotersImport($election, $request->user());
        \Maatwebsite\Excel\Facades\Excel::import($import, $request->file('file'));

        $summary = $import->getSummary();

        if ($summary['imported'] === 0 && count($summary['errors']) > 0) {
            return $this->error('Import failed. See errors for details.', 422, $summary['errors']);
        }

        return $this->success($summary, "Import complete: {$summary['imported']} voter(s) added.");
    }

    /**
     * Recompute the 'candidate' role for a user:
     *   - Keep it if they have any manual Candidate records, OR
     *   - Keep it if they are enrolled in any open-mode election.
     *   - Remove it otherwise.
     */
    private function syncCandidateRole(int $userId): void
    {
        $user = User::find($userId);
        if (! $user) {
            return;
        }

        $hasManualCandidacy = Candidate::where('user_id', $userId)->exists();

        $hasOpenModeCandidacy = Voter::where('user_id', $userId)
            ->whereHas('election', fn ($q) => $q->where('candidate_mode', 'open'))
            ->exists();

        $shouldBeCandidate = $hasManualCandidacy || $hasOpenModeCandidacy;

        if ($shouldBeCandidate && ! $user->hasRole('candidate')) {
            $user->assignRole('candidate');
        } elseif (! $shouldBeCandidate && $user->hasRole('candidate')) {
            $user->removeRole('candidate');
        }
    }

    /**
     * POST /api/v1/elections/{election}/voters/{voter}/toggle-moderator
     * Assign or unassign the moderator role on a voter's user.
     */
    public function toggleModerator(Election $election, Voter $voter): JsonResponse
    {
        $user = request()->user();

        // Only election_admin or super_admin can assign moderators
        if (! $user->isSuperAdmin() && ! $user->can('manage-roles')) {
            // Fallback: election_admin within same org
            if (! $user->isElectionAdmin() || $user->organization_id !== $election->organization_id) {
                return $this->forbidden('You do not have permission to assign moderators.');
            }
        }

        $voterUser = $voter->user;

        if (! $voterUser) {
            return $this->error('Voter has no associated user account.', 404);
        }

        if ($voterUser->hasRole('moderator')) {
            $voterUser->removeRole('moderator');
            $isModerator = false;
        } else {
            $voterUser->assignRole('moderator');
            $isModerator = true;
        }

        return $this->success([
            'voter_id'     => $voter->id,
            'user_id'      => $voterUser->id,
            'is_moderator' => $isModerator,
        ], $isModerator ? 'Moderator role assigned.' : 'Moderator role removed.');
    }
}
