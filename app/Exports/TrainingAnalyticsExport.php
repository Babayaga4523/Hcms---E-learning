<?php

namespace App\Exports;

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

class TrainingAnalyticsExport implements FromArray, WithTitle, ShouldAutoSize, WithStyles, WithEvents, WithColumnFormatting
{
    protected $program;
    protected $stats;
    protected $participants;
    protected $sheetName;
    
    // --- KONFIGURASI WARNA (Professional Theme) ---
    const COLOR_HEADER_BG   = '0F766E';  // Teal Dark (Background Header)
    const COLOR_TITLE_BG    = '005E54';  // Teal Darker (Background Judul)
    const COLOR_ZEBRA_BG    = 'F1F5F9';  // Slate 100 (Warna Baris Genap - Lebih soft dari sebelumnya)
    const COLOR_TEXT_WHITE  = 'FFFFFF';
    const COLOR_BORDER      = 'CBD5E1';  // Slate 300
    const COLOR_TEXT_DARK   = '1E293B';  // Slate 800

    public function __construct($program = null, $stats = null, $participants = [], $sheetName = 'Participants')
    {
        $this->program = $program;
        $this->stats = $stats ?? [];
        $this->participants = $participants;
        $this->sheetName = $sheetName;
    }

    /**
     * Menyusun Data Baris per Baris
     */
    public function array(): array
    {
        $rows = [];
        
        // [Row 1] Judul Utama
        $rows[] = ['LAPORAN ANALYTICS PROGRAM PELATIHAN']; 
        
        // [Row 2] Sub Judul
        $programTitle = $this->program ? $this->program->title : 'Program Pelatihan';
        $rows[] = ['Program: ' . $programTitle]; 
        
        // [Row 3] Tanggal
        $rows[] = ['Tanggal Export: ' . date('d F Y, H:i')]; 
        
        // [Row 4] Spacer Kosong
        $rows[] = []; 

        // [Row 5] Judul Bagian Statistik
        $rows[] = ['RINGKASAN STATISTIK']; 
        
        // [Row 6-10] Data Statistik
        $rows[] = ['Total Peserta', $this->stats['enrollment_count'] ?? 0, 'Peserta terdaftar'];
        $rows[] = ['Peserta Selesai', $this->stats['completion_count'] ?? 0, 'Peserta menyelesaikan program'];
        $rows[] = ['Lulus', $this->stats['pass_count'] ?? 0, 'Nilai di atas passing grade'];
        $rows[] = ['Tingkat Kelulusan', ($this->stats['pass_rate'] ?? 0) . '%', 'Persentase kelulusan'];
        $rows[] = ['Rata-rata Nilai', number_format($this->stats['avg_score'] ?? 0, 2), 'Nilai rata-rata akhir'];
        
        // [Row 11] Spacer
        $rows[] = []; 

        // [Row 12] Judul Bagian Peserta
        $rows[] = ['DETAIL PESERTA']; 
        
        // [Row 13] HEADER TABEL UTAMA (Ini target Filter & Styling)
        $rows[] = [
            'No',               // A
            'Nama Peserta',     // B
            'Departemen',       // C
            'Email',            // D
            'Status',           // E
            'Pre-Test',         // F
            'Post-Test',        // G
            'Progress',         // H
            'Nilai Akhir',      // I
            'Hasil',            // J
            'Tgl Mulai',        // K
            'Tgl Selesai',      // L
            'Durasi (Jam)',     // M
        ];

        // [Row 14+] Isi Data Peserta
        if (empty($this->participants)) {
            $rows[] = ['Tidak ada data peserta', '', '', '', '', '', '', '', '', '', '', '', ''];
        } else {
            foreach ($this->participants as $index => $p) {
                $rows[] = [
                    $index + 1,
                    $p['name'] ?? '-',
                    $p['department'] ?? '-',
                    $p['email'] ?? '-',
                    $this->formatStatus($p['status'] ?? 'enrolled'),
                    $p['pretest_score'] ?? 0,
                    $p['posttest_score'] ?? 0,
                    ($p['progress'] ?? 0) / 100, // Desimal untuk format persen
                    $p['score'] ?? 0,
                    ($p['is_passed'] ?? false) ? 'LULUS' : 'TIDAK LULUS',
                    isset($p['started_at']) ? date('d/m/Y H:i', strtotime($p['started_at'])) : '-',
                    isset($p['completion_date']) ? date('d/m/Y', strtotime($p['completion_date'])) : '-',
                    $p['duration_hours'] ?? 0,
                ];
            }
        }

        return $rows;
    }

