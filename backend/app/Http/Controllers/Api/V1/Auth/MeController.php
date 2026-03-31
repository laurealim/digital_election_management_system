<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Api\V1\ApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeController extends ApiController
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('organization');

        return $this->success([
            'id'              => $user->id,
            'name'            => $user->name,
            'email'           => $user->email,
            'mobile'          => $user->mobile,
            'office_name'     => $user->office_name,
            'designation'     => $user->designation,
            'roles'           => $user->getRoleNames()->values(),
            'permissions'     => $user->getAllPermissions()->pluck('name'),
            'organization_id' => $user->organization_id,
            'organization'    => $user->organization ? [
                'id'   => $user->organization->id,
                'name' => $user->organization->name,
                'type' => $user->organization->type,
            ] : null,
            'is_active'       => $user->is_active,
        ]);
    }
}
