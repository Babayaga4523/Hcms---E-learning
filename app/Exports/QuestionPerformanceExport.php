<?php

namespace App\Exports;

use App\Models\ModuleAssignment;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class QuestionPerformanceExport implements FromArray, WithHeadings, WithStyles
{
    protected $filters;

    public function __construct($filters = [])
    {
        $this->filters = $filters;
    }

    public function array(): array
    {
        $query = ModuleAssignment::with(['user', 'module']);

        if (isset($this->filters['module_id'])) {
            $query->where('module_id', $this->filters['module_id']);
        }

        $assignments = $query->get();

        $data = [];
        foreach ($assignments as $assignment) {
            $data[] = [
                'user' => $assignment->user->name,
                'module' => $assignment->module->name,
                'score' => $assignment->score ?? 0,
                'status' => $assignment->status,
                'attempts' => $assignment->attempts ?? 1,
                'time_spent_minutes' => $assignment->time_spent ?? 0,
                'pass_fail' => ($assignment->score ?? 0) >= 70 ? 'PASS' : 'FAIL',
                'completed_date' => $assignment->completed_at,
            ];
        }

        return $data;
    }

    public function headings(): array
    {
        return [
            'User Name',
            'Module Name',
            'Score (%)',
            'Status',
            'Attempts',
            'Time Spent (Minutes)',
            'Result',
            'Completed Date',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true], 'fill' => ['fillType' => 'solid', 'fgColor' => ['rgb' => '10B981']]],
        ];
    }
}
