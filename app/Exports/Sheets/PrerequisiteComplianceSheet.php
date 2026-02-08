<?php

namespace App\Exports\Sheets;

class PrerequisiteComplianceSheet extends BaseReportSheet
{
    public function __construct(array $data = [])
    {
        parent::__construct($data, 'PREREQUISITE COMPLIANCE');
        $this->sheetDescription = 'Module Prerequisites Validation & Compliance Status';
    }

    public function headerColumns(): array
    {
        return ['User ID', 'Name', 'Program', 'Module', 'Prerequisites Met', 'Prerequisite Modules', 'Compliance Status', 'Days Until Required', 'Alert Level'];
    }

    public function prepareData(): array
    {
        if (empty($this->data)) return [];

        return array_map(function($item) {
            $daysUntil = $item['days_until_required'] ?? 0;
            $alertLevel = $daysUntil < 3 ? 'URGENT' : ($daysUntil < 7 ? 'WARNING' : 'INFO');
            $prerequisitesMet = isset($item['prerequisites_met']) ? ($item['prerequisites_met'] ? 'Yes' : 'No') : 'No';

            return [
                $item['user_id'] ?? '',
                $item['user_name'] ?? '',
                $item['program_name'] ?? '',
                $item['module_name'] ?? '',
                $prerequisitesMet,
                $item['prerequisite_modules'] ?? 'None',
                ucfirst($item['compliance_status'] ?? 'pending'),
                $daysUntil,
                $alertLevel,
            ];
        }, $this->data);
    }
}
