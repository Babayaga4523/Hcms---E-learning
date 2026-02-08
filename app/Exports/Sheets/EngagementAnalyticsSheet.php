<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class EngagementAnalyticsSheet extends BaseReportSheet
{
    public function __construct(array $data = [])
    {
        parent::__construct($data, 'ENGAGEMENT ANALYTICS');
        $this->sheetDescription = 'User Activity & Interaction Metrics';
    }

    public function headerColumns(): array
    {
        return ['User ID', 'Name', 'Department', 'Login Hours', 'Active Days', 'Module Views', 'Quiz Attempts', 'Total Time (hrs)', 'Engagement Score', 'Level'];
    }

    public function prepareData(): array
    {
        if (empty($this->data)) return [];

        return array_map(function($user) {
            $engagementScore = $user['engagement_score'] ?? 0;
            $level = $engagementScore >= 80 ? 'HIGH' : ($engagementScore >= 50 ? 'MEDIUM' : 'LOW');

            return [
                $user['id'] ?? '',
                $user['name'] ?? '',
                $user['department'] ?? '',
                $user['login_hours'] ?? 0,
                $user['active_days'] ?? 0,
                $user['module_views'] ?? 0,
                $user['quiz_attempts'] ?? 0,
                $user['total_time_minutes'] ?? 0 / 60,
                ($engagementScore / 100),
                $level,
            ];
        }, $this->data);
    }

    public function columnFormats(): array
    {
        return [
            'I' => NumberFormat::FORMAT_PERCENTAGE_00,
        ];
    }
}
