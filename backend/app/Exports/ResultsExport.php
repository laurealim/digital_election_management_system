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
        $totalVoters = $this->results['turnout']['total_voters'] ?? 0;

        // Summary sheet
        $sheets[] = new ResultsSummarySheet($this->results);

        // One sheet per post
        foreach ($this->results['posts'] as $post) {
            $sheets[] = new ResultsPostSheet($post, $totalVoters);
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
            ['Total Posts',    count($this->results['posts'] ?? [])],
        ]);
    }
}

class ResultsPostSheet implements FromCollection, WithHeadings, WithTitle
{
    public function __construct(private readonly array $post, private readonly int $totalVoters) {}

    public function title(): string
    {
        return mb_substr($this->post['title'], 0, 31); // Excel sheet name max 31 chars
    }

    public function headings(): array
    {
        return ['Sr.', 'Candidate', 'Votes', 'Vote %'];
    }

    public function collection(): Collection
    {
        $winnerIds  = collect($this->post['winners'])->pluck('id')->all();
        $totalVotes = $this->post['total_votes'] ?? 0;

        return collect($this->post['candidates'])
            ->filter(fn ($c) => ($c['vote_count'] ?? 0) >= 1)
            ->values()
            ->map(function ($c, $i) use ($winnerIds, $totalVotes) {
                $votePct = $totalVotes > 0
                    ? round(($c['vote_count'] / $totalVotes) * 100, 1) . '%'
                    : '0%';

                return [
                    $i + 1,
                    $c['user']['name'],
                    $c['vote_count'],
                    $votePct,
                    // in_array($c['id'], $winnerIds) ? 'Yes' : '',
                ];
            });
    }
}
