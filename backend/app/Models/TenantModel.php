<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;

abstract class TenantModel extends Model
{
    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());

        // Auto-assign organization_id on create
        static::creating(function (Model $model) {
            if (auth()->check() && ! $model->organization_id) {
                $model->organization_id = auth()->user()->organization_id;
            }
        });
    }
}
