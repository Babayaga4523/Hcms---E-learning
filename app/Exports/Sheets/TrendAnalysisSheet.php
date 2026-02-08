<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class TrendAnalysisSheet extends BaseReportSheet
{
    public function __construct(array $data = [], $title = 'TREND ANALYSIS')
    {
        parent::__construct($data, $title);
        $this->sheetDescription = 'Analisis Tren Pembelajaran Sepanjang Waktu';
    }

    public function headerColumns(): array
    {
        return ['Tanggal', 'Hari', 'Penyelesaian', 'Enrollment', 'Engagement %'];
    }

    public function prepareData(): array
    {
        $trends = $this->data['trendData'] ?? $this->data ?? [];
        
        if (empty($trends)) {
            return [['', '', '', '', '']];
        }
        
        return array_map(function($trend) {
            $dayDate = is_object($trend) ? ($trend->day_date ?? '') : ($trend['date'] ?? '');
            $dayName = is_object($trend) ? ($trend->day_name ?? '') : ($trend['day_name'] ?? '');
            $completion = is_object($trend) ? ($trend->completion ?? 0) : ($trend['completion_count'] ?? 0);
            $score = is_object($trend) ? ($trend->score ?? 0) : ($trend['engagement_rate'] ?? 0);
            
            // Calculate engagement rate from score
            $engagementRate = min($score / 100 * 100, 100);
            
            return [
                $dayDate,
                $dayName,
                $completion,
                0,
                round($engagementRate, 2),
            ];
        }, (array)$trends);
    }

    public function columnFormats(): array
    {
        return [
            'E' => NumberFormat::FORMAT_PERCENTAGE_00,
        ];
    }
}
