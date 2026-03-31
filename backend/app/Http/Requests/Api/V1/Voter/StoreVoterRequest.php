<?php

namespace App\Http\Requests\Api\V1\Voter;

use Illuminate\Foundation\Http\FormRequest;

class StoreVoterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $election = $this->route('election');
        $orgId = $election?->organization_id ?? $this->user()->organization_id;

        return [
            'name'        => ['required', 'string', 'max:255'],
            'email'       => [
                'required',
                'email',
                'max:191',
                // Email must not already belong to a user in a different org
                function ($attribute, $value, $fail) use ($orgId) {
                    $existing = \App\Models\User::where('email', $value)->first();
                    if ($existing && $existing->organization_id !== $orgId) {
                        $fail('This email is registered under a different organization.');
                    }
                },
            ],
            'mobile'      => ['nullable', 'string', 'max:20'],
            'office_name' => ['nullable', 'string', 'max:255'],
            'designation' => ['nullable', 'string', 'max:255'],
        ];
    }
}
