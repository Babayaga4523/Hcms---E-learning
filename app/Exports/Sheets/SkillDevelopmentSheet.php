<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class SkillDevelopmentSheet extends BaseReportSheet
{
    public function __construct(array $data = [])
    {
        parent::__construct($data, 'SKILL DEVELOPMENT');
        $this->sheetDescription = 'Pre/Post Assessment & Proficiency Tracking';
    }

    public function headerColumns(): array
    {
        return ['User ID', 'Name', 'Skill Category', 'Pre-Assessment', 'Post-Assessment', 'Improvement', 'Improvement %', 'Training Hours', 'Proficiency Level'];
    }

    public function prepareData(): array
    {
        if (empty($this->data)) return [];

        return array_map(function($skill) {
            $preScore = $skill['pre_assessment'] ?? 0;
            $postScore = $skill['post_assessment'] ?? 0;
            $improvement = $postScore - $preScore;
            $improvementPct = $preScore > 0 ? ($improvement / $preScore) : 0;

            return [
                $skill['user_id'] ?? '',
                $skill['name'] ?? '',
                $skill['skill_category'] ?? '',
                $preScore,
                $postScore,
                $improvement,
                abs($improvementPct),
                $skill['training_hours'] ?? 0,
                ucfirst($skill['proficiency_level'] ?? 'beginner'),
            ];
        }, $this->data);
    }

    public function columnFormats(): array
    {
        return [
            'G' => NumberFormat::FORMAT_PERCENTAGE_00,
        ];
    }
}
