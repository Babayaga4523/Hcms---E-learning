<?php

namespace App\Exports\Sheets;

class ResourceUtilizationSheet extends BaseReportSheet
{
    public function __construct(array $data = [])
    {
        parent::__construct($data, 'RESOURCE UTILIZATION');
        $this->sheetDescription = 'Learning Resource Usage & Efficiency Metrics';
    }

    public function headerColumns(): array
    {
        return ['Resource Type', 'Resource Name', 'Total Used', 'Unique Users', 'Avg per User', 'Peak Usage Time', 'Storage (MB)', 'Status'];
    }

    public function prepareData(): array
    {
        if (empty($this->data)) return [];

        return array_map(function($resource) {
            $totalUsed = $resource['total_used'] ?? 1;
            $uniqueUsers = $resource['unique_users'] ?? 0;
            $avgPerUser = $totalUsed > 0 ? ($totalUsed / max(1, $uniqueUsers)) : 0;

            return [
                ucfirst($resource['resource_type'] ?? 'material'),
                $resource['resource_name'] ?? '',
                $totalUsed,
                $uniqueUsers,
                round($avgPerUser, 2),
                $resource['peak_usage_time'] ?? 'N/A',
                round($resource['storage_mb'] ?? 0, 2),
                ucfirst($resource['status'] ?? 'active'),
            ];
        }, $this->data);
    }
}
