<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Color;

class ComplianceReportExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithEvents, WithColumnFormatting
{
    protected $data;
    protected $title;

    public function __construct($data, $title = 'Laporan Kepatuhan')
    {
        $this->data = collect($data); // Pastikan jadi collection
        $this->title = $title;
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        return $this->data;
    }

    /**
     * Mapping data agar rapi di kolom
     */
    public function map($row): array
    {
        // Pastikan $row array atau object
        $row = (object) $row;

        // Hitung persentase untuk display
        $complianceRaw = isset($row->compliance_rate) ? $row->compliance_rate / 100 : 0;

        return [
            $row->name ?? '-',
            $row->nip ?? '-',
            $row->email ?? '-',
            strtoupper($row->department ?? 'General'),
            $row->total_trainings ?? 0,
            $row->completed_trainings ?? 0,
            $complianceRaw, // Value desimal (0.1 - 1.0)
            ($row->compliance_rate >= 80) ? 'COMPLIANT' : 'NON-COMPLIANT',
            \Carbon\Carbon::parse($row->created_at)->format('d-m-Y'),
        ];
    }

    /**
     * Judul Header Kolom
     */
    public function headings(): array
    {
        return [
            ['LAPORAN KEPATUHAN & TRAINING - ' . strtoupper(config('app.name'))],
            ['Generated at: ' . now()->format('d M Y H:i')],
            [],
            [
                'Nama Karyawan',
                'NIP / ID',
                'Email',
                'Departemen',
                'Total Training',
                'Selesai',
                'Rate (%)',
                'Status',
                'Bergabung Sejak'
            ]
        ];
    }

    /**
     * Format Angka & Persentase
     */
    public function columnFormats(): array
    {
        return [
            'G' => NumberFormat::FORMAT_PERCENTAGE_00,
        ];
    }

    /**
     * Styling Visual (Warna, Font, Border)
     */
    public function styles(Worksheet $sheet)
    {
        return [
            // Style Judul Utama (Row 1)
            1 => [
                'font' => ['bold' => true, 'size' => 14, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF005E54']],
            ],
            // Style Timestamp (Row 2)
            2 => [
                'font' => ['italic' => true, 'size' => 10, 'color' => ['argb' => 'FF666666']],
            ],
            // Style Header Tabel (Row 4)
            4 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF2D3748']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }

    /**
     * Event Logic (Freeze Pane, AutoFilter, Conditional Formatting)
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $lastRow = $sheet->getHighestRow();
                $lastColumn = $sheet->getHighestColumn();

                // 1. Merge Cells untuk Judul
                $sheet->mergeCells('A1:' . $lastColumn . '1');
                
                // 2. Freeze Pane (Agar header Row 4 tetap terlihat saat scroll)
                $sheet->freezePane('A5'); 

                // 3. Pasang AutoFilter pada Header Tabel
                $sheet->setAutoFilter('A4:' . $lastColumn . $lastRow);

                // 4. Set Border untuk seluruh tabel data
                $styleArray = [
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['argb' => 'FFCBD5E0'],
                        ],
                    ],
                    'alignment' => [
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ];
                $sheet->getStyle('A4:' . $lastColumn . $lastRow)->applyFromArray($styleArray);

                // 5. Center Alignment untuk kolom angka tertentu
                $sheet->getStyle('B5:B' . $lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle('E5:I' . $lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // 6. CONDITIONAL FORMATTING (Warna Cell Otomatis)
                for ($i = 5; $i <= $lastRow; $i++) {
                    $status = $sheet->getCell('H' . $i)->getValue();
                    
                    if ($status === 'COMPLIANT') {
                        $sheet->getStyle('H' . $i)->getFont()->setColor(new Color(Color::COLOR_DARKGREEN));
                        $sheet->getStyle('H' . $i)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFC6F6D5');
                    } else {
                        $sheet->getStyle('H' . $i)->getFont()->setColor(new Color(Color::COLOR_RED));
                        $sheet->getStyle('H' . $i)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFFED7D7');
                    }
                }
            },
        ];
    }
}
