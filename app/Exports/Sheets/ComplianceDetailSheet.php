<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use Carbon\Carbon;

class ComplianceDetailSheet implements FromCollection, WithTitle, WithStyles, WithColumnWidths
{
    private $data;
    private $totalRows;

    public function __construct($data)
    {
        $this->data = $data;
        $this->totalRows = $data->count();
    }

    public function collection()
    {
        $collection = collect();
        
        // Row 1: Title Row
        $collection->push(['LAPORAN DETAIL KEPATUHAN PELATIHAN']);
        
        // Row 2: Empty
        $collection->push(['']);
        
        // Row 3: Subtitle
        $collection->push(['Tanggal Export: ' . Carbon::now()->format('d-m-Y H:i:s') . ' | Total Data: ' . $this->totalRows . ' peserta']);
        
        // Row 4: Header
        $collection->push([
            'ID',
            'Nama Lengkap',
            'NIP',
            'Email',
            'Departemen',
            'Status User',
            'Role',
            'Total Training',
            'Training Selesai',
            'Completion %',
            'Compliance Rate',
            'Tgl Pendaftaran'
        ]);

        // Data Rows
        foreach ($this->data as $item) {
            $totalTraining = $item->total_trainings ?? 0;
            $completedTraining = $item->completed_trainings ?? 0;
            $completionPercentage = $totalTraining > 0 ? round(($completedTraining / $totalTraining) * 100, 2) : 0;

            $collection->push([
                $item->id ?? '-',
                $item->name ?? '-',
                $item->nip ?? '-',
                $item->email ?? '-',
                $item->department ?? '-',
                strtoupper($item->status ?? 'unknown'),
                $item->role ?? '-',
                $totalTraining,
                $completedTraining,
                $completionPercentage . '%',
                $completionPercentage >= 80 ? 'COMPLIANT' : 'NON-COMPLIANT',
                isset($item->created_at) ? Carbon::parse($item->created_at)->format('d-m-Y') : '-'
            ]);
        }

        return $collection;
    }

    public function styles(Worksheet $sheet)
    {
        $headerColor = '1F4E78'; // Navy Blue
        $lightColor = 'F9F9F9';
        $borderColor = 'E0E0E0';
        $lastRow = $this->totalRows + 4;

        // Row 1: Merge title cell
        $sheet->mergeCells('A1:L1');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $headerColor]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension('1')->setRowHeight(30);

        // Row 2: Empty
        $sheet->getRowDimension('2')->setRowHeight(5);

        // Row 3: Subtitle
        $sheet->mergeCells('A3:L3');
        $sheet->getStyle('A3')->applyFromArray([
            'font' => ['size' => 10, 'italic' => true, 'color' => ['rgb' => '666666']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension('3')->setRowHeight(18);

        // Row 4: Header
        $headerRange = 'A4:L4';
        $sheet->getStyle($headerRange)->applyFromArray([
            'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $headerColor]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'border' => ['allBorders' => ['style' => Border::BORDER_THIN, 'color' => ['rgb' => $borderColor]]],
        ]);
        $sheet->getRowDimension('4')->setRowHeight(25);

        // Data rows styling
        for ($row = 5; $row <= $lastRow; $row++) {
            // Alternating row colors
            if (($row - 5) % 2 === 0) {
                $sheet->getStyle("A{$row}:L{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $lightColor]],
                ]);
            }
            
            // Borders
            $sheet->getStyle("A{$row}:L{$row}")->applyFromArray([
                'border' => ['allBorders' => ['style' => Border::BORDER_THIN, 'color' => ['rgb' => $borderColor]]],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                'font' => ['size' => 10],
            ]);
        }

        // Center alignment untuk kolom tertentu
        for ($row = 5; $row <= $lastRow; $row++) {
            $sheet->getStyle("A{$row}:A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("F{$row}:F{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("H{$row}:K{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        // Freeze panes
        $sheet->freezePane('A5');

        // Auto-filter
        $sheet->setAutoFilter($headerRange);

        return [];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 6,
            'B' => 18,
            'C' => 13,
            'D' => 20,
            'E' => 15,
            'F' => 12,
            'G' => 10,
            'H' => 14,
            'I' => 15,
            'J' => 12,
            'K' => 14,
            'L' => 15,
        ];
    }

    public function title(): string
    {
        return 'Data Kepatuhan';
    }
}
