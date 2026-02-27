<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
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

/**
 * EXAM ATTEMPTS EXPORT - Enterprise Grade Template
 * 
 * Fitur Profesional:
 * ✅ Auto Filter pada header
 * ✅ Freeze Pane (header tetap terlihat saat scroll)
 * ✅ Zebra Striping (warna selang-seling)
 * ✅ Professional Wondr Styling
 * ✅ Summary Statistics di bawah
 * ✅ Color Coding untuk Status (Lulus/Tidak Lulus)
 * ✅ Auto Wrap Text
 * ✅ Proper Column Width
 */
class ExamAttemptsExport implements FromArray, WithTitle, ShouldAutoSize, WithStyles, WithEvents, WithColumnFormatting
{
    protected $data;
    protected $module;
    
    // Wondr Theme Colors
    const BRAND_COLOR_DARK  = '005E54';  // Hijau Tua (Judul)
    const BRAND_COLOR_MED   = '0F766E';  // Hijau Medium (Header)
    const BRAND_COLOR_LIGHT = 'F0FDF4';  // Hijau Sangat Muda (Zebra)
    const TEXT_WHITE        = 'FFFFFF';
    const TEXT_DARK         = '1E293B';
    const BORDER_COLOR      = 'CBD5E1';
    const SUCCESS_COLOR     = '10B981';  // Green (Lulus)
    const DANGER_COLOR      = 'EF4444';  // Red (Tidak Lulus)

    public function __construct(array $data = [], $module = null)
    {
        $this->data = $data;
        $this->module = $module;
    }

    /**
     * Excel Array Data dengan Metadata
     */
    public function array(): array
    {
        $rows = [];
        
        // Row 1: Judul Utama
        $rows[] = ['LAPORAN HASIL UJIAN'];
        
        // Row 2: Metadata
        $moduleName = $this->module ? $this->module->title : 'Semua Modul';
        $rows[] = ['Modul: ' . $moduleName . ' | Tanggal Export: ' . date('d M Y H:i')];
        
        // Row 3: Spacer
        $rows[] = [];

        // Row 4: Header Columns
        $rows[] = [
            'No.',
            'Nama Peserta',
            'Email',
            'Departemen',
            'Tipe Ujian',
            'Nilai Akhir',
            'Persentase (%)',
            'Status',
            'Waktu Mulai',
            'Waktu Selesai',
            'Durasi (Menit)',
        ];

        // Row 5+: Data
        foreach ($this->data as $index => $attempt) {
            $rows[] = [
                $index + 1,
                $attempt['user_name'] ?? 'N/A',
                $attempt['user_email'] ?? 'N/A',
                $attempt['user_department'] ?? 'N/A',
                $attempt['exam_type'] ?? 'N/A',
                $attempt['score'] ?? 0,
                $attempt['percentage'] ?? 0,
                $attempt['status'] ?? 'N/A',
                $attempt['started_at'] ?? 'N/A',
                $attempt['finished_at'] ?? 'N/A',
                $attempt['duration_minutes'] ?? 0,
            ];
        }

        // Summary Section (setelah data)
        $totalAttempts = count($this->data);
        $passedAttempts = count(array_filter($this->data, fn($d) => $d['status'] === 'LULUS'));
        $failedAttempts = $totalAttempts - $passedAttempts;
        $avgScore = $totalAttempts > 0 ? array_sum(array_column($this->data, 'score')) / $totalAttempts : 0;
        $avgPercentage = $totalAttempts > 0 ? array_sum(array_column($this->data, 'percentage')) / $totalAttempts : 0;

        // Add spacing
        $rows[] = [];
        $rows[] = [];

        // Add summary
        $rows[] = ['RINGKASAN STATISTIK'];
        $rows[] = [];
        $rows[] = ['Total Ujian', $totalAttempts];
        $rows[] = ['Yang Lulus', $passedAttempts];
        $rows[] = ['Yang Tidak Lulus', $failedAttempts];
        $rows[] = ['Rata-rata Nilai', number_format($avgScore, 2)];
        $rows[] = ['Rata-rata Persentase', number_format($avgPercentage, 2) . '%'];

        return $rows;
    }

    /**
     * Headings untuk compatibility
     */
    public function headings(): array
    {
        return [
            'No.',
            'Nama Peserta',
            'Email',
            'Departemen',
            'Tipe Ujian',
            'Nilai Akhir',
            'Persentase (%)',
            'Status',
            'Waktu Mulai',
            'Waktu Selesai',
            'Durasi (Menit)',
        ];
    }

    /**
     * Nama Sheet di Tab Excel
     */
    public function title(): string
    {
        return 'Hasil Ujian';
    }

