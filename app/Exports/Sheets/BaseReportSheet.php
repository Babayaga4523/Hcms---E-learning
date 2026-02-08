<?php

namespace App\Exports\Sheets;

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
 * BASE REPORT SHEET - Enterprise Grade Template
 * 
 * Fitur Profesional:
 * ✅ Auto Filter pada header
 * ✅ Freeze Pane (header tetap terlihat saat scroll)
 * ✅ Zebra Striping (warna selang-seling)
 * ✅ Professional Styling (Wondr Theme)
 * ✅ Border & Padding
 * ✅ Auto Wrap Text
 * ✅ Merged Title Row
 */
abstract class BaseReportSheet implements FromArray, WithHeadings, WithTitle, ShouldAutoSize, WithStyles, WithEvents, WithColumnFormatting
{
    protected $data;
    protected $sheetTitle;
    protected $sheetDescription = '';
    
    // Wondr Theme Colors
    const BRAND_COLOR_DARK  = '005E54';  // Hijau Tua (Judul)
    const BRAND_COLOR_MED   = '0F766E';  // Hijau Medium (Header)
    const BRAND_COLOR_LIGHT = 'F0FDF4';  // Hijau Sangat Muda (Zebra)
    const TEXT_WHITE        = 'FFFFFF';
    const TEXT_DARK         = '1E293B';
    const BORDER_COLOR      = 'CBD5E1';

    public function __construct(array $data = [], string $title = 'Report')
    {
        $this->data = $data;
        $this->sheetTitle = $title;
    }

    /**
     * Method Abstract - Wajib diimplementasi di child class
     */
    abstract public function prepareData(): array;
    abstract public function headerColumns(): array;

    /**
     * Susunan Baris Excel dengan metadata
     * Format: Row 1-3 metadata, Row 4 header, Row 5+ data
     */
    public function array(): array
    {
        $rows = [];
        
        // Row 1: Judul Utama
        $rows[] = [strtoupper($this->sheetTitle)];
        
        // Row 2: Deskripsi & Metadata
        $description = $this->sheetDescription ? 
            $this->sheetDescription . ' | Generated: ' . date('d M Y H:i') :
            'Generated: ' . date('d M Y H:i') . ' | System Report';
        $rows[] = [$description];
        
        // Row 3: Spacer
        $rows[] = [];

        // Row 4: Header Columns (diatur oleh prepareData untuk disinkronisasi dengan data)
        // Data dimulai dari row 5
        return array_merge($rows, [$this->headerColumns()], $this->prepareData());
    }

    /**
     * Headings HANYA untuk Maatwebsite/Excel (tidak terlihat di output karena sudah ada di array())
     * Dummy implementation untuk compatibility
     */
    public function headings(): array
    {
        return $this->headerColumns();
    }

    /**
     * Nama Sheet di Tab Excel
     */
    public function title(): string
    {
        return substr($this->sheetTitle, 0, 30);
    }

    /**
     * Styling Statis
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
            // Row 3: Spacer (no style)
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
     * Advanced Formatting - Auto Filter, Freeze Pane, Zebra Striping
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $lastRow = $sheet->getHighestRow();
                $lastCol = $sheet->getHighestColumn();
                $headerRow = 4;

                // 1. Merge Judul di Row 1
                $sheet->mergeCells('A1:' . $lastCol . '1');
                $sheet->getRowDimension(1)->setRowHeight(35);

                // 2. Merge Metadata di Row 2
                $sheet->mergeCells('A2:' . $lastCol . '2');
                $sheet->getRowDimension(2)->setRowHeight(22);

                // 3. Set Row Height Header
                $sheet->getRowDimension($headerRow)->setRowHeight(28);

                // 4. Auto Filter pada Header
                $sheet->setAutoFilter('A' . $headerRow . ':' . $lastCol . $lastRow);

                // 5. Freeze Pane pada Baris Data Pertama (Row 5)
                $sheet->freezePane('A5');

                // 6. Border untuk Seluruh Data
                $rangeData = 'A' . $headerRow . ':' . $lastCol . $lastRow;
                $sheet->getStyle($rangeData)->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => self::BORDER_COLOR],
                        ],
                    ],
                ]);

                // 7. Zebra Striping (Warna selang-seling)
                for ($i = 5; $i <= $lastRow; $i++) {
                    if ($i % 2 == 0) {
                        $sheet->getStyle('A' . $i . ':' . $lastCol . $i)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => self::BRAND_COLOR_LIGHT],
                            ],
                        ]);
                    }
                }

                // 8. Center alignment untuk semua data row
                $sheet->getStyle('A' . $headerRow . ':' . $lastCol . $lastRow)->getAlignment()
                    ->setVertical(Alignment::VERTICAL_CENTER);

                // 9. Wrap text untuk kolom B (panjang teks)
                $sheet->getStyle('B' . $headerRow . ':B' . $lastRow)->getAlignment()->setWrapText(true);
            },
        ];
    }

    /**
     * Default Column Format (Override di child class jika perlu)
     */
    public function columnFormats(): array
    {
        return [];
    }
}
