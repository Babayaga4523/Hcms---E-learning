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

class LearnerDetailSheet implements FromCollection, WithHeadings, WithStyles, WithTitle
{
    protected $data;
    const HEADER_COLOR = '1565C0';

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return $this->data->map(function($item) {
            // Handle both array and object
            if (is_array($item)) {
                $lastActive = isset($item['last_active']) ? \Carbon\Carbon::parse($item['last_active'])->format('Y-m-d H:i') : '-';
                return [
                    $item['id'] ?? '',
                    $item['name'] ?? '',
                    $item['nip'] ?? '',
                    $item['department'] ?? '-',
                    $item['modules_enrolled'] ?? 0,
                    $item['modules_completed'] ?? 0,
                    ($item['modules_enrolled'] > 0) ? round(($item['modules_completed'] / $item['modules_enrolled']) * 100, 2) : 0,
                    ($item['avg_module_score'] ?? $item['avg_score'] ?? 0),
                    $lastActive,
                    $item['status'] ?? 'Active',
                ];
            }
            
            $lastActive = $item->last_active ? \Carbon\Carbon::parse($item->last_active)->format('Y-m-d H:i') : '-';
            return [
                $item->id ?? '',
                $item->name ?? '',
                $item->nip ?? '',
                $item->department ?? '-',
                $item->modules_enrolled ?? 0,
                $item->modules_completed ?? 0,
                ($item->modules_enrolled > 0) ? round(($item->modules_completed / $item->modules_enrolled) * 100, 2) : 0,
                ($item->avg_module_score ?? $item->avg_score ?? 0),
                $lastActive,
                $item->status ?? 'Active',
            ];
        });
    }

    public function headings(): array
    {
        return [
            'ID Learner',
            'Nama Lengkap',
            'NIP',
            'Departemen',
            'Module Terdaftar',
            'Module Selesai',
            'Completion %',
            'Rata-rata Nilai',
            'Aktivitas Terakhir',
            'Status',
        ];
    }

    public function title(): string
    {
        return 'Detail Learner';
    }

    public function styles(Worksheet $sheet)
    {
        $totalRows = $this->data->count();

        // Title
        $sheet->setCellValue('A1', 'LAPORAN DETAIL PROGRESS PESERTA PELATIHAN');
        $sheet->mergeCells('A1:J1');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::HEADER_COLOR]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(25);

        // Subtitle
        $sheet->setCellValue('A2', 'Tanggal: ' . \Carbon\Carbon::now()->format('d/m/Y H:i:s') . ' | Total Peserta: ' . $totalRows);
        $sheet->mergeCells('A2:J2');
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
        $sheet->getStyle('A3:J3')->applyFromArray($headerStyle);
        $sheet->getRowDimension(3)->setRowHeight(25);

        // Columns
        $widths = ['A' => 12, 'B' => 22, 'C' => 14, 'D' => 16, 'E' => 16, 'F' => 16, 'G' => 13, 'H' => 15, 'I' => 20, 'J' => 12];
        foreach ($widths as $col => $width) {
            $sheet->getColumnDimension($col)->setWidth($width);
        }

        $sheet->freezePane('A4');
        $sheet->setAutoFilter('A3:J' . ($totalRows + 3));

        // Data rows
        for ($i = 4; $i <= $totalRows + 3; $i++) {
            $bgColor = (($i - 4) % 2 == 0) ? 'F1F5FB' : 'FFFFFF';
            $sheet->getStyle('A'.$i.':J'.$i)->applyFromArray([
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E0E0E0']]],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'horizontal' => Alignment::HORIZONTAL_LEFT],
                'font' => ['size' => 10],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $bgColor]],
            ]);
        }

        return [];
    }
}
