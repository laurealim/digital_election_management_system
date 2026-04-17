<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreNominationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Public endpoint — no auth required
    }

    public function rules(): array
    {
        return [
            'election_id'       => ['required', 'integer', 'exists:elections,id'],
            'name'              => ['required', 'string', 'max:255'],
            'father_name'       => ['required', 'string', 'max:255'],
            'mother_name'       => ['nullable', 'string', 'max:255'],
            'nid'               => ['nullable', 'string', 'regex:/^\d{10}$|^\d{13}$|^\d{17}$/', 'unique:nominations,nid,NULL,id,election_id,' . ($this->election_id ?? 0)],
            'designation'       => ['nullable', 'integer', 'in:' . implode(',', array_keys(config('constants.designations')))],
            'address'           => ['nullable', 'string', 'max:500'],
            'email'             => ['required', 'email', 'max:255'],
            'mobile'            => ['required', 'string', 'max:20'],
            'organization_name' => ['nullable', 'string', 'max:255'],
            'post_ids'          => ['required', 'array', 'min:1'],
            'post_ids.*'        => ['integer', 'exists:posts,id'],
        ];
    }
}