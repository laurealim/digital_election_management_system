<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Organization\RegisterOrganizationRequest;
use App\Http\Requests\Api\V1\Organization\UpdateOrganizationRequest;
use App\Jobs\SendOrganizationVerificationMailJob;
use App\Jobs\SendPasswordResetMailJob;
use App\Models\Organization;
use App\Models\User;
use App\Services\PasswordResetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class OrganizationController extends ApiController
{
    public function __construct(private PasswordResetService $passwordResetService) {}

    /**
     * POST /api/v1/organizations — public registration.
     * Creates the org + admin account, then sends:
     *   1. Org verification email  → org email
     *   2. Password setup email    → admin email
     */
    public function store(RegisterOrganizationRequest $request): JsonResponse
    {
        [$organization, $admin] = DB::transaction(function () use ($request) {
            $org = Organization::create([
                'name'    => $request->name,
                'type'    => $request->type,
                'email'   => $request->email,
                'phone'   => $request->phone,
                'address' => $request->address,
            ]);

            $user = User::create([
                'organization_id' => $org->id,
                'name'            => $request->admin_name,
                'email'           => $request->admin_email,
                'mobile'          => $request->admin_mobile,
                'designation'     => $request->admin_designation,
                'password'        => null,
                'is_active'       => false,
            ]);

            $user->assignRole('org_admin');

            return [$org, $user];
        });

        // Generate setup token before attempting mail
        $token = $this->passwordResetService->generateToken($admin->email, 'setup');

        try {
            SendOrganizationVerificationMailJob::dispatchSync($organization);
            SendPasswordResetMailJob::dispatchSync($admin, $token, 'setup');
        } catch (\Throwable $e) {
            \Log::error('Organization registration mail failed', [
                'org_id'      => $organization->id,
                'admin_email' => $admin->email,
                'error'       => $e->getMessage(),
            ]);
        }

        return $this->created(
            $this->formatOrganization($organization),
            "Registration successful. A password setup link has been sent to {$admin->email}. Please check your inbox to activate your account."
        );
    }

    /**
     * GET /api/v1/organizations/{id}/verify — signed email verification link.
     */
    public function verify(int $id): JsonResponse
    {
        $organization = Organization::findOrFail($id);

        if ($organization->isVerified()) {
            return $this->success(null, 'Email is already verified.');
        }

        $organization->update(['email_verified_at' => now()]);

        return $this->success(null, 'Email verified successfully. Your organization is now active.');
    }

    /**
     * GET /api/v1/organizations/{organization} — org admin views own org.
     */
    public function show(Organization $organization): JsonResponse
    {
        $this->authorizeOrgAccess($organization);

        return $this->success($this->formatOrganization($organization->load('users')));
    }

    /**
     * PUT /api/v1/organizations/{organization} — org admin updates own org.
     */
    public function update(UpdateOrganizationRequest $request, Organization $organization): JsonResponse
    {
        $this->authorizeOrgAccess($organization);

        $organization->update($request->validated());

        return $this->success(
            $this->formatOrganization($organization->fresh()),
            'Organization updated successfully.'
        );
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function authorizeOrgAccess(Organization $organization): void
    {
        $user = auth()->user();

        if ($user->isSuperAdmin()) {
            return;
        }

        abort_if(
            $user->organization_id !== $organization->id,
            403,
            'You do not have access to this organization.'
        );
    }

    private function formatOrganization(Organization $org): array
    {
        return [
            'id'                => $org->id,
            'name'              => $org->name,
            'type'              => $org->type,
            'email'             => $org->email,
            'phone'             => $org->phone,
            'address'           => $org->address,
            'is_active'         => $org->is_active,
            'email_verified_at' => $org->email_verified_at?->toDateTimeString(),
            'created_at'        => $org->created_at?->toDateTimeString(),
        ];
    }
}
