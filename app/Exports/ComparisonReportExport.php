<?php

namespace App\Exports;

use App\Models\ModuleAssignment;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ComparisonReportExport implements FromArray, WithHeadings, WithStyles
{
    protected $filters;

    public function __construct($filters = [])
    {
        $this->filters = $filters;
    }

    public function array(): array
    {
        $currentFrom = Carbon::parse($this->filters['current_from'] ?? now()->subMonth())->startOfDay();
        $currentTo = Carbon::parse($this->filters['current_to'] ?? now())->endOfDay();
        $previousFrom = Carbon::parse($this->filters['previous_from'] ?? now()->subMonths(2))->startOfDay();
        $previousTo = Carbon::parse($this->filters['previous_to'] ?? now()->subMonth())->endOfDay();

        $data = [
            [
                'metric' => 'Total Completions',
                'current_period' => ModuleAssignment::whereBetween('completed_at', [$currentFrom, $currentTo])
                    ->where('status', 'completed')->count(),
                'previous_period' => ModuleAssignment::whereBetween('completed_at', [$previousFrom, $previousTo])
                    ->where('status', 'completed')->count(),
            ],
            [
                'metric' => 'Total Enrollments',
                'current_period' => ModuleAssignment::whereBetween('created_at', [$currentFrom, $currentTo])->count(),
                'previous_period' => ModuleAssignment::whereBetween('created_at', [$previousFrom, $previousTo])->count(),
            ],
            [
                'metric' => 'Average Score',
                'current_period' => round(ModuleAssignment::whereBetween('updated_at', [$currentFrom, $currentTo])->avg('score') ?? 0, 2),
                'previous_period' => round(ModuleAssignment::whereBetween('updated_at', [$previousFrom, $previousTo])->avg('score') ?? 0, 2),
            ],
        ];

        return $data;
    }

    public function headings(): array
    {
        return [
            'Metric',
            'Current Period',
            'Previous Period',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true], 'fill' => ['fillType' => 'solid', 'fgColor' => ['rgb' => '8B5CF6']]],
        ];
    }
}
