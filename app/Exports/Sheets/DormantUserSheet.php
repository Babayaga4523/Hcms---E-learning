<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class DormantUserSheet extends BaseReportSheet
{
    public function __construct(array $data = [])
    {
        parent::__construct($data, 'DORMANT USERS');
        $this->sheetDescription = 'Inactive User Identification & Risk Assessment';
    }

    public function headerColumns(): array
    {
        return ['User ID', 'Name', 'Email', 'Department', 'Last Login', 'Days Inactive', 'Account Age (days)', 'Last Module', 'Risk Level', 'Action'];
    }

    public function prepareData(): array
    {
        if (empty($this->data)) return [];

        return array_map(function($user) {
            $daysInactive = $user['days_inactive'] ?? 0;
            $riskLevel = $daysInactive > 60 ? 'CRITICAL' : ($daysInactive > 30 ? 'HIGH' : 'MEDIUM');

            return [
                $user['id'] ?? '',
                $user['name'] ?? '',
                $user['email'] ?? '',
                $user['department'] ?? '',
                $user['last_login'] ?? 'Never',
                $daysInactive,
                $user['account_age'] ?? 0,
                $user['last_module'] ?? 'None',
                $riskLevel,
                'Send Reminder',
            ];
        }, $this->data);
    }
}
