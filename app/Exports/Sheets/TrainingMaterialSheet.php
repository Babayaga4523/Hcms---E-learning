<?php

namespace App\Exports\Sheets;

class TrainingMaterialSheet extends BaseReportSheet
{
    public function __construct(array $data = [])
    {
        parent::__construct($data, 'TRAINING MATERIALS');
        $this->sheetDescription = 'Learning Resource Tracking & Usage';
    }

    public function headerColumns(): array
    {
        return ['Material ID', 'Title', 'Module', 'Type', 'File Size (MB)', 'Upload Date', 'Last Updated', 'View Count', 'Completion %', 'Status'];
    }

    public function prepareData(): array
    {
        if (empty($this->data)) return [];

        return array_map(function($material) {
            return [
                $material['id'] ?? '',
                $material['title'] ?? '',
                $material['module_name'] ?? '',
                strtoupper($material['file_type'] ?? 'pdf'),
                round($material['file_size'] ?? 0 / 1024 / 1024, 2),
                $material['created_at'] ?? '',
                $material['updated_at'] ?? '',
                $material['view_count'] ?? 0,
                isset($material['completion_percentage']) ? ($material['completion_percentage'] / 100) : 0,
                ucfirst($material['status'] ?? 'active'),
            ];
        }, $this->data);
    }
}
