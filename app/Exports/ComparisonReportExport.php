<?php

namespace App\Exports;

use App\Models\ModuleAssignment;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class ComparisonReportExport implements FromArray, WithTitle, ShouldAutoSize, WithStyles, WithEvents, WithColumnFormatting
{
    protected $filters;

    const HEADER_BG_COLOR = '0F766E';
    const TITLE_BG_COLOR = '005E54';
    const ZEBRA_COLOR = 'F0FDF4';
    const TEXT_WHITE = 'FFFFFF';
    const BORDER_COLOR = 'CBD5E1';

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

        $rows = [];
        
        // Row 1: Title
        $rows[] = ['LAPORAN PERBANDINGAN'];
        
        // Row 2-3: Date ranges
        $rows[] = ['Periode Saat Ini: ' . $currentFrom->format('d/m/Y') . ' - ' . $currentTo->format('d/m/Y')];
        $rows[] = ['Periode Sebelumnya: ' . $previousFrom->format('d/m/Y') . ' - ' . $previousTo->format('d/m/Y')];
        
        // Row 4: Spacer
        $rows[] = [];

        // Row 5: Column Headers
        $rows[] = ['Metric', 'Current Period', 'Previous Period', 'Change %'];

        // Calculate data using available columns
        $current_assignments = ModuleAssignment::whereBetween('created_at', [$currentFrom, $currentTo])->count();
        $prev_assignments = ModuleAssignment::whereBetween('created_at', [$previousFrom, $previousTo])->count();
        $assignments_change = $prev_assignments > 0 ? (($current_assignments - $prev_assignments) / $prev_assignments) : 0;
        
        $current_active = ModuleAssignment::whereBetween('assigned_date', [$currentFrom, $currentTo])
            ->where('status', '!=', 'cancelled')->count();
        $prev_active = ModuleAssignment::whereBetween('assigned_date', [$previousFrom, $previousTo])
            ->where('status', '!=', 'cancelled')->count();
        $active_change = $prev_active > 0 ? (($current_active - $prev_active) / $prev_active) : 0;
        
        $current_total_assigned = ModuleAssignment::whereBetween('due_date', [$currentFrom, $currentTo])->count();
        $prev_total_assigned = ModuleAssignment::whereBetween('due_date', [$previousFrom, $previousTo])->count();
        $total_change = $prev_total_assigned > 0 ? (($current_total_assigned - $prev_total_assigned) / $prev_total_assigned) : 0;

        // Data rows
        $rows[] = ['Total Assignments (Created)', $current_assignments, $prev_assignments, $assignments_change];
        $rows[] = ['Active Assignments', $current_active, $prev_active, $active_change];
        $rows[] = ['Due Date Assignments', $current_total_assigned, $prev_total_assigned, $total_change];

        return $rows;
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $lastRow = $sheet->getHighestRow();
                $lastColumn = 'D';

                // Global font
                $sheet->getParent()->getDefaultStyle()->getFont()->setName('Calibri')->setSize(11);

                // Freeze pane
                $sheet->freezePane('A6');
            }
        ];
    }

    public function columnFormats(): array
    {
        return [
            'D' => NumberFormat::FORMAT_PERCENTAGE_00,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [];
    }

    public function title(): string
    {
        return 'Comparison';
    }
}
