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

class UserAnalyticsSheet implements FromCollection, WithHeadings, WithStyles, WithTitle
{
    protected $data;
    const HEADER_COLOR = '2E7D32';

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data->map(function($item) {
            return [
                $item['category'] ?? '',
                $item['status'] ?? '',
                $item['count'] ?? 0,
                isset($item['percentage']) ? round($item['percentage'], 2) . '%' : '-',
            ];
        });
    }

    public function headings(): array
    {
        return ['Kategori', 'Status/Tipe', 'Jumlah', 'Persentase'];
    }

    public function title(): string
    {
        return 'Analisis User';
    }

    public function styles(Worksheet $sheet)
    {
        $totalRows = $this->data->count();

        // Title
        $sheet->setCellValue('A1', 'STATISTIK PENGGUNA DAN PELATIHAN');
        $sheet->mergeCells('A1:D1');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2E7D32']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(25);

        // Subtitle
        $sheet->setCellValue('A2', 'Generated: ' . \Carbon\Carbon::now()->format('d/m/Y H:i:s'));
        $sheet->mergeCells('A2:D2');
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['italic' => true, 'size' => 10, 'color' => ['rgb' => '666666']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
        ]);

        // Header
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::HEADER_COLOR]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'D3D3D3']]],
        ];
        $sheet->getStyle('A3:D3')->applyFromArray($headerStyle);
        $sheet->getRowDimension(3)->setRowHeight(22);

        // Columns
        $sheet->getColumnDimension('A')->setWidth(22);
        $sheet->getColumnDimension('B')->setWidth(20);
        $sheet->getColumnDimension('C')->setWidth(15);
        $sheet->getColumnDimension('D')->setWidth(16);

        $sheet->freezePane('A4');
        $sheet->setAutoFilter('A3:D' . ($totalRows + 3));

        // Data rows
        for ($i = 4; $i <= $totalRows + 3; $i++) {
            $bgColor = (($i - 4) % 2 == 0) ? 'F1F8F6' : 'FFFFFF';
            $sheet->getStyle('A'.$i.':D'.$i)->applyFromArray([
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E0E0E0']]],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'horizontal' => Alignment::HORIZONTAL_LEFT],
                'font' => ['size' => 10],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $bgColor]],
            ]);
        }

        return [];
    }
}
