<?php

namespace App\Http\Requests\Api\V1\Election;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class CreateElectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'               => ['required', 'string', 'max:255'],
            'description'        => ['nullable', 'string', 'max:2000'],
            // 'election_date'      => ['required', 'date_format:Y-m-d'],
            // 'voting_start_time'  => ['required', 'date_format:H:i'],
            // 'voting_end_time'    => ['required', 'date_format:H:i', 'after:voting_start_time'],
            'candidate_mode'     => ['sometimes', Rule::in(['selected', 'open'])],
            'allow_multi_post'   => ['sometimes', 'boolean'],
            'organization_id'    => [
                Rule::requiredIf(fn () => Auth::user()?->hasRole('super_admin')),
                'nullable',
                'integer',
                'exists:organizations,id',
            ],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $date  = $this->input('election_date');
            $time  = $this->input('voting_start_time');

            if (! $date || ! $time) {
                return;
            }

            // Voting start must be at least 24 hours from now (GMT+6)
            $votingStart = Carbon::parse("{$date} {$time}", 'Asia/Dhaka');
            $minimum     = now('Asia/Dhaka')->addHours(24);

            // if ($votingStart->lt($minimum)) {
            //     $validator->errors()->add(
            //         'voting_start_time',
            //         'The voting start time must be at least 24 hours from now.'
            //     );
            // }
        });
    }
}
