<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class LearnerProgressDetailSheet extends BaseReportSheet
{
    public function __construct(array $data = [], $title = 'LEARNER PROGRESS')
    {
        parent::__construct($data, $title);
        $this->sheetDescription = 'Detail Kemajuan Pembelajaran Setiap Peserta';
    }

    public function headerColumns(): array
    {
        return ['ID Learner', 'Nama', 'Departemen', 'Modul Enrolled', 'Modul Selesai', 'Completion %', 'Avg Score', 'Status'];
    }

    public function prepareData(): array
    {
        $learners = $this->data['learnerProgress'] ?? $this->data ?? [];
        
        if (empty($learners)) {
            return [['', '', '', '', '', '', '', '']];
        }
        
        return array_map(function($learner) {
            $enrolled = (is_object($learner) ? $learner->modules_enrolled : ($learner['modules_enrolled'] ?? 0)) ?? 0;
            $completed = (is_object($learner) ? $learner->modules_completed : ($learner['modules_completed'] ?? 0)) ?? 0;
            $completionPct = $enrolled > 0 ? round(($completed / $enrolled) * 100, 2) : 0;
            $status = $completionPct >= 80 ? 'On Track' : ($completionPct >= 50 ? 'In Progress' : 'At Risk');
            $avgScore = (is_object($learner) ? ($learner->avg_module_score ?? 0) : ($learner['avg_module_score'] ?? 0)) ?? 0;
            
            return [
                is_object($learner) ? ($learner->id ?? '') : ($learner['id'] ?? ''),
                is_object($learner) ? ($learner->name ?? '') : ($learner['name'] ?? ''),
                is_object($learner) ? ($learner->department ?? 'N/A') : ($learner['department'] ?? 'N/A'),
                $enrolled,
                $completed,
                $completionPct,
                round($avgScore, 2),
                $status,
            ];
        }, (array)$learners);
    }

    public function columnFormats(): array
    {
        return [
            'F' => NumberFormat::FORMAT_PERCENTAGE_00,
            'G' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
        ];
    }
}
