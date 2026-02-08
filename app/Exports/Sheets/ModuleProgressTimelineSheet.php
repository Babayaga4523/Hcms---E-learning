<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class ModuleProgressTimelineSheet extends BaseReportSheet
{
    public function __construct(array $data = [])
    {
        parent::__construct($data, 'MODULE TIMELINE');
        $this->sheetDescription = 'Module Progression & Velocity Analysis';
    }

    public function headerColumns(): array
    {
        return ['Module ID', 'Module Name', 'Start Date', 'End Date', 'Duration (days)', 'Week 1 Enrollment', 'Week 2 Enrollment', 'Week 3 Enrollment', 'Week 4 Enrollment', 'Completion Velocity'];
    }

    public function prepareData(): array
    {
        if (empty($this->data)) return [];

        return array_map(function($module) {
            return [
                $module['id'] ?? '',
                $module['name'] ?? '',
                $module['start_date'] ?? '',
                $module['end_date'] ?? '',
                $module['duration_days'] ?? 0,
                $module['week_1_enrollment'] ?? 0,
                $module['week_2_enrollment'] ?? 0,
                $module['week_3_enrollment'] ?? 0,
                $module['week_4_enrollment'] ?? 0,
                isset($module['velocity']) ? ($module['velocity'] / 100) : 0,
            ];
        }, $this->data);
    }

    public function columnFormats(): array
    {
        return [
            'J' => NumberFormat::FORMAT_PERCENTAGE_00,
        ];
    }
}
