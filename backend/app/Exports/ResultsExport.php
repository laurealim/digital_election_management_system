<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithTitle;
use Illuminate\Support\Collection;

class ResultsExport implements WithMultipleSheets
{
    public function __construct(private readonly array $results) {}

    public function sheets(): array
    {
        $sheets = [];

        // Summary sheet
        $sheets[] = new ResultsSummarySheet($this->results);

        // One sheet per post
        foreach ($this->results['posts'] as $post) {
            $sheets[] = new ResultsPostSheet($post);
        }

        return $sheets;
    }
}

class ResultsSummarySheet implements FromCollection, WithHeadings, WithTitle
{
    public function __construct(private readonly array $results) {}

    public function title(): string
    {
        return 'Summary';
    }

    public function headings(): array
    {
        return ['Metric', 'Value'];
    }

    public function collection(): Collection
    {
        $election = $this->results['election'];
        $turnout  = $this->results['turnout'];

        return collect([
            ['Election',       $election['name']],
            ['Organization',   $election['organization']],
            ['Election Date',  $election['election_date']],
            ['Status',         $election['status']],
            ['Total Voters',   $turnout['total_voters']],
            ['Votes Cast',     $turnout['voted_count']],
            ['Turnout %',      $turnout['turnout_pct'] . '%'],
        ]);
    }
}

class ResultsPostSheet implements FromCollection, WithHeadings, WithTitle
{
    public function __construct(private readonly array $post) {}

    public function title(): string
    {
        return mb_substr($this->post['title'], 0, 31); // Excel sheet name max 31 chars
    }

    public function headings(): array
    {
        return ['Rank', 'Candidate', 'Votes', 'Winner'];
    }

    public function collection(): Collection
    {
        $winnerIds = collect($this->post['winners'])->pluck('id')->all();

        return collect($this->post['candidates'])->values()->map(function ($c, $i) use ($winnerIds) {
            return [
                $i + 1,
                $c['user']['name'],
                $c['vote_count'],
                in_array($c['id'], $winnerIds) ? 'Yes' : '',
            ];
        });
    }
}
