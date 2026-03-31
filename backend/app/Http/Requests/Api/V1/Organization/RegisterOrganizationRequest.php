<?php

namespace App\Http\Requests\Api\V1\Organization;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterOrganizationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'    => ['required', 'string', 'max:255'],
            'type'    => ['required', Rule::in(['govt', 'private', 'association', 'cooperative', 'ngo', 'education'])],
            'email'   => ['required', 'email', 'max:191', 'unique:organizations,email'],
            'phone'   => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:1000'],

            // Admin account fields — no password; a setup email will be sent
            'admin_name'        => ['required', 'string', 'max:255'],
            'admin_email'       => ['required', 'email', 'max:191', 'unique:users,email'],
            'admin_mobile'      => ['nullable', 'string', 'max:20'],
            'admin_designation' => ['nullable', 'string', 'max:255'],
        ];
    }
}
