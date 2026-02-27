<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Events\AfterSheet;

class ProgramPerformanceSheet extends BaseReportSheet
{
    public function __construct(array $data = [], $title = 'PROGRAM PERFORMANCE')
    {
        parent::__construct($data, $title);
        $this->sheetDescription = 'Performa Program Training - Enrollment, Completion, dan Learning Impact (Pre vs Post)';
    }

    public function headerColumns(): array
    {
        return [
            'Judul Program',
            'Kategori',
            'Total Enrolled',
            'Completed',
            'Completion Rate %',
            'Avg Score',
            'Pass Rate %',
            'Pre-Test Avg',
            'Post-Test Avg',
            'Improvement %',
            'Avg Duration (menit)',
            'Rating'
        ];
    }

    public function prepareData(): array
    {
        // Combine data from multiple sources
        $moduleStats = $this->data['moduleStats'] ?? [];
        $enrollment = $this->data['programEnrollment'] ?? [];
        $impact = $this->data['prePostAnalysis'] ?? [];
        
        if (empty($moduleStats)) {
            return [['', '', '', '', '', '', '', '', '', '', '', '']];
        }

        // Build enrollment index
        $enrollmentIndex = [];
        foreach ((array)$enrollment as $item) {
            $moduleId = is_object($item) ? ($item->module_id ?? null) : ($item['module_id'] ?? null);
            if ($moduleId) $enrollmentIndex[$moduleId] = $item;
        }

        // Build impact index
        $impactIndex = [];
        foreach ((array)$impact as $item) {
            $moduleId = is_object($item) ? ($item->module_id ?? null) : ($item['module_id'] ?? null);
            if ($moduleId) $impactIndex[$moduleId] = $item;
        }

        return array_map(function($module) use ($enrollmentIndex, $impactIndex) {
            $moduleId = is_object($module) ? ($module->id ?? '') : ($module['id'] ?? '');
            $title = is_object($module) ? ($module->title ?? '') : ($module['title'] ?? '');
            $category = is_object($module) ? ($module->category ?? 'General') : ($module['category'] ?? 'General');
            
            // Module performance data
            $completed = is_object($module) ? ($module->modules_completed ?? 0) : ($module['modules_completed'] ?? 0);
            $enrolled = is_object($module) ? ($module->total_enrolled ?? 1) : ($module['total_enrolled'] ?? 1);
            $completionRate = $enrolled > 0 ? round(($completed / $enrolled) * 100, 2) : 0;
            $avgScore = is_object($module) ? ($module->avg_score ?? 0) : ($module['avg_score'] ?? 0);
            $passCount = is_object($module) ? ($module->pass_count ?? 0) : ($module['pass_count'] ?? 0);
            $passRate = $enrolled > 0 ? round(($passCount / $enrolled) * 100, 2) : 0;
            $avgDuration = is_object($module) ? ($module->avg_duration ?? 0) : ($module['avg_duration'] ?? 0);
            $rating = is_object($module) ? ($module->avg_rating ?? 0) : ($module['avg_rating'] ?? 0);
            
            // Enrollment data (override if available)
            if (isset($enrollmentIndex[$moduleId])) {
                $enrollItem = $enrollmentIndex[$moduleId];
                $enrolled = is_object($enrollItem) ? ($enrollItem->total_enrolled ?? $enrolled) : ($enrollItem['total_enrolled'] ?? $enrolled);
                $completed = is_object($enrollItem) ? ($enrollItem->completed_count ?? $completed) : ($enrollItem['completed_count'] ?? $completed);
                $completionRate = $enrolled > 0 ? round(($completed / $enrolled) * 100, 2) : 0;
            }
            
            // Learning impact
            $preTestAvg = 0;
            $postTestAvg = 0;
            $improvement = 0;
            
            if (isset($impactIndex[$moduleId])) {
                $impactItem = $impactIndex[$moduleId];
                $preTestAvg = is_object($impactItem) ? ($impactItem->pre_test_avg ?? 0) : ($impactItem['pre_test_avg'] ?? 0);
                $postTestAvg = is_object($impactItem) ? ($impactItem->post_test_avg ?? 0) : ($impactItem['post_test_avg'] ?? 0);
                $improvement = $preTestAvg > 0 ? round((($postTestAvg - $preTestAvg) / $preTestAvg) * 100, 2) : 0;
            }
            
            return [
                $title,
                $category,
                $enrolled,
                $completed,
                $completionRate,
                round($avgScore, 2),
                $passRate,
                round($preTestAvg, 2),
                round($postTestAvg, 2),
                $improvement,
                round($avgDuration, 0),
                round($rating, 1)
            ];
        }, (array)$moduleStats);
    }

    public function columnFormats(): array
    {
        return [
            'E' => NumberFormat::FORMAT_PERCENTAGE_00,
            'F' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'G' => NumberFormat::FORMAT_PERCENTAGE_00,
            'H' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'I' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'J' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'K' => '#,##0',
            'L' => '#,##0.0',
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
                'A' => 25, 'B' => 15, 'C' => 14, 'D' => 12, 'E' => 15, 'F' => 12, 'G' => 13,
                'H' => 14, 'I' => 14, 'J' => 13, 'K' => 16, 'L' => 10
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

            // Color code Improvement column (J) - highlight high impact
            for ($i = 5; $i <= $lastRow; $i++) {
                $cell = $sheet->getCell('J' . $i);
                $value = (float)$cell->getValue();
                
                if ($value > 20) {
                    $cell->getStyle()->applyFromArray([
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'D4EDDA']],
                        'font' => ['color' => ['rgb' => '155724']],
                    ]);
                } elseif ($value > 10) {
                    $cell->getStyle()->applyFromArray([
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'D1ECF1']],
                        'font' => ['color' => ['rgb' => '0C5460']],
                    ]);
                } elseif ($value < 0) {
                    $cell->getStyle()->applyFromArray([
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F8D7DA']],
                        'font' => ['color' => ['rgb' => '721C24']],
                    ]);
                }
            }


        };
        
        return $baseEvents;
    }
}
