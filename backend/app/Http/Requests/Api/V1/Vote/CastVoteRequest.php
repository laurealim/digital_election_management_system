<?php

namespace App\Http\Requests\Api\V1\Vote;

use App\Models\Candidate;
use App\Models\Election;
use Illuminate\Foundation\Http\FormRequest;

class CastVoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'votes'                  => ['required', 'array', 'min:1'],
            'votes.*.post_id'        => ['required', 'integer', 'exists:posts,id'],
            'votes.*.candidate_id'   => ['required', 'integer'],  // cross-validated below (open vs selected mode)
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            /** @var Election $election */
            $election = $this->route('election');
            $votes    = $this->input('votes', []);

            // 1. No duplicate posts in the ballot
            $postIds = array_column($votes, 'post_id');
            if (count($postIds) !== count(array_unique($postIds))) {
                $validator->errors()->add('votes', 'Each post may only appear once in the ballot.');
                return;
            }

            // 2. Every post_id must belong to this election
            $electionPostIds = $election->posts()->pluck('id')->toArray();

            foreach ($votes as $i => $ballot) {
                if (! in_array($ballot['post_id'], $electionPostIds)) {
                    $validator->errors()->add(
                        "votes.{$i}.post_id",
                        "Post #{$ballot['post_id']} does not belong to this election."
                    );
                }
            }

            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            // 3. Validate candidate_id based on election mode
            if ($election->candidate_mode === 'open') {
                // In open mode, candidate_id is a user_id — must be an enrolled voter
                foreach ($votes as $i => $ballot) {
                    $enrolled = \App\Models\Voter::where('election_id', $election->id)
                        ->where('user_id', $ballot['candidate_id'])
                        ->exists();

                    if (! $enrolled) {
                        $validator->errors()->add(
                            "votes.{$i}.candidate_id",
                            "Candidate (user #{$ballot['candidate_id']}) is not enrolled as a voter in this election."
                        );
                    }
                }
            } else {
                // In selected mode, candidate_id must be a Candidate record on the correct post
                foreach ($votes as $i => $ballot) {
                    $valid = Candidate::where('id', $ballot['candidate_id'])
                        ->where('post_id', $ballot['post_id'])
                        ->where('election_id', $election->id)
                        ->exists();

                    if (! $valid) {
                        $validator->errors()->add(
                            "votes.{$i}.candidate_id",
                            "Candidate #{$ballot['candidate_id']} is not valid for post #{$ballot['post_id']}."
                        );
                    }
                }
            }
        });
    }
}
