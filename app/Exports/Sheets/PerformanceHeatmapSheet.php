<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class PerformanceHeatmapSheet extends BaseReportSheet
{
    public function __construct(array $data = [])
    {
        parent::__construct($data, 'PERFORMANCE HEATMAP');
        $this->sheetDescription = 'Peak Learning Times & Performance Distribution';
    }

    public function headerColumns(): array
    {
        return ['Day', 'Hour', 'Avg Score', 'Completion Count', 'User Count', 'Performance Level'];
    }

    public function prepareData(): array
    {
        if (empty($this->data)) return [];

        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        return array_map(function($entry) use ($days) {
            // Use performance_score if available, fallback to avg_score
            $score = (is_object($entry) ? ($entry->performance_score ?? $entry->avg_score ?? 0) : ($entry['performance_score'] ?? $entry['avg_score'] ?? 0)) ?? 0;
            $level = $score >= 80 ? 'PEAK' : ($score >= 60 ? 'NORMAL' : 'LOW');

            return [
                $days[(is_object($entry) ? ($entry->day ?? 0) : ($entry['day'] ?? 0))] ?? 'Unknown',
                sprintf('%02d:00', (is_object($entry) ? ($entry->hour ?? 0) : ($entry['hour'] ?? 0))),
                round($score, 2),
                (is_object($entry) ? ($entry->completion_count ?? 0) : ($entry['completion_count'] ?? 0)),
                (is_object($entry) ? ($entry->user_count ?? 0) : ($entry['user_count'] ?? 0)),
                $level,
            ];
        }, (array)$this->data);
    }
}
