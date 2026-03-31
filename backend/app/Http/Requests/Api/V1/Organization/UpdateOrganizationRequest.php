<?php

namespace App\Http\Requests\Api\V1\Organization;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrganizationRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Org admin can only update their own org (enforced in controller too)
        return true;
    }

    public function rules(): array
    {
        $orgId = $this->route('organization')?->id;

        return [
            'name'    => ['sometimes', 'string', 'max:255'],
            'type'    => ['sometimes', Rule::in(['govt', 'private', 'association', 'cooperative', 'ngo', 'education'])],
            'email'   => ['sometimes', 'email', 'max:191', Rule::unique('organizations', 'email')->ignore($orgId)],
            'phone'   => ['sometimes', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
