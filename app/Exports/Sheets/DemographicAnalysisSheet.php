<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class DemographicAnalysisSheet extends BaseReportSheet
{
    public function __construct(array $data = [])
    {
        parent::__construct($data, 'DEMOGRAPHIC ANALYSIS');
        $this->sheetDescription = 'User Demographics & Performance Segmentation';
    }

    public function headerColumns(): array
    {
        return ['Department', 'Total Users', 'Active Users', 'Inactive Users', 'Active Rate'];
    }

    public function prepareData(): array
    {
        if (empty($this->data)) return [];

        return array_map(function($demo) {
            return [
                is_object($demo) ? ($demo->department ?? '') : ($demo['department'] ?? ''),
                is_object($demo) ? ($demo->total_users ?? 0) : ($demo['total_users'] ?? 0),
                is_object($demo) ? ($demo->active_users ?? 0) : ($demo['active_users'] ?? 0),
                is_object($demo) ? ($demo->inactive_users ?? 0) : ($demo['inactive_users'] ?? 0),
                is_object($demo) ? ($demo->active_rate ?? '0%') : ($demo['active_rate'] ?? '0%'),
            ];
        }, (array)$this->data);
    }

    public function columnFormats(): array
    {
        return [];
    }
}
