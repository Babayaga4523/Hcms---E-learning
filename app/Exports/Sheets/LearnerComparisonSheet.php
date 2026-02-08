<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class LearnerComparisonSheet extends BaseReportSheet
{
    public function __construct(array $data = [])
    {
        parent::__construct($data, 'LEARNER COMPARISON');
        $this->sheetDescription = 'Current vs Previous Period Analysis';
    }

    public function headerColumns(): array
    {
        return ['Metric', 'Current Period', 'Previous Period', 'Variance', 'Trend', 'Growth %'];
    }

    public function prepareData(): array
    {
        if (empty($this->data)) return [];

        $metrics = [
            'Total Completions',
            'Avg Score',
            'Module Completion',
            'Quiz Pass Rate',
            'Certificate Issued',
            'Active Learners',
            'Engagement Score',
        ];

        return array_map(function($metric, $idx) {
            $current = $this->data['current_period'][$idx] ?? 0;
            $previous = $this->data['previous_period'][$idx] ?? 0;
            $variance = $current - $previous;
            $growth = $previous > 0 ? ($variance / $previous) : 0;
            $trend = $variance > 0 ? '↑ Up' : ($variance < 0 ? '↓ Down' : '→ Flat');

            return [
                $metric,
                $current,
                $previous,
                $variance,
                $trend,
                abs($growth),
            ];
        }, $metrics, array_keys($metrics));
    }

    public function columnFormats(): array
    {
        return [
            'F' => NumberFormat::FORMAT_PERCENTAGE_00,
        ];
    }
}
