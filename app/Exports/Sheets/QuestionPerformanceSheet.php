<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class QuestionPerformanceSheet extends BaseReportSheet
{
    public function __construct(array $data = [])
    {
        parent::__construct($data, 'QUESTION PERFORMANCE');
        $this->sheetDescription = 'Quiz Question Analysis & Difficulty Index';
    }

    public function headerColumns(): array
    {
        return ['Q ID', 'Question Text', 'Total Attempts', 'Correct', 'Wrong', 'Difficulty %', 'Severity'];
    }

    public function prepareData(): array
    {
        if (empty($this->data)) return [];

        return array_map(function($q) {
            $correct = $q['correct_count'] ?? 0;
            $total = $q['total_attempts'] ?? 1;
            $correctRate = $total > 0 ? ($correct / $total) : 0;

            return [
                $q['id'] ?? '',
                substr($q['question'] ?? '', 0, 100),
                $total,
                $correct,
                $q['wrong_attempts'] ?? ($total - $correct),
                isset($q['difficulty_index']) ? ($q['difficulty_index'] / 100) : 0,
                strtoupper($q['severity'] ?? 'normal'),
            ];
        }, $this->data);
    }

    public function columnFormats(): array
    {
        return [
            'F' => NumberFormat::FORMAT_PERCENTAGE_00,
        ];
    }
}
