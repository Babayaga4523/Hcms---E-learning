<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class CertificateDistributionSheet extends BaseReportSheet
{
    public function __construct(array $data = [])
    {
        parent::__construct($data, 'CERTIFICATE DISTRIBUTION');
        $this->sheetDescription = 'Certificates Issued, Active & Expired by Department';
    }

    public function headerColumns(): array
    {
        return ['Department', 'Total Employees', 'Issued', 'Issuance %', 'Active', 'Expired', 'Revoked', 'Avg Days to Cert', 'Renewal Needed'];
    }

    public function prepareData(): array
    {
        if (empty($this->data)) return [];

        return array_map(function($dept) {
            $total = $dept['total_employees'] ?? 1;
            $issued = $dept['certificates_issued'] ?? 0;

            return [
                $dept['department'] ?? '',
                $total,
                $issued,
                $total > 0 ? ($issued / $total) : 0,
                $dept['active_certs'] ?? 0,
                $dept['expired_certs'] ?? 0,
                $dept['revoked_certs'] ?? 0,
                $dept['avg_days_to_cert'] ?? 0,
                $dept['renewal_needed'] ?? 0,
            ];
        }, $this->data);
    }

    public function columnFormats(): array
    {
        return [
            'D' => NumberFormat::FORMAT_PERCENTAGE_00,
        ];
    }
}
