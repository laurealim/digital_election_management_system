<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $user = Auth::user();

        if (! $user) {
            return;
        }

        // Super admin sees all records — no tenant filter
        if ($user->hasRole('super_admin')) {
            return;
        }

        if ($user->organization_id) {
            $builder->where($model->getTable().'.organization_id', $user->organization_id);
        }
    }
}