    /**
     * Styling Statis untuk Judul dan Header
     */
    public function styles(Worksheet $sheet)
    {
        return [
            // Row 1: Judul Utama
            1 => [
                'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => self::TEXT_WHITE]],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::BRAND_COLOR_DARK]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            ],
            // Row 2: Metadata
            2 => [
                'font' => ['italic' => true, 'size' => 9, 'color' => ['rgb' => '64748B']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            ],
            // Row 4: Header Tabel
            4 => [
                'font' => ['bold' => true, 'color' => ['rgb' => self::TEXT_WHITE], 'size' => 11],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::BRAND_COLOR_MED]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
                'borders' => [
                    'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => self::BORDER_COLOR]]
                ],
            ],
        ];
    }

    /**
     * Advanced Formatting - Auto Filter, Freeze Pane, Zebra Striping, Color Coding
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $lastRow = $sheet->getHighestRow();
                $lastCol = $sheet->getHighestColumn();
                $headerRow = 4;
                $dataStartRow = 5;

                // 1. Merge Judul di Row 1
                $sheet->mergeCells('A1:' . $lastCol . '1');
                $sheet->getRowDimension(1)->setRowHeight(35);

                // 2. Merge Metadata di Row 2
                $sheet->mergeCells('A2:' . $lastCol . '2');
                $sheet->getRowDimension(2)->setRowHeight(22);

                // 3. Set Row Height Header
                $sheet->getRowDimension($headerRow)->setRowHeight(28);

                // 4. Auto Filter pada Header
                $sheet->setAutoFilter('A' . $headerRow . ':' . $lastCol . ($dataStartRow + count($this->data) - 1));

                // 5. Freeze Pane pada Baris Data Pertama (Row 5)
                $sheet->freezePane('A5');

                // 6. Border untuk Seluruh Data
                $dataEndRow = $dataStartRow + count($this->data) - 1;
                $rangeData = 'A' . $headerRow . ':' . $lastCol . $dataEndRow;
                $sheet->getStyle($rangeData)->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => self::BORDER_COLOR],
                        ],
                    ],
                ]);

                // 7. Zebra Striping (Warna selang-seling) + Color Coding untuk Status
                for ($i = $dataStartRow; $i <= $dataEndRow; $i++) {
                    $statusCell = 'H' . $i;
                    $statusValue = $sheet->getCell($statusCell)->getValue();

                    // Determine status color
                    $statusColor = '';
                    if (strpos($statusValue, 'LULUS') !== false) {
                        $statusColor = self::SUCCESS_COLOR;
                    } elseif (strpos($statusValue, 'TIDAK') !== false) {
                        $statusColor = self::DANGER_COLOR;
                    }

                    // Apply zebra striping background
                    if ($i % 2 == 0) {
                        $sheet->getStyle('A' . $i . ':' . $lastCol . $i)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => self::BRAND_COLOR_LIGHT],
                            ],
                        ]);
                    }

                    // Apply status color
                    if ($statusColor) {
                        $sheet->getStyle($statusCell)->applyFromArray([
                            'font' => ['bold' => true, 'color' => ['rgb' => self::TEXT_WHITE]],
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => $statusColor],
                            ],
                            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                        ]);
                    }
                }

                // 8. Center alignment untuk kolom-kolom angka
                $numericCols = ['A', 'F', 'G', 'K']; // No., Nilai, Persentase, Durasi
                foreach ($numericCols as $col) {
                    $sheet->getStyle($col . $headerRow . ':' . $col . $dataEndRow)
                        ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                }

                // 9. Format Number Columns
                $sheet->getStyle('F' . $dataStartRow . ':F' . $dataEndRow)
                    ->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1); // Nilai
                $sheet->getStyle('G' . $dataStartRow . ':G' . $dataEndRow)
                    ->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1); // Persentase
                $sheet->getStyle('K' . $dataStartRow . ':K' . $dataEndRow)
                    ->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_NUMBER); // Durasi

                // 10. Set Optimal Column Width
                $sheet->getColumnDimension('A')->setWidth(6);   // No.
                $sheet->getColumnDimension('B')->setWidth(20);  // Nama
                $sheet->getColumnDimension('C')->setWidth(25);  // Email
                $sheet->getColumnDimension('D')->setWidth(18);  // Departemen
                $sheet->getColumnDimension('E')->setWidth(15);  // Tipe Ujian
                $sheet->getColumnDimension('F')->setWidth(12);  // Nilai
                $sheet->getColumnDimension('G')->setWidth(12);  // Persentase
                $sheet->getColumnDimension('H')->setWidth(14);  // Status
                $sheet->getColumnDimension('I')->setWidth(18);  // Waktu Mulai
                $sheet->getColumnDimension('J')->setWidth(18);  // Waktu Selesai
                $sheet->getColumnDimension('K')->setWidth(14);  // Durasi

                // 11. Wrap text untuk Email dan Nama
                $sheet->getStyle('B' . $headerRow . ':C' . $dataEndRow)
                    ->getAlignment()->setWrapText(true);
            },
        ];
    }

    /**
     * Column Format
     */
    public function columnFormats(): array
    {
        return [
            'F' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'G' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'K' => NumberFormat::FORMAT_NUMBER,
        ];
    }
}
