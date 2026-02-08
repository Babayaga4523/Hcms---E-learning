<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class ProgramEnrollmentSheet extends BaseReportSheet
{
    public function __construct(array $data = [])
    {
        parent::__construct($data, 'PROGRAM ENROLLMENT');
        $this->sheetDescription = 'Training Program Participation & Completion Rates';
    }

    public function headerColumns(): array
    {
        return ['Program ID', 'Program Name', 'Type', 'Total Assigned', 'Enrolled', 'In Progress', 'Completed', 'Not Started', 'Enrollment %', 'Completion %'];
    }

    public function prepareData(): array
    {
        if (empty($this->data)) return [];

        return array_map(function($prog) {
            $total = $prog['total_assigned'] ?? 1;
            $enrolled = $prog['total_enrolled'] ?? 0;
            $completed = $prog['total_completed'] ?? 0;

            return [
                $prog['id'] ?? '',
                $prog['name'] ?? '',
                $prog['type'] ?? 'Standard',
                $total,
                $enrolled,
                $prog['in_progress'] ?? 0,
                $completed,
                $prog['not_started'] ?? 0,
                $total > 0 ? ($enrolled / $total) : 0,
                $enrolled > 0 ? ($completed / $enrolled) : 0,
            ];
        }, $this->data);
    }

    public function columnFormats(): array
    {
        return [
            'I' => NumberFormat::FORMAT_PERCENTAGE_00,
            'J' => NumberFormat::FORMAT_PERCENTAGE_00,
        ];
    }
}
