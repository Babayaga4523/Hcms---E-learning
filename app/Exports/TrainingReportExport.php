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

class TrainingReportExport implements FromArray, WithTitle, ShouldAutoSize, WithStyles, WithEvents, WithColumnFormatting
{
    protected $program;
    protected $stats;
    protected $participants;
    protected $sheetName;
    
    // --- PALET WARNA (Tema Hijau Profesional) ---
    const COLOR_HEADER_BG   = '0F766E';  // Hijau Tua (Header Tabel)
    const COLOR_TITLE_BG    = '005E54';  // Hijau Lebih Tua (Judul Atas)
    const COLOR_ZEBRA_BG    = 'F1F5F9';  // Abu-abu sangat muda (Baris Genap)
    const COLOR_TEXT_WHITE  = 'FFFFFF';
    const COLOR_BORDER      = 'CBD5E1';  // Garis Abu-abu
    const COLOR_TEXT_DARK   = '1E293B';  // Teks Hitam

    public function __construct($program = null, $stats = null, $participants = [], $sheetName = 'Participants')
    {
        $this->program = $program;
        $this->stats = $stats ?? [];
        $this->participants = $participants;
        $this->sheetName = $sheetName;
    }

    /**
     * MENYUSUN DATA BARIS DEMI BARIS
     * Pastikan urutan ini jangan diubah agar styling pas di Baris 13
     */
    public function array(): array
    {
        $rows = [];
        
        // Row 1: Judul Utama
        $rows[] = ['LAPORAN ANALYTICS PROGRAM PELATIHAN']; 
        
        // Row 2: Nama Program
        $programTitle = $this->program ? $this->program->title : 'Program Pelatihan';
        $rows[] = ['Program: ' . $programTitle]; 
        
        // Row 3: Tanggal Export
        $rows[] = ['Tanggal Export: ' . date('d F Y, H:i')]; 
        
        // Row 4: (Kosong)
        $rows[] = []; 

        // Row 5: Judul Statistik
        $rows[] = ['RINGKASAN STATISTIK']; 
        
        // Row 6-10: Data Statistik
        $rows[] = ['Total Peserta', $this->stats['enrollment_count'] ?? 0, 'Peserta terdaftar'];
        $rows[] = ['Peserta Selesai', $this->stats['completion_count'] ?? 0, 'Peserta menyelesaikan program'];
        $rows[] = ['Lulus', $this->stats['pass_count'] ?? 0, 'Nilai di atas passing grade'];
        $rows[] = ['Tingkat Kelulusan', ($this->stats['pass_rate'] ?? 0) . '%', 'Persentase kelulusan'];
        $rows[] = ['Rata-rata Nilai', number_format($this->stats['avg_score'] ?? 0, 2), 'Nilai rata-rata akhir'];
        
        // Row 11: (Kosong)
        $rows[] = []; 

        // Row 12: Judul Bagian Peserta
        $rows[] = ['DETAIL PESERTA']; 
        
        // Row 13: HEADER TABEL UTAMA (Target Styling Hijau & Filter)
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

        // Row 14+: Data Peserta
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
     * LOGIC STYLING DAN FILTER
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $lastRow = $sheet->getHighestRow();
                $lastCol = 'M'; // Kolom terakhir

                // --- KOORDINAT PENTING (HARUS SESUAI DENGAN ARRAY DI ATAS) ---
                $ROW_TITLE      = 1;
                $ROW_STATS_HEAD = 5;
                $ROW_TABLE_HEAD = 13; // Header tabel PASTI di baris 13
                $ROW_DATA_START = 14; // Data mulai di baris 14

                // 1. SET FONT GLOBAL
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

                // 5. STYLING JUDUL BAGIAN (Row 12)
                $sheet->getStyle("A12")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['rgb' => self::COLOR_HEADER_BG]],
                ]);

                // =========================================================
                // 6. STYLING HEADER TABEL (Row 13) - INI YANG ANDA CARI
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

                // *** PASANG FILTER TEPAT DI BARIS HEADER (13) ***
                // Filter akan mencakup dari Header (13) sampai data terakhir
                $sheet->setAutoFilter($headerRange . $lastRow); 

                // *** FREEZE PANE ***
                // Bekukan layar di bawah baris 13 (mulai baris 14 bisa discroll)
                $sheet->freezePane("A" . ($ROW_TABLE_HEAD + 1));

                // 7. STYLING BARIS DATA (Row 14 ke bawah)
                if ($lastRow >= $ROW_DATA_START) {
                    $dataRange = "A{$ROW_DATA_START}:{$lastCol}{$lastRow}";

                    // Border tipis untuk semua data
                    $sheet->getStyle($dataRange)->applyFromArray([
                        'borders' => [
                            'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => self::COLOR_BORDER]]
                        ],
                        'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                    ]);

                    // Zebra Striping (Warna selang-seling)
                    for ($row = $ROW_DATA_START; $row <= $lastRow; $row++) {
                        if ($row % 2 == 0) { // Baris genap
                            $sheet->getStyle("A{$row}:{$lastCol}{$row}")->getFill()
                                ->setFillType(Fill::FILL_SOLID)
                                ->getStartColor()->setARGB(self::COLOR_ZEBRA_BG);
                        }
                    }

                    // Perataan Teks (Alignment)
                    // Kiri: Nama, Dept, Email (B, C, D)
                    $sheet->getStyle("B{$ROW_DATA_START}:D{$lastRow}")
                          ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                    
                    // Tengah: Sisanya
                    $sheet->getStyle("A{$ROW_DATA_START}:A{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle("E{$ROW_DATA_START}:M{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                    // Conditional Formatting (Warna Status LULUS/TIDAK)
                    for ($row = $ROW_DATA_START; $row <= $lastRow; $row++) {
                        $hasilCell = "J{$row}"; 
                        $val = $sheet->getCell($hasilCell)->getValue();
                        
                        if ($val === 'LULUS') {
                            $sheet->getStyle($hasilCell)->applyFromArray([
                                'font' => ['bold' => true, 'color' => ['rgb' => '166534']], // Hijau
                                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'DCFCE7']]
                            ]);
                        } elseif ($val === 'TIDAK LULUS') {
                            $sheet->getStyle($hasilCell)->applyFromArray([
                                'font' => ['bold' => true, 'color' => ['rgb' => '991B1B']], // Merah
                                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FEE2E2']]
                            ]);
                        }
                    }
                }
            }
        ];
    }

    /**
     * Format Angka & Persen
     */
    public function columnFormats(): array
    {
        return [
            'F' => '0',             // Pre-Test (Bulat)
            'G' => '0',             // Post-Test (Bulat)
            'H' => NumberFormat::FORMAT_PERCENTAGE_00, // Progress (contoh: 100.00%)
            'I' => '0.00',          // Nilai Akhir (2 desimal)
            'M' => '0.0 "Jam"',     // Durasi
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