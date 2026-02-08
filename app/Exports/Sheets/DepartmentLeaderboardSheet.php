<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class DepartmentLeaderboardSheet extends BaseReportSheet
{
    public function __construct(array $data = [], $title = 'DEPARTMENT LEADERBOARD')
    {
        parent::__construct($data, $title);
        $this->sheetDescription = 'Peringkat Departemen Berdasarkan Performa';
    }

    public function headerColumns(): array
    {
        return ['Rank', 'Departemen', 'Total Users', 'Selesai', 'Completion %', 'Engagement Score', 'Badge'];
    }

    public function prepareData(): array
    {
        $depts = $this->data['departmentLeaderboard'] ?? $this->data ?? [];
        
        if (empty($depts)) {
            return [['', 'No department data available', '', '', '', '', '']];
        }
        
        $rows = [];
        $rank = 1;
        foreach ((array)$depts as $dept) {
            $deptName = is_object($dept) ? ($dept->department ?? '') : ($dept['name'] ?? $dept['department'] ?? '');
            $totalUsers = is_object($dept) ? ($dept->total_users ?? 0) : ($dept['total_users'] ?? 0);
            $completedModules = is_object($dept) ? ($dept->completed_modules ?? 0) : ($dept['total_completed'] ?? 0);
            $completionRate = is_object($dept) ? ($dept->completion_rate ?? 0) : ($dept['completion_rate'] ?? 0);
            
            // Badge assignment based on rank
            $badge = match($rank) {
                1 => '🥇',
                2 => '🥈',
                3 => '🥉',
                default => '⭐'
            };
            
            $rows[] = [
                $rank++,
                $deptName,
                $totalUsers,
                $completedModules,
                round($completionRate, 2),
                0,
                $badge,
            ];
        }
        return $rows;
    }

    public function columnFormats(): array
    {
        return [
            'E' => NumberFormat::FORMAT_PERCENTAGE_00,
            'F' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
        ];
    }
}
