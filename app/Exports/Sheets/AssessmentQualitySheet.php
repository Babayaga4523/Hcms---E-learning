<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Events\AfterSheet;

class AssessmentQualitySheet extends BaseReportSheet
{
    public function __construct(array $data = [], $title = 'ASSESSMENT QUALITY')
    {
        parent::__construct($data, $title);
        $this->sheetDescription = 'Analisis Kualitas Ujian & Quiz - Performa Peserta, Kesulitan, dan Reliabilitas Soal';
    }

    public function headerColumns(): array
    {
        return [
            'Judul Assessment',
            'Tipe',
            'Total Taken',
            'Avg Score',
            'Pass Rate %',
            'Avg Duration (min)',
            'Difficulty Level',
            'Discrimination Index',
            'Question Count',
            'Reliability Score',
            'Pass Mark',
            'Recommendation'
        ];
    }

    public function prepareData(): array
    {
        // Combine exam and quiz data with difficulty analysis
        $examData = $this->data['examPerformance'] ?? [];
        $quizData = $this->data['quizDifficulty'] ?? [];
        
        $combined = [];
        
        // Add exam performance data
        foreach ((array)$examData as $exam) {
            $id = is_object($exam) ? ($exam->id ?? '') : ($exam['id'] ?? '');
            $combined[$id] = [
                'id' => $id,
                'title' => is_object($exam) ? ($exam->title ?? '') : ($exam['title'] ?? ''),
                'type' => 'Exam',
                'totalTaken' => is_object($exam) ? ($exam->total_taken ?? 0) : ($exam['total_taken'] ?? 0),
                'avgScore' => is_object($exam) ? ($exam->avg_score ?? 0) : ($exam['avg_score'] ?? 0),
                'passCount' => is_object($exam) ? ($exam->pass_count ?? 0) : ($exam['pass_count'] ?? 0),
                'avgDuration' => is_object($exam) ? ($exam->avg_duration ?? 0) : ($exam['avg_duration'] ?? 0),
                'passmark' => is_object($exam) ? ($exam->passmark ?? 70) : ($exam['passmark'] ?? 70),
                'questionCount' => is_object($exam) ? ($exam->question_count ?? 0) : ($exam['question_count'] ?? 0),
                'reliability' => is_object($exam) ? ($exam->reliability_index ?? 0) : ($exam['reliability_index'] ?? 0),
            ];
        }
        
        // Add quiz data
        foreach ((array)$quizData as $quiz) {
            $id = is_object($quiz) ? ($quiz->id ?? '') : ($quiz['id'] ?? '');
            $combined[$id] = [
                'id' => $id,
                'title' => is_object($quiz) ? ($quiz->title ?? '') : ($quiz['title'] ?? ''),
                'type' => 'Quiz',
                'totalTaken' => is_object($quiz) ? ($quiz->total_attempts ?? 0) : ($quiz['total_attempts'] ?? 0),
                'avgScore' => is_object($quiz) ? ($quiz->avg_score ?? 0) : ($quiz['avg_score'] ?? 0),
                'passCount' => is_object($quiz) ? ($quiz->pass_count ?? 0) : ($quiz['pass_count'] ?? 0),
                'avgDuration' => is_object($quiz) ? ($quiz->avg_duration ?? 0) : ($quiz['avg_duration'] ?? 0),
                'passmark' => is_object($quiz) ? ($quiz->passmark ?? 70) : ($quiz['passmark'] ?? 70),
                'questionCount' => is_object($quiz) ? ($quiz->question_count ?? 0) : ($quiz['question_count'] ?? 0),
                'reliability' => is_object($quiz) ? ($quiz->reliability_index ?? 0) : ($quiz['reliability_index'] ?? 0),
                'difficulty' => is_object($quiz) ? ($quiz->difficulty_level ?? 'Medium') : ($quiz['difficulty_level'] ?? 'Medium'),
                'discrimination' => is_object($quiz) ? ($quiz->discrimination_index ?? 0) : ($quiz['discrimination_index'] ?? 0),
            ];
        }

        if (empty($combined)) {
            return [['', '', '', '', '', '', '', '', '', '', '', '']];
        }

        return array_map(function($assessment) {
            $title = $assessment['title'] ?? '';
            $type = $assessment['type'] ?? '';
            $totalTaken = $assessment['totalTaken'] ?? 0;
            $avgScore = $assessment['avgScore'] ?? 0;
            $passCount = $assessment['passCount'] ?? 0;
            $avgDuration = $assessment['avgDuration'] ?? 0;
            $passmark = $assessment['passmark'] ?? 70;
            $questionCount = $assessment['questionCount'] ?? 0;
            $reliability = $assessment['reliability'] ?? 0;
            $difficulty = $assessment['difficulty'] ?? $this->inferDifficulty($avgScore);
            $discrimination = $assessment['discrimination'] ?? 0;
            
            // Calculate pass rate
            $passRate = $totalTaken > 0 ? round(($passCount / $totalTaken) * 100, 2) : 0;
            
            // Generate recommendation
            $recommendation = $this->generateRecommendation($avgScore, $passRate, $discrimination, $reliability);
            
            return [
                $title,
                $type,
                $totalTaken,
                round($avgScore, 2),
                $passRate,
                round($avgDuration, 0),
                $difficulty,
                round($discrimination, 2),
                $questionCount,
                round($reliability, 2),
                $passmark,
                $recommendation
            ];
        }, $combined);
    }

