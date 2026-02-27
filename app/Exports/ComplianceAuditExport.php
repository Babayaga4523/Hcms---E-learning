<?php

namespace App\Exports;

use App\Models\ComplianceEvidence;
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

class ComplianceAuditExport implements FromArray, WithTitle, ShouldAutoSize, WithStyles, WithEvents, WithColumnFormatting
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
        $rows = [];
        
        // Row 1: Title
        $rows[] = ['LAPORAN AUDIT COMPLIANCE'];
        
        // Row 2-3: Filter info
        $rows[] = ['Status: ' . (isset($this->filters['status']) ? $this->filters['status'] : 'Semua')];
        $rows[] = ['Tanggal Export: ' . date('d F Y, H:i')];
        
        // Row 4: Spacer
        $rows[] = [];

        // Row 5: Column Headers
        $rows[] = ['No', 'User Name', 'Program', 'Evidence Type', 'Status', 'Submission Date', 'Updated Date', 'Notes', 'Description'];

        // If compliance_evidence table doesn't exist or is empty, show empty data
        try {
            $query = \App\Models\ComplianceEvidence::query();

            if (isset($this->filters['user_id'])) {
                $query->where('user_id', $this->filters['user_id']);
            }

            if (isset($this->filters['status'])) {
                $query->where('status', $this->filters['status']);
            }

            $evidences = $query->get();

            // Data rows
            $no = 1;
            foreach ($evidences as $evidence) {
                $rows[] = [
                    $no++,
                    $evidence->user->name ?? '-',
                    $evidence->module->name ?? '-',
                    ucfirst(str_replace('_', ' ', $evidence->evidence_type ?? '')),
                    strtoupper($evidence->status ?? '-'),
                    $evidence->created_at ? date('d/m/Y H:i', strtotime($evidence->created_at)) : '-',
                    $evidence->updated_at ? date('d/m/Y H:i', strtotime($evidence->updated_at)) : '-',
                    $evidence->verification_notes ?? '-',
                    substr($evidence->description ?? '', 0, 50),
                ];
            }
        } catch (\Exception $e) {
            // Table might not exist, show empty row
            $rows[] = ['1', '-', '-', '-', '-', '-', '-', 'Table not available', 'No data'];
        }

        return $rows;
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $lastRow = $sheet->getHighestRow();
                $lastColumn = 'I';

                // Global font
                $sheet->getParent()->getDefaultStyle()->getFont()->setName('Calibri')->setSize(11);

                // Title row (Row 1)
                $sheet->mergeCells('A1:I1');
                $sheet->getStyle('A1')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => self::TEXT_WHITE]],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::TITLE_BG_COLOR]],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]);
                $sheet->getRowDimension(1)->setRowHeight(25);

                // Header row (Row 5)
                $sheet->getStyle('A5:I5')->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['rgb' => self::TEXT_WHITE], 'size' => 11],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::HEADER_BG_COLOR]],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => self::BORDER_COLOR]]],
                ]);
                $sheet->getRowDimension(5)->setRowHeight(20);

                // Freeze pane & Auto-filter
                $sheet->freezePane('A6');
                $sheet->setAutoFilter('A5:I' . $lastRow);

                // Data rows
                if ($lastRow >= 6) {
                    $sheet->getStyle("A6:I{$lastRow}")->applyFromArray([
                        'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => self::BORDER_COLOR]]],
                        'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                    ]);

                    // Zebra striping
                    for ($row = 6; $row <= $lastRow; $row++) {
                        if ($row % 2 == 0) {
                            $sheet->getStyle("A{$row}:I{$row}")->getFill()
                                ->setFillType(Fill::FILL_SOLID)
                                ->getStartColor()->setARGB(self::ZEBRA_COLOR);
                        }
                    }

                    // Alignment
                    $sheet->getStyle("A6:A{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle("B6:C{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                    $sheet->getStyle("D6:H{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle("I6:I{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

                    // Conditional formatting for status
                    for ($row = 6; $row <= $lastRow; $row++) {
                        $statusCell = "E{$row}";
                        $val = $sheet->getCell($statusCell)->getValue();
                        if ($val === 'APPROVED') {
                            $sheet->getStyle($statusCell)->getFont()->setColor(new Color('FF' . self::SUCCESS_COLOR))->setBold(true);
                        } elseif ($status === 'PENDING') {
                            $sheet->getStyle($statusCell)->getFont()->setColor(new Color('FF' . self::WARNING_COLOR))->setBold(true);
                        }
                    }
                }
            }
        ];
    }

    public function columnFormats(): array
    {
        return [];
    }

    public function styles(Worksheet $sheet)
    {
        return [];
    }

    public function title(): string
    {
        return 'Compliance Audit';
    }
}
