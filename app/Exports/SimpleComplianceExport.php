<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class SimpleComplianceExport implements FromCollection, WithTitle, ShouldAutoSize, WithStyles, WithEvents, WithColumnFormatting
{
    protected $data;

    const HEADER_BG_COLOR = '0F766E';
    const TITLE_BG_COLOR = '005E54';
    const ZEBRA_COLOR = 'F0FDF4';
    const TEXT_WHITE = 'FFFFFF';
    const BORDER_COLOR = 'CBD5E1';

    public function __construct($data)
    {
        $this->data = $data;
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        return $this->data->map(function($item) {
            return [
                $item->id ?? '',
                $item->name ?? '',
                $item->nip ?? '-',
                $item->email ?? '-',
                $item->department ?? '-',
                $item->status ?? '',
                $item->total_trainings ?? 0,
                $item->completed_trainings ?? 0,
                $item->compliance_rate ?? '0%',
                $item->created_at ? $item->created_at : '-',
            ];
        });
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        return [
            'ID',
            'Nama Lengkap',
            'NIP',
            'Email',
            'Departemen',
            'Status',
            'Total Training',
            'Training Selesai',
            'Compliance Rate (%)',
            'Tanggal Pendaftaran',
        ];
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

                // Header row (Row 1 - contains headings from collection)
                $sheet->getStyle('A1:J1')->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['rgb' => self::TEXT_WHITE], 'size' => 11],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::HEADER_BG_COLOR]],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => self::BORDER_COLOR]]],
                ]);
                $sheet->getRowDimension(1)->setRowHeight(20);

                // Freeze pane
                $sheet->freezePane('A2');
                $sheet->setAutoFilter('A1:J' . $lastRow);

                // Data rows
                if ($lastRow > 1) {
                    $sheet->getStyle("A2:J{$lastRow}")->applyFromArray([
                        'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => self::BORDER_COLOR]]],
                        'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                    ]);

                    // Zebra striping
                    for ($row = 2; $row <= $lastRow; $row++) {
                        if ($row % 2 == 0) {
                            $sheet->getStyle("A{$row}:J{$row}")->getFill()
                                ->setFillType(Fill::FILL_SOLID)
                                ->getStartColor()->setARGB(self::ZEBRA_COLOR);
                        }
                    }

                    // Alignment
                    $sheet->getStyle("A2:A{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle("B2:E{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                    $sheet->getStyle("F2:J{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                }
            }
        ];
    }

    public function columnFormats(): array
    {
        return [
            'I' => NumberFormat::FORMAT_PERCENTAGE_00,
        ];
    }

    /**
     * @param Worksheet $sheet
     * @return array
     */
    public function styles(Worksheet $sheet)
    {
        return [];
    }

    public function title(): string
    {
        return 'Compliance';
    }
}
