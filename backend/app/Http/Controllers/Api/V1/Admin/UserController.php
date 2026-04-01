<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\ApiController;
use App\Jobs\SendPasswordResetMailJob;
use App\Models\Organization;
use App\Models\User;
use App\Services\PasswordResetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends ApiController
{
    // Roles that can be created/managed via this controller (no voter/candidate)
    const STAFF_ROLES = ['super_admin', 'org_admin', 'org_user', 'election_admin', 'election_user', 'moderator'];

    public function __construct(private readonly PasswordResetService $passwordResetService) {}

    /**
     * GET /api/v1/admin/users
     * List all staff users (excludes voter/candidate-only users).
     */
    public function index(Request $request): JsonResponse
    {
        $nonModeratorStaff = array_diff(self::STAFF_ROLES, ['moderator']);

        $query = User::withoutGlobalScopes()
            ->with(['roles:id,name', 'organization:id,name'])
            ->whereHas('roles', fn ($q) => $q->whereIn('name', self::STAFF_ROLES))
            // Exclude voter-moderators: users whose only staff role is 'moderator'
            // AND who also have voter/candidate role (assigned via election tab).
            // Pure staff moderators (created via admin users) are kept.
            ->where(function ($q) use ($nonModeratorStaff) {
                $q->whereHas('roles', fn ($r) => $r->whereIn('name', $nonModeratorStaff))
                   ->orWhere(function ($q2) {
                       $q2->whereHas('roles', fn ($r) => $r->where('name', 'moderator'))
                          ->whereDoesntHave('roles', fn ($r) => $r->whereIn('name', ['voter', 'candidate']));
                   });
            })
            ->when($request->organization_id, fn ($q, $id) =>
                $q->where('organization_id', $id)
            )
            ->when($request->search, fn ($q, $s) =>
                $q->where(fn ($q2) =>
                    $q2->where('name', 'like', "%{$s}%")
                       ->orWhere('email', 'like', "%{$s}%")
                )
            )
            ->latest();

        $paginator = $query->paginate($request->integer('per_page', 20));

        $paginator->getCollection()->transform(fn ($user) => $this->formatUser($user));

        return $this->paginated($paginator);
    }

    /**
     * POST /api/v1/admin/users
     * Create a staff user, assign one or more roles, send password-setup email.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'            => ['required', 'string', 'max:255'],
            'email'           => ['required', 'email', 'max:191', 'unique:users,email'],
            'roles'           => ['required', 'array', 'min:1'],
            'roles.*'         => ['string', Rule::in(self::STAFF_ROLES)],
            'organization_id' => [
                Rule::requiredIf(fn () => ! in_array('super_admin', $request->roles ?? [])),
                'nullable', 'integer', 'exists:organizations,id',
            ],
            'mobile'          => ['nullable', 'string', 'max:20'],
            'designation'     => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::create([
            'name'            => $validated['name'],
            'email'           => $validated['email'],
            'organization_id' => $validated['organization_id'] ?? null,
            'mobile'          => $validated['mobile'] ?? null,
            'designation'     => $validated['designation'] ?? null,
            'password'        => null,
            'is_active'       => false,
        ]);

        $user->syncRoles($validated['roles']);

        // Send password setup email
        try {
            $token = $this->passwordResetService->generateToken($user->email, 'setup');
            SendPasswordResetMailJob::dispatchSync($user, $token, 'setup');
            $user->update(['setup_email_status' => 'sent']);
        } catch (\Throwable $e) {
            \Log::error('Setup email failed for new staff user', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
            ]);
            $user->update(['setup_email_status' => 'failed']);
        }

        return $this->created(
            $this->formatUser($user->load('roles', 'organization')),
            "User created. Password setup email sent to {$user->email}."
        );
    }

    /**
     * PUT /api/v1/admin/users/{user}
     * Update a staff user's profile fields.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name'            => ['sometimes', 'string', 'max:255'],
            'mobile'          => ['nullable', 'string', 'max:20'],
            'designation'     => ['nullable', 'string', 'max:255'],
            'organization_id' => ['nullable', 'integer', 'exists:organizations,id'],
        ]);

        $user->update($validated);

        return $this->success(
            $this->formatUser($user->load('roles', 'organization')),
            'User updated successfully.'
        );
    }

    /**
     * PUT /api/v1/admin/users/{user}/role
     * Sync one or more staff roles for a user (preserves voter/candidate roles).
     */
    public function updateRole(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'roles'   => ['required', 'array', 'min:1'],
            'roles.*' => ['string', Rule::in(self::STAFF_ROLES)],
        ]);

        // Preserve voter/candidate roles if present
        $keep = $user->getRoleNames()
            ->filter(fn ($r) => in_array($r, ['voter', 'candidate']))
            ->values()
            ->toArray();

        $user->syncRoles(array_merge($keep, $request->roles));

        return $this->success(
            $this->formatUser($user->load('roles', 'organization')),
            'Roles updated successfully.'
        );
    }

    /**
     * PATCH /api/v1/admin/users/{user}/toggle-status
     */
    public function toggleStatus(User $user): JsonResponse
    {
        if ($user->id === auth()->id()) {
            return $this->error('You cannot deactivate your own account.', 403);
        }

        $user->update(['is_active' => ! $user->is_active]);

        $msg = $user->is_active ? 'User activated successfully.' : 'User deactivated successfully.';

        return $this->success(['is_active' => $user->is_active], $msg);
    }

    /**
     * POST /api/v1/admin/users/{user}/resend-setup
     */
    public function resendSetupEmail(User $user): JsonResponse
    {
        try {
            $token = $this->passwordResetService->generateToken($user->email, 'setup');
            SendPasswordResetMailJob::dispatchSync($user, $token, 'setup');
            $user->update(['setup_email_status' => 'sent']);
        } catch (\Throwable $e) {
            \Log::error('Resend setup email failed', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
            ]);
            $user->update(['setup_email_status' => 'failed']);
            return $this->error('সেটআপ ইমেইল পাঠাতে ব্যর্থ হয়েছে।', 500);
        }

        return $this->success(
            ['setup_email_status' => 'sent'],
            "Setup email resent to {$user->email}."
        );
    }

    /**
     * DELETE /api/v1/admin/users/{user}
     * Deactivate a staff user and strip roles.
     */
    public function destroy(User $user): JsonResponse
    {
        if ($user->id === auth()->id()) {
            return $this->error('You cannot delete your own account.', 403);
        }

        $user->update(['is_active' => false]);
        $user->syncRoles([]);

        return $this->success(null, 'User deactivated successfully.');
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private function formatUser(User $user): array
    {
        $staffRoles = $user->roles->pluck('name')->intersect(self::STAFF_ROLES)->values();

        return [
            'id'           => $user->id,
            'name'         => $user->name,
            'email'        => $user->email,
            'mobile'       => $user->mobile,
            'designation'  => $user->designation,
            'is_active'    => $user->is_active,
            'roles'        => $staffRoles->values(),
            'organization' => $user->organization?->name,
            'org_id'       => $user->organization_id,
            'setup_email_status' => $user->setup_email_status,
            'assigned_election_ids' => $user->assignedElections()->pluck('elections.id')->values(),
            'created_at'         => $user->created_at?->toDateTimeString(),
        ];
    }

    /**
     * GET /api/v1/admin/users/{user}/assigned-elections
     * List elections assigned to a moderator user.
     */
    public function assignedElections(User $user): JsonResponse
    {
        return $this->success([
            'election_ids' => $user->assignedElections()->pluck('elections.id')->values(),
            'elections'    => $user->assignedElections()
                ->select('elections.id', 'elections.name', 'elections.status')
                ->get(),
        ]);
    }

    /**
     * PUT /api/v1/admin/users/{user}/assigned-elections
     * Sync assigned elections for a moderator user.
     */
    public function syncAssignedElections(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'election_ids'   => ['required', 'array'],
            'election_ids.*' => ['integer', 'exists:elections,id'],
        ]);

        $user->assignedElections()->sync($request->election_ids);

        return $this->success([
            'election_ids' => $user->assignedElections()->pluck('elections.id')->values(),
        ], 'Elections assigned successfully.');
    }
}
