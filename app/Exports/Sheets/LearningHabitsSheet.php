<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Events\AfterSheet;

class LearningHabitsSheet extends BaseReportSheet
{
    public function __construct(array $data = [], $title = 'LEARNING HABITS ANALYTICS')
    {
        parent::__construct($data, $title);
        $this->sheetDescription = 'Tren Pembelajaran Harian & Pola Waktu Belajar Optimal (Heatmap Analytics)';
    }

    public function headerColumns(): array
    {
        return [
            'Tanggal',
            'Hari',
            'Total Active Users',
            'Modules Started',
            'Modules Completed',
            'Avg Time Spent (min)',
            'Peak Hour (0-23)',
            'Monday Avg',
            'Tuesday Avg',
            'Wednesday Avg',
            'Thursday Avg',
            'Friday Avg',
            'Saturday Avg',
            'Sunday Avg'
        ];
    }

    public function prepareData(): array
    {
        // Combine data from trend and heatmap
        $trendData = $this->data['trendData'] ?? [];
        $heatmapData = $this->data['performanceHeatmap'] ?? [];
        
        if (empty($trendData)) {
            return [['', '', '', '', '', '', '', '', '', '', '', '', '', '']];
        }

        // Build heatmap index by day of week
        $heatmapIndex = [];
        foreach ((array)$heatmapData as $item) {
            $dayOfWeek = is_object($item) ? ($item->day_of_week ?? null) : ($item['day_of_week'] ?? null);
            if ($dayOfWeek) {
                $heatmapIndex[$dayOfWeek] = $item;
            }
        }

        // Day of week names
        $dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        // Weekly averages (will be populated from heatmap data)
        $weeklyAvg = array_fill(0, 7, 0);
        foreach ($heatmapIndex as $dayOfWeek => $item) {
            $avg = is_object($item) ? ($item->avg_engagement ?? 0) : ($item['avg_engagement'] ?? 0);
            $weeklyAvg[(int)$dayOfWeek] = $avg;
        }

        return array_map(function($trend, $index) use ($dayNames, $weeklyAvg, $heatmapIndex) {
            $date = is_object($trend) ? ($trend->date ?? '') : ($trend['date'] ?? '');
            $dayOfWeek = is_object($trend) ? ($trend->day_of_week ?? 0) : ($trend['day_of_week'] ?? 0);
            $activeUsers = is_object($trend) ? ($trend->active_users ?? 0) : ($trend['active_users'] ?? 0);
            $modulesStarted = is_object($trend) ? ($trend->modules_started ?? 0) : ($trend['modules_started'] ?? 0);
            $modulesCompleted = is_object($trend) ? ($trend->modules_completed ?? 0) : ($trend['modules_completed'] ?? 0);
            $avgTimeSpent = is_object($trend) ? ($trend->avg_time_spent ?? 0) : ($trend['avg_time_spent'] ?? 0);
            $peakHour = is_object($trend) ? ($trend->peak_hour ?? 0) : ($trend['peak_hour'] ?? 0);
            
            return [
                $date,
                $dayNames[$dayOfWeek] ?? 'Unknown',
                $activeUsers,
                $modulesStarted,
                $modulesCompleted,
                round($avgTimeSpent, 2),
                $peakHour . ':00',
                round($weeklyAvg[1], 1),  // Monday
                round($weeklyAvg[2], 1),  // Tuesday
                round($weeklyAvg[3], 1),  // Wednesday
                round($weeklyAvg[4], 1),  // Thursday
                round($weeklyAvg[5], 1),  // Friday
                round($weeklyAvg[6], 1),  // Saturday
                round($weeklyAvg[0], 1),  // Sunday
            ];
        }, (array)$trendData, array_keys((array)$trendData));
    }

    public function columnFormats(): array
    {
        return [
            'F' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'H' => '#,##0.0',
            'I' => '#,##0.0',
            'J' => '#,##0.0',
            'K' => '#,##0.0',
            'L' => '#,##0.0',
            'M' => '#,##0.0',
            'N' => '#,##0.0',
        ];
    }

    public function registerEvents(): array
    {
        $baseEvents = parent::registerEvents();
        
        $baseEvents[AfterSheet::class] = function(AfterSheet $event) {
            $sheet = $event->sheet->getDelegate();
            $lastRow = $sheet->getHighestRow();
            $lastCol = $sheet->getHighestColumn();
            $headerRow = 4;

            // Merge Judul
            $sheet->mergeCells('A1:' . $lastCol . '1');
            $sheet->getRowDimension(1)->setRowHeight(35);

            // Merge Metadata
            $sheet->mergeCells('A2:' . $lastCol . '2');
            $sheet->getRowDimension(2)->setRowHeight(22);

            // Header styling
            $sheet->getRowDimension($headerRow)->setRowHeight(28);

            // Column widths
            $widths = [
                'A' => 14, 'B' => 12, 'C' => 14, 'D' => 14, 'E' => 14, 'F' => 15,
                'G' => 12, 'H' => 11, 'I' => 11, 'J' => 12, 'K' => 12, 'L' => 11, 'M' => 12, 'N' => 11
            ];
            
            foreach ($widths as $col => $width) {
                $sheet->getColumnDimension($col)->setWidth($width);
            }

            // Auto filter
            $sheet->setAutoFilter('A' . $headerRow . ':' . $lastCol . $lastRow);

            // Freeze pane
            $sheet->freezePane('A5');

            // Border all data
            $rangeData = 'A' . $headerRow . ':' . $lastCol . $lastRow;
            $sheet->getStyle($rangeData)->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => self::BORDER_COLOR],
                    ],
                ],
            ]);

            // Zebra striping
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

            // Color heatmap columns (H-N) based on engagement levels
            $heatmapCols = ['H', 'I', 'J', 'K', 'L', 'M', 'N'];
            for ($i = 5; $i <= $lastRow; $i++) {
                foreach ($heatmapCols as $col) {
                    $cell = $sheet->getCell($col . $i);
                    $value = (float)$cell->getValue();
                    
                    if ($value >= 75) {
                        $cell->getStyle()->applyFromArray([
                            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'D4EDDA']],
                            'font' => ['color' => ['rgb' => '155724']],
                        ]);
                    } elseif ($value >= 50) {
                        $cell->getStyle()->applyFromArray([
                            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'D1ECF1']],
                            'font' => ['color' => ['rgb' => '0C5460']],
                        ]);
                    } elseif ($value > 0) {
                        $cell->getStyle()->applyFromArray([
                            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FFF3CD']],
                            'font' => ['color' => ['rgb' => '856404']],
                        ]);
                    }
                }
            }


        };
        
        return $baseEvents;
    }
}
