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

class ExamPerformanceSheet implements FromCollection, WithHeadings, WithStyles, WithTitle
{
    protected $data;
    const HEADER_COLOR = 'C62828';

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data->map(function($item) {
            return [
                $item->id ?? '',
                $item->name ?? '',
                $item->total_attempts ?? 0,
                round($item->avg_score ?? 0, 2),
                round($item->highest_score ?? 0, 2),
                round($item->lowest_score ?? 0, 2),
            ];
        });
    }

    public function headings(): array
    {
        return [
            'User ID',
            'Nama Peserta',
            'Total Percobaan',
            'Rata-rata Nilai',
            'Nilai Tertinggi',
            'Nilai Terendah',
        ];
    }

    public function title(): string
    {
        return 'Performa Ujian';
    }

    public function styles(Worksheet $sheet)
    {
        $totalRows = $this->data->count();

        // Title
        $sheet->setCellValue('A1', 'LAPORAN PERFORMA UJIAN / ASSESSMENT PESERTA');
        $sheet->mergeCells('A1:F1');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::HEADER_COLOR]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(25);

        // Subtitle
        $sheet->setCellValue('A2', 'Tanggal: ' . \Carbon\Carbon::now()->format('d/m/Y H:i:s') . ' | Total Peserta dengan Exam: ' . $totalRows);
        $sheet->mergeCells('A2:F2');
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
        $sheet->getStyle('A3:F3')->applyFromArray($headerStyle);
        $sheet->getRowDimension(3)->setRowHeight(22);

        // Columns
        $widths = ['A' => 12, 'B' => 22, 'C' => 16, 'D' => 16, 'E' => 16, 'F' => 16];
        foreach ($widths as $col => $width) {
            $sheet->getColumnDimension($col)->setWidth($width);
        }

        $sheet->freezePane('A4');
        $sheet->setAutoFilter('A3:F' . ($totalRows + 3));

        // Data rows
        for ($i = 4; $i <= $totalRows + 3; $i++) {
            $bgColor = (($i - 4) % 2 == 0) ? 'FFEBEE' : 'FFFFFF';
            $sheet->getStyle('A'.$i.':F'.$i)->applyFromArray([
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E0E0E0']]],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'horizontal' => Alignment::HORIZONTAL_LEFT],
                'font' => ['size' => 10],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $bgColor]],
            ]);
        }

        return [];
    }
}
