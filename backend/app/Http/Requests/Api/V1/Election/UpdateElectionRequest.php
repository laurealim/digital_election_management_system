<?php

namespace App\Http\Requests\Api\V1\Election;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateElectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'               => ['sometimes', 'string', 'max:255'],
            'description'        => ['sometimes', 'nullable', 'string', 'max:2000'],
            // 'election_date'      => ['sometimes', 'date_format:Y-m-d'],
            // 'voting_start_time'  => ['sometimes', 'date_format:H:i'],
            // 'voting_end_time'    => ['sometimes', 'date_format:H:i', 'after:voting_start_time'],
            'candidate_mode'     => ['sometimes', Rule::in(['selected', 'open'])],
            'allow_multi_post'   => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $election = $this->route('election');

            $date = $this->input('election_date', $election->election_date->format('Y-m-d'));
            $time = $this->input('voting_start_time', $election->voting_start_time);

            // Only re-validate the 24h constraint if date or time is being changed
            if (! $this->hasAny(['election_date', 'voting_start_time'])) {
                return;
            }

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
