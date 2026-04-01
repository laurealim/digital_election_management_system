<?php

namespace App\Imports;

use App\Jobs\SendVoterInvitationJob;
use App\Models\Election;
use App\Models\User;
use App\Models\Voter;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class VotersImport implements ToCollection, WithHeadingRow
{
    private int $importedCount = 0;
    private array $errors = [];

    public function __construct(
        private readonly Election $election,
        private readonly User $importedBy,
    ) {}

    /**
     * Expected columns (heading row): name, email, mobile, office_name, designation
     */
    public function collection(Collection $rows): void
    {
        $orgId = $this->election->organization_id;

        foreach ($rows as $index => $row) {
            $rowNum = $index + 2; // +2 because row 1 is the heading

            $data = [
                'name'        => trim($row['name'] ?? ''),
                'email'       => strtolower(trim($row['email'] ?? '')),
                'mobile'      => trim($row['mobile'] ?? '') ?: null,
                'office_name' => trim($row['office_name'] ?? '') ?: null,
                'designation' => trim($row['designation'] ?? '') ?: null,
            ];

            $validator = Validator::make($data, [
                'name'  => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'max:191'],
            ]);

            if ($validator->fails()) {
                $this->errors[] = [
                    'row'    => $rowNum,
                    'email'  => $data['email'],
                    'errors' => $validator->errors()->all(),
                ];
                continue;
            }

            // Check if email belongs to a different org
            $existingUser = User::where('email', $data['email'])->first();
            if ($existingUser && $existingUser->organization_id !== $orgId) {
                $this->errors[] = [
                    'row'    => $rowNum,
                    'email'  => $data['email'],
                    'errors' => ['This email is registered under a different organization.'],
                ];
                continue;
            }

            // Check if already enrolled
            if ($existingUser) {
                $alreadyEnrolled = Voter::where('election_id', $this->election->id)
                    ->where('user_id', $existingUser->id)
                    ->exists();

                if ($alreadyEnrolled) {
                    $this->errors[] = [
                        'row'    => $rowNum,
                        'email'  => $data['email'],
                        'errors' => ['This voter is already enrolled in this election.'],
                    ];
                    continue;
                }
            }

            try {
                DB::transaction(function () use ($data, $orgId) {
                    $user = User::firstOrCreate(
                        ['email' => $data['email']],
                        [
                            'organization_id' => $orgId,
                            'name'            => $data['name'],
                            'mobile'          => $data['mobile'],
                            'office_name'     => $data['office_name'],
                            'designation'     => $data['designation'],
                            'password'        => null,
                            'is_active'       => true,
                        ]
                    );

                    if (! $user->wasRecentlyCreated) {
                        $user->update(array_filter([
                            'name'        => $data['name'],
                            'mobile'      => $data['mobile'],
                            'office_name' => $data['office_name'],
                            'designation' => $data['designation'],
                        ], fn ($v) => $v !== null));
                    }

                    if (! $user->hasRole('voter')) {
                        $user->assignRole('voter');
                    }

                    // In open mode, also assign candidate role
                    if ($this->election->candidate_mode === 'open' && ! $user->hasRole('candidate')) {
                        $user->assignRole('candidate');
                    }

                    $voter = Voter::create([
                        'election_id'     => $this->election->id,
                        'user_id'         => $user->id,
                        'organization_id' => $orgId,
                    ]);

                    // SendVoterInvitationJob::dispatch($user, $this->election, $voter)
                    //     ->onQueue('emails');
                });

                $this->importedCount++;
            } catch (\Throwable $e) {
                $this->errors[] = [
                    'row'    => $rowNum ?? null,
                    'email'  => $data['email'],
                    'errors' => ['Unexpected error: ' . $e->getMessage()],
                ];
            }
        }
    }

    public function getSummary(): array
    {
        return [
            'imported' => $this->importedCount,
            'errors'   => $this->errors,
        ];
    }
}
