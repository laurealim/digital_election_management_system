<?php

namespace App\Exports;

use App\Models\Election;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class VotersExport implements FromQuery, WithHeadings, WithMapping
{
    public function __construct(private readonly Election $election) {}

    public function query()
    {
        return $this->election->voters()->with('user')->latest();
    }

    public function headings(): array
    {
        return ['Name', 'Email', 'Mobile', 'Office Name', 'Designation', 'Voted', 'Voted At'];
    }

    public function map($voter): array
    {
        return [
            $voter->user?->name,
            $voter->user?->email,
            $voter->user?->mobile,
            $voter->user?->office_name,
            $voter->user?->designation,
            $voter->has_voted ? 'Yes' : 'No',
            $voter->voted_at,
        ];
    }
}
