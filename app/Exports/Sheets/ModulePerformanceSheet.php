<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class ModulePerformanceSheet implements FromCollection, WithHeadings, WithStyles, WithTitle
{
    protected $data;
    const HEADER_COLOR = 'F57C00';

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data->map(function($item) {
            $total = ($item->total_enrolled ?? 0);
            $completed = ($item->completed ?? 0);
            $rate = $total > 0 ? round(($completed / $total) * 100, 2) : 0;

            return [
                $item->id ?? '',
                $item->title ?? '',
                $total,
                $completed,
                $item->in_progress ?? 0,
                $item->pending ?? 0,
                $rate . '%',
                $total > 0 ? round(($item->in_progress ?? 0) / $total * 100, 2) . '%' : '0%',
            ];
        });
    }

    public function headings(): array
    {
        return [
            'ID Module',
            'Nama Module',
            'Total Terdaftar',
            'Telah Selesai',
            'Sedang Berlangsung',
            'Pending',
            'Completion Rate',
            'In Progress %',
        ];
    }

    public function title(): string
    {
        return 'Performa Module';
    }

    public function styles(Worksheet $sheet)
    {
        $totalRows = $this->data->count();

        // Title
        $sheet->setCellValue('A1', 'LAPORAN PERFORMA MODULE / PROGRAM PELATIHAN');
        $sheet->mergeCells('A1:H1');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::HEADER_COLOR]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(25);

        // Subtitle
        $sheet->setCellValue('A2', 'Tanggal: ' . \Carbon\Carbon::now()->format('d/m/Y H:i:s') . ' | Total Module: ' . $totalRows);
        $sheet->mergeCells('A2:H2');
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['italic' => true, 'size' => 10, 'color' => ['rgb' => '666666']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
        ]);

        // Header
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::HEADER_COLOR]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'D3D3D3']]],
        ];
        $sheet->getStyle('A3:H3')->applyFromArray($headerStyle);
        $sheet->getRowDimension(3)->setRowHeight(25);

        // Columns
        $widths = ['A' => 12, 'B' => 28, 'C' => 16, 'D' => 14, 'E' => 18, 'F' => 12, 'G' => 16, 'H' => 14];
        foreach ($widths as $col => $width) {
            $sheet->getColumnDimension($col)->setWidth($width);
        }

        $sheet->freezePane('A4');
        $sheet->setAutoFilter('A3:H' . ($totalRows + 3));

        // Data rows
        for ($i = 4; $i <= $totalRows + 3; $i++) {
            $bgColor = (($i - 4) % 2 == 0) ? 'FEF5E8' : 'FFFFFF';
            $sheet->getStyle('A'.$i.':H'.$i)->applyFromArray([
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E0E0E0']]],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'horizontal' => Alignment::HORIZONTAL_LEFT],
                'font' => ['size' => 10],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $bgColor]],
            ]);
        }

        return [];
    }
}
