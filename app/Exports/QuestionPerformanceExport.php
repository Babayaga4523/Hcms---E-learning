<?php

namespace App\Exports;

use App\Models\ExamAttempt;
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
use PhpOffice\PhpSpreadsheet\Style\Color;

class QuestionPerformanceExport implements FromArray, WithTitle, ShouldAutoSize, WithStyles, WithEvents, WithColumnFormatting
{
    protected $filters;

    const HEADER_BG_COLOR = '0F766E';
    const TITLE_BG_COLOR = '005E54';
    const ZEBRA_COLOR = 'F0FDF4';
    const TEXT_WHITE = 'FFFFFF';
    const BORDER_COLOR = 'CBD5E1';
    const SUCCESS_COLOR = '10B981';
    const WARNING_COLOR = 'F59E0B';

    public function __construct($filters = [])
    {
        $this->filters = $filters;
    }

    public function array(): array
    {
        $query = ExamAttempt::with(['user', 'module']);

        if (isset($this->filters['module_id'])) {
            $query->where('module_id', $this->filters['module_id']);
        }

        $attempts = $query->get();

        $rows = [];
        
        // Row 1: Title
        $rows[] = ['LAPORAN PERFORMA SOAL'];
        
        // Row 2-3: Filter info
        $filterText = 'Semua Modul';
        if (isset($this->filters['module_id'])) {
            $module = \App\Models\Module::find($this->filters['module_id']);
            $filterText = $module ? $module->title : 'Module ID: ' . $this->filters['module_id'];
        }
        $rows[] = ['Modul: ' . $filterText];
        $rows[] = ['Tanggal Export: ' . date('d F Y, H:i')];
        
        // Row 4: Spacer
        $rows[] = [];

        // Row 5: Column Headers
        $rows[] = ['No', 'User Name', 'Module Name', 'Score', 'Percentage (%)', 'Status', 'Exam Type', 'Duration (Min)', 'Started', 'Finished'];

        // Data rows
        $no = 1;
        foreach ($attempts as $attempt) {
            $rows[] = [
                $no++,
                $attempt->user->name ?? '-',
                $attempt->module->title ?? '-',
                $attempt->score ?? 0,
                $attempt->percentage ?? 0,
                $attempt->is_passed ? 'PASS' : 'FAIL',
                $attempt->exam_type ?? '-',
                $attempt->duration_minutes ?? 0,
                $attempt->started_at ? date('d/m/Y H:i', strtotime($attempt->started_at)) : '-',
                $attempt->finished_at ? date('d/m/Y H:i', strtotime($attempt->finished_at)) : '-',
            ];
        }

        return $rows;
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $lastRow = $sheet->getHighestRow();
                $lastColumn = 'J';

                // Global font
                $sheet->getParent()->getDefaultStyle()->getFont()->setName('Calibri')->setSize(11);

                // Title row (Row 1)
                $sheet->mergeCells('A1:J1');
                $sheet->getStyle('A1')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => self::TEXT_WHITE]],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::TITLE_BG_COLOR]],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]);
                $sheet->getRowDimension(1)->setRowHeight(25);

                // Header row (Row 5)
                $sheet->getStyle('A5:J5')->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['rgb' => self::TEXT_WHITE], 'size' => 11],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::HEADER_BG_COLOR]],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => self::BORDER_COLOR]]],
                ]);
                $sheet->getRowDimension(5)->setRowHeight(20);

                // Freeze pane
                $sheet->freezePane('A6');
                $sheet->setAutoFilter('A5:J' . $lastRow);

                // Data rows
                if ($lastRow >= 6) {
                    $sheet->getStyle("A6:J{$lastRow}")->applyFromArray([
                        'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => self::BORDER_COLOR]]],
                        'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                    ]);

                    // Zebra striping
                    for ($row = 6; $row <= $lastRow; $row++) {
                        if ($row % 2 == 0) {
                            $sheet->getStyle("A{$row}:J{$row}")->getFill()
                                ->setFillType(Fill::FILL_SOLID)
                                ->getStartColor()->setARGB(self::ZEBRA_COLOR);
                        }
                    }

                    // Alignment
                    $sheet->getStyle("A6:A{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle("B6:C{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                    $sheet->getStyle("D6:I{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle("J6:J{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

                    // Conditional formatting for PASS/FAIL (Column F now)
                    for ($row = 6; $row <= $lastRow; $row++) {
                        $resultCell = "F{$row}";
                        $val = $sheet->getCell($resultCell)->getValue();
                        if ($val === 'PASS') {
                            $sheet->getStyle($resultCell)->getFont()->setColor(new Color('FF' . self::SUCCESS_COLOR))->setBold(true);
                        } elseif ($val === 'FAIL') {
                            $sheet->getStyle($resultCell)->getFont()->setColor(new Color('FF' . self::WARNING_COLOR))->setBold(true);
                        }
                    }
                }
            }
        ];
    }

    public function columnFormats(): array
    {
        return [
            'D' => '0.0',
            'G' => '0',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [];
    }

    public function title(): string
    {
        return 'Question Performance';
    }
}
