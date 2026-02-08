<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class ComplianceAuditSheet extends BaseReportSheet
{
    public function __construct(array $data = [])
    {
        parent::__construct($data, 'COMPLIANCE AUDIT');
        $this->sheetDescription = 'Evidence & Verification Tracking';
    }

    public function headerColumns(): array
    {
        return ['User ID', 'Full Name', 'Department', 'Evidence Type', 'Status', 'Submission Date', 'Approval Date', 'Verified By', 'Compliance Score'];
    }

    public function prepareData(): array
    {
        if (empty($this->data)) return [];

        return array_map(function($row) {
            return [
                $row['id'] ?? '',
                $row['name'] ?? '',
                $row['department'] ?? '',
                $row['evidence_type'] ?? '',
                strtoupper($row['status'] ?? 'pending'),
                $row['submission_date'] ?? '',
                $row['approval_date'] ?? 'Pending',
                $row['verified_by'] ?? 'Pending',
                isset($row['compliance_score']) ? ($row['compliance_score'] / 100) : 0,
            ];
        }, $this->data);
    }

    public function columnFormats(): array
    {
        return [
            'I' => NumberFormat::FORMAT_PERCENTAGE_00,
        ];
    }
}
