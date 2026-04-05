<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\ApiController;
use App\Models\Election;
use App\Models\Organization;
use App\Models\User;
use App\Models\Voter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesController extends ApiController
{
    /**
     * GET /api/v1/admin/roles — list all roles with their permissions.
     */
    public function index(): JsonResponse
    {
        $roles = Role::with('permissions')->get()->map(fn ($role) => [
            'id'          => $role->id,
            'name'        => $role->name,
            'permissions' => $role->permissions->pluck('name'),
        ]);

        $allPermissions = Permission::orderBy('name')->pluck('name');

        return $this->success([
            'roles'       => $roles,
            'permissions' => $allPermissions,
        ]);
    }

    /**
     * PUT /api/v1/admin/roles/{role}/permissions — sync permissions for a role.
     */
    public function updatePermissions(Request $request, Role $role): JsonResponse
    {
        if ($role->name === 'super_admin') {
            return $this->error('Cannot modify super_admin permissions.', 403);
        }

        $request->validate([
            'permissions'   => ['required', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $role->syncPermissions($request->permissions);

        app()->make(PermissionRegistrar::class)->forgetCachedPermissions();

        return $this->success([
            'id'          => $role->id,
            'name'        => $role->name,
            'permissions' => $role->fresh('permissions')->permissions->pluck('name'),
        ]);
    }

    /**
     * GET /api/v1/admin/voters
     *
     * Returns voters of a specific election with their Spatie roles.
     * Query params:
     *   - organization_id (required for super_admin; ignored for org_admin — uses their own org)
     *   - election_id     (required)
     *   - search          (optional, name/email)
     *   - per_page        (default 20)
     */
    public function voters(Request $request): JsonResponse
    {
        $authUser = $request->user();

        $request->validate([
            'election_id'     => ['required', 'integer', 'exists:elections,id'],
            'organization_id' => ['nullable', 'integer', 'exists:organizations,id'],
        ]);

        $electionId = $request->integer('election_id');

        // Super admin can cross orgs; everyone else is scoped to their own org
        $election = $authUser->isSuperAdmin()
            ? Election::withoutGlobalScopes()->findOrFail($electionId)
            : Election::findOrFail($electionId); // TenantScope applies

        $query = Voter::where('election_id', $election->id)
            ->with([
                'user:id,name,email,mobile,office_name,designation',
                'user.roles:id,name',
            ])
            ->when($request->search, function ($q, $s) {
                $q->whereHas('user', fn ($u) =>
                    $u->where('name', 'like', "%{$s}%")
                      ->orWhere('email', 'like', "%{$s}%")
                );
            });

        $paginator = $query->latest()->paginate($request->integer('per_page', 20));

        // Shape each voter for the frontend
        $paginator->getCollection()->transform(function ($voter) {
            return [
                'voter_id'    => $voter->id,
                'has_voted'   => $voter->has_voted,
                'user_id'     => $voter->user?->id,
                'name'        => $voter->user?->name,
                'email'       => $voter->user?->email,
                'mobile'      => $voter->user?->mobile,
                'designation' => $voter->user?->designation,
                'office_name' => $voter->user?->office_name,
                'roles'       => $voter->user?->roles->pluck('name') ?? [],
            ];
        });

        return $this->paginated($paginator);
    }

    /**
     * GET /api/v1/admin/organizations-list
     * Lightweight list of organizations (for filter dropdown, super_admin only).
     */
    public function organizationsList(): JsonResponse
    {
        $orgs = Organization::orderBy('name')
            ->get(['id', 'name']);

        return $this->success($orgs);
    }

    /**
     * GET /api/v1/admin/elections-list?organization_id=X
     * Elections for a given org (for filter dropdown).
     */
    public function electionsList(Request $request): JsonResponse
    {
        $authUser = $request->user();

        $query = $authUser->isSuperAdmin()
            ? Election::withoutGlobalScopes()
            : Election::query();

        if ($request->organization_id) {
            $query->where('organization_id', $request->integer('organization_id'));
        }

        $elections = $query->orderByDesc('election_date')
            ->get(['id', 'name', 'election_date', 'status']);

        return $this->success($elections);
    }

    /**
     * PUT /api/v1/admin/users/{user}/roles
     * Sync multiple roles for a user (voter and/or candidate).
     * Org admins can only assign within their org.
     */
    public function syncRoles(Request $request, User $user): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser->isSuperAdmin() && $user->organization_id !== $authUser->organization_id) {
            return $this->error('Forbidden.', 403);
        }

        $request->validate([
            'roles'   => ['required', 'array', 'min:1'],
            'roles.*' => ['string', 'in:voter,candidate'],
        ]);

        // Always keep voter role; candidate is additive
        $newRoles = $request->roles;
        if (! in_array('voter', $newRoles)) {
            $newRoles[] = 'voter'; // voter is always required
        }

        // Preserve non-voter/candidate roles (e.g. org_admin, election_admin)
        $keepRoles = $user->getRoleNames()
            ->filter(fn ($r) => ! in_array($r, ['voter', 'candidate']))
            ->values()
            ->toArray();

        $user->syncRoles(array_merge($keepRoles, $newRoles));

        return $this->success([
            'user_id' => $user->id,
            'name'    => $user->name,
            'roles'   => $user->fresh()->getRoleNames()->values(),
        ]);
    }
}
