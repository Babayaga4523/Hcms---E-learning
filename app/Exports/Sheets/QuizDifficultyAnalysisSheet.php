<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class QuizDifficultyAnalysisSheet extends BaseReportSheet
{
    public function __construct(array $data = [])
    {
        parent::__construct($data, 'QUIZ DIFFICULTY');
        $this->sheetDescription = 'Quiz Performance & Difficulty Assessment';
    }

    public function headerColumns(): array
    {
        return ['Quiz ID', 'Quiz Name', 'Module', 'Difficulty', 'Avg Score', 'Pass Rate', 'Attempts per User', 'Avg Time (min)', 'Most Missed Questions', 'Student Feedback'];
    }

    public function prepareData(): array
    {
        if (empty($this->data)) return [];

        return array_map(function($quiz) {
            $avgScore = $quiz['avg_score'] ?? 0;
            $passRate = isset($quiz['pass_rate']) ? ($quiz['pass_rate'] / 100) : 0;

            return [
                $quiz['id'] ?? '',
                $quiz['name'] ?? '',
                $quiz['module_name'] ?? '',
                ucfirst($quiz['difficulty'] ?? 'medium'),
                round($avgScore, 2),
                $passRate,
                round($quiz['attempts_per_user'] ?? 0, 2),
                $quiz['avg_time_minutes'] ?? 0,
                $quiz['most_missed_question'] ?? 'N/A',
                round($quiz['student_feedback'] ?? 0, 2),
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