    private function inferDifficulty($avgScore)
    {
        if ($avgScore >= 85) return 'Easy';
        if ($avgScore >= 70) return 'Medium';
        if ($avgScore >= 50) return 'Hard';
        return 'Very Hard';
    }

    private function generateRecommendation($avgScore, $passRate, $discrimination, $reliability)
    {
        $recommendations = [];
        
        if ($avgScore < 50) {
            $recommendations[] = '⚠️ Review content';
        }
        if ($passRate < 40) {
            $recommendations[] = '⚠️ Too difficult';
        }
        if ($discrimination < 0.2) {
            $recommendations[] = '⚠️ Poor discrimination';
        }
        if ($reliability < 0.6) {
            $recommendations[] = '⚠️ Low reliability';
        }
        
        if (empty($recommendations)) {
            return '✅ Acceptable';
        }
        
        return implode(' | ', $recommendations);
    }

    public function columnFormats(): array
    {
        return [
            'D' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'E' => NumberFormat::FORMAT_PERCENTAGE_00,
            'F' => '#,##0',
            'H' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'J' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
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
                'A' => 25, 'B' => 10, 'C' => 12, 'D' => 12, 'E' => 12, 'F' => 15,
                'G' => 14, 'H' => 16, 'I' => 13, 'J' => 14, 'K' => 10, 'L' => 25
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

            // Color code Pass Rate (E) and Difficulty (G)
            for ($i = 5; $i <= $lastRow; $i++) {
                // Pass Rate coloring
                $passRateCell = $sheet->getCell('E' . $i);
                $passRateValue = (float)$passRateCell->getValue();
                
                if ($passRateValue >= 80) {
                    $passRateCell->getStyle()->applyFromArray([
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'D4EDDA']],
                        'font' => ['color' => ['rgb' => '155724']],
                    ]);
                } elseif ($passRateValue >= 60) {
                    $passRateCell->getStyle()->applyFromArray([
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'D1ECF1']],
                        'font' => ['color' => ['rgb' => '0C5460']],
                    ]);
                } elseif ($passRateValue < 40) {
                    $passRateCell->getStyle()->applyFromArray([
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F8D7DA']],
                        'font' => ['color' => ['rgb' => '721C24']],
                    ]);
                }
            }
        };
        
        return $baseEvents;
    }
}
