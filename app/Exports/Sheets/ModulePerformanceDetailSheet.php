<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class ModulePerformanceDetailSheet extends BaseReportSheet
{
    public function __construct(array $data = [], $title = 'MODULE PERFORMANCE')
    {
        parent::__construct($data, $title);
        $this->sheetDescription = 'Analisis Performa Setiap Modul Pembelajaran';
    }

    public function headerColumns(): array
    {
        return ['ID Modul', 'Judul', 'Total Enrolled', 'Selesai', 'In Progress', 'Pending', 'Completion %', 'Avg Score'];
    }

    public function prepareData(): array
    {
        $modules = $this->data['moduleStats'] ?? $this->data ?? [];
        
        if (empty($modules)) {
            return [['', '', '', '', '', '', '', '']];
        }
        
        return array_map(function($module) {
            $total = (is_object($module) ? $module->total_enrolled : ($module['total_enrolled'] ?? 1)) ?? 1;
            $completed = (is_object($module) ? $module->completed : ($module['total_completed'] ?? 0)) ?? 0;
            $inProgress = (is_object($module) ? $module->in_progress : ($module['total_in_progress'] ?? 0)) ?? 0;
            $pending = (is_object($module) ? $module->pending : ($module['total_pending'] ?? ($total - $completed - $inProgress))) ?? 0;
            $completionRate = $total > 0 ? round(($completed / $total) * 100, 2) : 0;
            
            return [
                is_object($module) ? ($module->id ?? '') : ($module['id'] ?? ''),
                is_object($module) ? ($module->title ?? '') : ($module['title'] ?? ''),
                $total,
                $completed,
                $inProgress,
                $pending,
                $completionRate,
                0,
            ];
        }, (array)$modules);
    }

    public function columnFormats(): array
    {
        return [
            'G' => NumberFormat::FORMAT_PERCENTAGE_00,
            'H' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
        ];
    }
}