    /**
     * Logic Styling Professional (Event Based)
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $lastRow = $sheet->getHighestRow();
                $lastCol = 'M'; // Kolom terakhir

                // --- DEFINISI POSISI BARIS (PENTING AGAR TIDAK MELESET) ---
                $ROW_TITLE      = 1;
                $ROW_STATS_HEAD = 5;
                $ROW_TABLE_HEAD = 13; // Header tabel ada di baris 13
                $ROW_DATA_START = 14; // Data mulai baris 14

                // 1. SET FONT GLOBAL (Agar terlihat modern)
                $sheet->getParent()->getDefaultStyle()->getFont()->setName('Segoe UI');
                $sheet->getParent()->getDefaultStyle()->getFont()->setSize(10);
                $sheet->getParent()->getDefaultStyle()->getFont()->setColor(new Color(self::COLOR_TEXT_DARK));

                // 2. STYLING JUDUL UTAMA (Row 1)
                $sheet->mergeCells("A{$ROW_TITLE}:{$lastCol}{$ROW_TITLE}");
                $sheet->getStyle("A{$ROW_TITLE}")->applyFromArray([
                    'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => self::COLOR_TEXT_WHITE]],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::COLOR_TITLE_BG]],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]);
                $sheet->getRowDimension($ROW_TITLE)->setRowHeight(35);

                // 3. STYLING INFO PROGRAM (Row 2-3)
                $sheet->getStyle('A2:A3')->getFont()->setBold(true);

                // 4. STYLING HEADER STATISTIK (Row 5)
                $sheet->getStyle("A{$ROW_STATS_HEAD}")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['rgb' => self::COLOR_HEADER_BG]],
                    'borders' => ['bottom' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => self::COLOR_HEADER_BG]]]
                ]);

                // 5. STYLING JUDUL TABEL (Row 12)
                $sheet->getStyle("A12")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['rgb' => self::COLOR_HEADER_BG]],
                ]);

                // =========================================================
                // 6. STYLING HEADER TABEL UTAMA (Row 13) - FILTER DISINI!
                // =========================================================
                $headerRange = "A{$ROW_TABLE_HEAD}:{$lastCol}{$ROW_TABLE_HEAD}";
                
                $sheet->getStyle($headerRange)->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['rgb' => self::COLOR_TEXT_WHITE], 'size' => 11],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => self::COLOR_HEADER_BG]],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                    'borders' => [
                        'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => self::COLOR_BORDER]]
                    ],
                ]);
                $sheet->getRowDimension($ROW_TABLE_HEAD)->setRowHeight(28);

                // *** PASANG AUTO FILTER TEPAT DI HEADER ***
                $sheet->setAutoFilter($headerRange . $lastRow); // Filter dari Header sampai baris terakhir data

                // *** FREEZE PANE (Agar header tetap terlihat saat scroll) ***
                $sheet->freezePane("A" . ($ROW_TABLE_HEAD + 1));

                // 7. STYLING BARIS DATA (Row 14 ke bawah)
                if ($lastRow >= $ROW_DATA_START) {
                    $dataRange = "A{$ROW_DATA_START}:{$lastCol}{$lastRow}";

                    // Border untuk seluruh data
                    $sheet->getStyle($dataRange)->applyFromArray([
                        'borders' => [
                            'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => self::COLOR_BORDER]]
                        ],
                        'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                    ]);

                    // Zebra Striping (Warna selang-seling)
                    for ($row = $ROW_DATA_START; $row <= $lastRow; $row++) {
                        if ($row % 2 == 0) { // Baris genap kasih warna
                            $sheet->getStyle("A{$row}:{$lastCol}{$row}")->getFill()
                                ->setFillType(Fill::FILL_SOLID)
                                ->getStartColor()->setARGB(self::COLOR_ZEBRA_BG);
                        }
                    }

                    // Alignment Khusus per Kolom
                    // Kiri: Nama, Dept, Email (B, C, D)
                    $sheet->getStyle("B{$ROW_DATA_START}:D{$lastRow}")
                          ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                    
                    // Tengah: Sisanya (A, E-M)
                    $sheet->getStyle("A{$ROW_DATA_START}:A{$lastRow}")
                          ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle("E{$ROW_DATA_START}:M{$lastRow}")
                          ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                    // Conditional Formatting (Warna Status LULUS/TIDAK LULUS)
                    for ($row = $ROW_DATA_START; $row <= $lastRow; $row++) {
                        $hasilCell = "J{$row}"; 
                        $val = $sheet->getCell($hasilCell)->getValue();
                        
                        if ($val === 'LULUS') {
                            // Hijau Background + Teks Hijau Tua
                            $sheet->getStyle($hasilCell)->applyFromArray([
                                'font' => ['bold' => true, 'color' => ['rgb' => '166534']], // Green 800
                                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'DCFCE7']] // Green 100
                            ]);
                        } elseif ($val === 'TIDAK LULUS') {
                            // Merah Background + Teks Merah Tua
                            $sheet->getStyle($hasilCell)->applyFromArray([
                                'font' => ['bold' => true, 'color' => ['rgb' => '991B1B']], // Red 800
                                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FEE2E2']] // Red 100
                            ]);
                        }
                    }
                }
            }
        ];
    }

    /**
     * Format Data Kolom Excel (Angka/Persen/Tanggal)
     */
    public function columnFormats(): array
    {
        return [
            'F' => '0',             // Pre-Test (Angka bulat)
            'G' => '0',             // Post-Test (Angka bulat)
            'H' => NumberFormat::FORMAT_PERCENTAGE_00, // Progress (85.50%)
            'I' => '0.00',          // Nilai Akhir (2 desimal)
            'M' => '0.0 "Jam"',     // Durasi dengan suffix "Jam"
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [];
    }

    public function title(): string
    {
        return 'Laporan Peserta';
    }

    private function formatStatus($status)
    {
        return match ($status) {
            'completed' => 'SELESAI',
            'in_progress' => 'BERJALAN',
            'enrolled' => 'TERDAFTAR',
            default => strtoupper($status),
        };
    }
}