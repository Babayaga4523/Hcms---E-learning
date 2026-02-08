<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class SummaryAnalyticsSheet implements FromArray, WithHeadings, WithStyles, WithTitle
{
    protected $data;
    const HEADER_COLOR = '6A1B9A';

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function array(): array
    {
        $rows = [];
        foreach ($this->data as $label => $value) {
            $rows[] = [$label, $value];
        }
        return $rows;
    }

    public function headings(): array
    {
        return ['KPI / Metrik', 'Nilai'];
    }

    public function title(): string
    {
        return 'Ringkasan Analitik';
    }

    public function styles(Worksheet $sheet)
    {
        $totalRows = count($this->data);

        // Title
        $sheet->setCellValue('A1', 'RINGKASAN ANALITIK DAN KPI');
        $sheet->mergeCells('A1:B1');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::HEADER_COLOR]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(25);

        // Subtitle
        $sheet->setCellValue('A2', 'Tanggal: ' . \Carbon\Carbon::now()->format('d/m/Y H:i:s'));
        $sheet->mergeCells('A2:B2');
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['italic' => true, 'size' => 10, 'color' => ['rgb' => '666666']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
        ]);

        // Header
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::HEADER_COLOR]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'D3D3D3']]],
        ];
        $sheet->getStyle('A3:B3')->applyFromArray($headerStyle);
        $sheet->getRowDimension(3)->setRowHeight(22);

        // Columns
        $sheet->getColumnDimension('A')->setWidth(40);
        $sheet->getColumnDimension('B')->setWidth(25);

        $sheet->freezePane('A4');

        // Data rows
        for ($i = 4; $i <= $totalRows + 3; $i++) {
            $bgColor = (($i - 4) % 2 == 0) ? 'F3E5F5' : 'FFFFFF';
            $sheet->getStyle('A'.$i.':B'.$i)->applyFromArray([
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E0E0E0']]],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'horizontal' => Alignment::HORIZONTAL_LEFT],
                'font' => ['size' => 10],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $bgColor]],
            ]);
        }

        return [];
    }
}
