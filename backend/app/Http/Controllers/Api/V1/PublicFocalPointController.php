<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class PublicFocalPointController extends ApiController
{
    /**
     * GET /api/v1/public/focal-points
     * List all moderators (both staff-moderators and voter-moderators) — no auth required.
     * Only exposes name, mobile, designation, and organization.
     */
    public function index(): JsonResponse
    {
        $moderators = User::withoutGlobalScopes()
            ->whereHas('roles', fn ($q) => $q->where('name', 'moderator'))
            ->where('is_active', true)
            ->with('organization:id,name')
            ->select('id', 'name', 'mobile', 'designation', 'organization_id')
            ->orderBy('name')
            ->get()
            ->map(fn ($user) => [
                'name'         => $user->name,
                'mobile'       => $user->mobile,
                'designation'  => $user->designation,
                'organization' => $user->organization?->name,
            ]);

        return $this->success($moderators);
    }
}
