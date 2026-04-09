<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;

abstract class TenantModel extends Model
{
    public function newCollection(array $models = []): \Illuminate\Database\Eloquent\Collection
    {
        return new \Illuminate\Database\Eloquent\Collection($models);
    }

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());

        // Auto-assign organization_id on create
        // Super admin has no org of their own — they must pass organization_id explicitly
        static::creating(function (Model $model) {
            if (auth()->check() && ! $model->organization_id) {
                $user = auth()->user();
                if (! $user->hasRole('super_admin')) {
                    $model->organization_id = $user->organization_id;
                }
            }
        });
    }
}
