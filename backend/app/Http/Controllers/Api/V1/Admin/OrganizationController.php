<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\ApiController;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class OrganizationController extends ApiController
{
    /**
     * POST /api/v1/admin/organizations — super admin creates org + admin.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'           => ['required', 'string', 'max:255'],
            'type'           => ['required', Rule::in(['govt', 'private', 'association', 'cooperative', 'ngo', 'education'])],
            'email'          => ['required', 'email', 'max:191', 'unique:organizations,email'],
            'phone'          => ['required', 'string', 'max:20'],
            'address'        => ['nullable', 'string', 'max:1000'],
            'admin_name'     => ['required', 'string', 'max:255'],
            'admin_email'    => ['required', 'email', 'max:191', 'unique:users,email'],
            'admin_password' => ['required', 'string', 'min:8'],
        ]);

        $organization = DB::transaction(function () use ($validated) {
            $org = Organization::create([
                'name'              => $validated['name'],
                'type'              => $validated['type'],
                'email'             => $validated['email'],
                'phone'             => $validated['phone'],
                'address'           => $validated['address'] ?? null,
                'email_verified_at' => now(),
                'is_active'         => true,
            ]);

            $admin = User::create([
                'organization_id' => $org->id,
                'name'            => $validated['admin_name'],
                'email'           => $validated['admin_email'],
                'password'        => Hash::make($validated['admin_password']),
                'password_set_at' => now(),
                'is_active'       => true,
            ]);

            $admin->assignRole('org_admin');

            return $org;
        });

        $organization->loadCount('users', 'elections');

        return $this->created($organization, 'Organization created successfully.');
    }

    /**
     * GET /api/v1/admin/organizations — list all organizations.
     */
    public function index(Request $request): JsonResponse
    {
        $organizations = Organization::query()
            ->when($request->search, fn ($q, $search) =>
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
            )
            ->when($request->type, fn ($q, $type) => $q->where('type', $type))
            ->when($request->status === 'active',   fn ($q) => $q->where('is_active', true))
            ->when($request->status === 'inactive', fn ($q) => $q->where('is_active', false))
            ->withCount('users', 'elections')
            ->latest()
            ->paginate(15);

        return $this->paginated($organizations);
    }

    /**
     * GET /api/v1/admin/organizations/{organization}
     */
    public function show(Organization $organization): JsonResponse
    {
        $organization->loadCount('users', 'elections');

        return $this->success([
            'id'                => $organization->id,
            'name'              => $organization->name,
            'type'              => $organization->type,
            'email'             => $organization->email,
            'phone'             => $organization->phone,
            'address'           => $organization->address,
            'is_active'         => $organization->is_active,
            'email_verified_at' => $organization->email_verified_at?->toDateTimeString(),
            'users_count'       => $organization->users_count,
            'elections_count'   => $organization->elections_count,
            'created_at'        => $organization->created_at?->toDateTimeString(),
        ]);
    }

    /**
     * PATCH /api/v1/admin/organizations/{organization}/toggle-status
     */
    public function toggleStatus(Organization $organization): JsonResponse
    {
        $organization->update(['is_active' => ! $organization->is_active]);

        $status = $organization->is_active ? 'activated' : 'deactivated';

        return $this->success(
            ['is_active' => $organization->is_active],
            "Organization {$status} successfully."
        );
    }
}
