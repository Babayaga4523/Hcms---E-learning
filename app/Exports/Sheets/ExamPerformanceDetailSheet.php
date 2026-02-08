<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class ExamPerformanceDetailSheet extends BaseReportSheet
{
    public function __construct(array $data = [], $title = 'EXAM PERFORMANCE')
    {
        parent::__construct($data, $title);
        $this->sheetDescription = 'Detail Performa Ujian Setiap Peserta';
    }

    public function headerColumns(): array
    {
        return ['ID Learner', 'Nama', 'Total Attempts', 'Avg Score', 'Highest', 'Lowest', 'Pass Count'];
    }

    public function prepareData(): array
    {
        $learners = $this->data['learnerProgress'] ?? $this->data['examPerformance'] ?? $this->data ?? [];
        
        if (empty($learners)) {
            return [['', '', '', '', '', '', '']];
        }
        
        return array_map(function($learner, $idx) {
            $id = is_object($learner) ? ($learner->id ?? $idx) : ($learner['id'] ?? $idx);
            $name = is_object($learner) ? ($learner->name ?? 'Unknown') : ($learner['name'] ?? 'Unknown');
            $avgScore = is_object($learner) ? ($learner->avg_module_score ?? 0) : ($learner['avg_module_score'] ?? 0);
            
            return [
                $id,
                $name,
                0,
                round($avgScore, 2),
                0,
                0,
                0,
            ];
        }, (array)$learners, array_keys((array)$learners));
    }

    public function columnFormats(): array
    {
        return [
            'D' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'E' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'F' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
        ];
    }
}
