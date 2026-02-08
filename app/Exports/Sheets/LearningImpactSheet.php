<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class LearningImpactSheet extends BaseReportSheet
{
    public function __construct(array $data = [], $title = 'LEARNING IMPACT')
    {
        parent::__construct($data, $title);
        $this->sheetDescription = 'Analisis Dampak Pembelajaran: Pre-Test vs Post-Test';
    }

    public function headerColumns(): array
    {
        return ['ID Modul', 'Nama Modul', 'Pre-Test Rata-rata', 'Post-Test Rata-rata', 'Peningkatan', 'Peningkatan %', 'Status'];
    }

    public function prepareData(): array
    {
        $impacts = $this->data['prePostAnalysis'] ?? $this->data ?? [];
        
        if (empty($impacts)) {
            return [['', '', '', '', '', '', '']];
        }
        
        return array_map(function($item) {
            $id = is_object($item) ? ($item->id ?? '') : ($item['id'] ?? '');
            $name = is_object($item) ? ($item->name ?? '') : ($item['name'] ?? '');
            $preTest = is_object($item) ? ($item->avg_pretest ?? 0) : ($item['avg_pretest'] ?? 0);
            $postTest = is_object($item) ? ($item->avg_posttest ?? 0) : ($item['avg_posttest'] ?? 0);
            
            $improvement = $postTest - $preTest;
            $improvementPct = $preTest > 0 ? ($improvement / $preTest) * 100 : 0;
            $status = $improvementPct > 20 ? 'Excellent' : ($improvementPct > 5 ? 'Good' : 'Minimal');
            
            return [
                $id,
                $name,
                round($preTest, 2),
                round($postTest, 2),
                round($improvement, 2),
                round($improvementPct, 2),
                $status,
            ];
        }, (array)$impacts);
    }

    public function columnFormats(): array
    {
        return [
            'C' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'D' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'E' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'F' => NumberFormat::FORMAT_PERCENTAGE_00,
        ];
    }
}
