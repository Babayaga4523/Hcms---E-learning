<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Events\AfterSheet;

class CertificateLogSheet extends BaseReportSheet
{
    public function __construct(array $data = [], $title = 'CERTIFICATE LOG & COMPLIANCE')
    {
        parent::__construct($data, $title);
        $this->sheetDescription = 'Audit Trail Lengkap Sertifikat - Distribusi, Compliance Status, dan Validasi Legal';
    }

    public function headerColumns(): array
    {
        return [
            'ID Karyawan',
            'Nama Lengkap',
            'Departemen',
            'Judul Program',
            'Nomor Sertifikat',
            'Tanggal Terbit',
            'Tanggal Kadaluarsa',
            'Status Compliance',
            'Dokumen Valid',
            'Issued By',
            'Distribution Status',
            'Audit Notes'
        ];
    }

    public function prepareData(): array
    {
        // Combine certificate, compliance, and distribution data
        $certificates = $this->data['certificateStats'] ?? [];
        $compliance = $this->data['complianceAudit'] ?? [];
        $distribution = $this->data['certificateDistribution'] ?? [];
        
        // Build compliance index
        $complianceIndex = [];
        foreach ((array)$compliance as $item) {
            $certId = is_object($item) ? ($item->certificate_id ?? null) : ($item['certificate_id'] ?? null);
            if ($certId) $complianceIndex[$certId] = $item;
        }
        
        // Build distribution index
        $distributionIndex = [];
        foreach ((array)$distribution as $item) {
            $certId = is_object($item) ? ($item->certificate_id ?? null) : ($item['certificate_id'] ?? null);
            if ($certId) $distributionIndex[$certId] = $item;
        }

        if (empty($certificates)) {
            return [['', '', '', '', '', '', '', '', '', '', '', '']];
        }

        return array_map(function($cert) use ($complianceIndex, $distributionIndex) {
            $certId = is_object($cert) ? ($cert->id ?? '') : ($cert['id'] ?? '');
            $learnerId = is_object($cert) ? ($cert->learner_id ?? '') : ($cert['learner_id'] ?? '');
            $learnerName = is_object($cert) ? ($cert->learner_name ?? '') : ($cert['learner_name'] ?? '');
            $department = is_object($cert) ? ($cert->department ?? 'N/A') : ($cert['department'] ?? 'N/A');
            $programTitle = is_object($cert) ? ($cert->program_title ?? '') : ($cert['program_title'] ?? '');
            $certificateNo = is_object($cert) ? ($cert->certificate_number ?? '') : ($cert['certificate_number'] ?? '');
            $issuedDate = is_object($cert) ? ($cert->issued_date ?? '') : ($cert['issued_date'] ?? '');
            $expiryDate = is_object($cert) ? ($cert->expiry_date ?? '') : ($cert['expiry_date'] ?? '');
            $issuedBy = is_object($cert) ? ($cert->issued_by ?? 'System') : ($cert['issued_by'] ?? 'System');
            $status = is_object($cert) ? ($cert->status ?? 'Active') : ($cert['status'] ?? 'Active');
            
            // Compliance status
            $complianceStatus = 'Compliant';
            $documentValid = '✅ Valid';
            $auditNotes = '';
            
            if (isset($complianceIndex[$certId])) {
                $compItem = $complianceIndex[$certId];
                $complianceStatus = is_object($compItem) ? ($compItem->compliance_status ?? 'Compliant') : ($compItem['compliance_status'] ?? 'Compliant');
                $documentValid = is_object($compItem) ? ($compItem->document_valid ?? 1 ? '✅ Valid' : '❌ Invalid') : ($compItem['document_valid'] ?? 1 ? '✅ Valid' : '❌ Invalid');
                $auditNotes = is_object($compItem) ? ($compItem->audit_notes ?? '') : ($compItem['audit_notes'] ?? '');
            }
            
            // Distribution status
            $distributionStatus = 'Pending';
            if (isset($distributionIndex[$certId])) {
                $distItem = $distributionIndex[$certId];
                $distributionStatus = is_object($distItem) ? ($distItem->distribution_status ?? 'Pending') : ($distItem['distribution_status'] ?? 'Pending');
                $distributionStatus = $distributionStatus === 'issued' ? '✅ Issued' : ($distributionStatus === 'pending' ? '⏳ Pending' : '❌ Failed');
            }
            
            // Check expiry
            if (!empty($expiryDate)) {
                $expiry = strtotime($expiryDate);
                $today = strtotime(date('Y-m-d'));
                if ($expiry < $today) {
                    $complianceStatus = 'Expired';
                    if (empty($auditNotes)) $auditNotes = 'Certificate expired';
                }
            }
            
            // Format dates
            if (!empty($issuedDate)) {
                $issuedDate = date('d-m-Y', strtotime($issuedDate));
            }
            if (!empty($expiryDate)) {
                $expiryDate = date('d-m-Y', strtotime($expiryDate));
            }

            return [
                $learnerId,
                $learnerName,
                $department,
                $programTitle,
                $certificateNo,
                $issuedDate,
                $expiryDate,
                $complianceStatus,
                $documentValid,
                $issuedBy,
                $distributionStatus,
                $auditNotes
            ];
        }, (array)$certificates);
    }

    public function columnFormats(): array
    {
        return [];
    }

    public function registerEvents(): array
    {
        $baseEvents = parent::registerEvents();
        
        $baseEvents[AfterSheet::class] = function(AfterSheet $event) {
            $sheet = $event->sheet->getDelegate();
            $lastRow = $sheet->getHighestRow();
            $lastCol = $sheet->getHighestColumn();
            $headerRow = 4;

            // Merge Judul
            $sheet->mergeCells('A1:' . $lastCol . '1');
            $sheet->getRowDimension(1)->setRowHeight(35);

            // Merge Metadata
            $sheet->mergeCells('A2:' . $lastCol . '2');
            $sheet->getRowDimension(2)->setRowHeight(22);

            // Header styling
            $sheet->getRowDimension($headerRow)->setRowHeight(28);

            // Column widths
            $widths = [
                'A' => 12, 'B' => 20, 'C' => 14, 'D' => 20, 'E' => 16, 'F' => 13, 'G' => 14,
                'H' => 16, 'I' => 13, 'J' => 13, 'K' => 16, 'L' => 20
            ];
            
            foreach ($widths as $col => $width) {
                $sheet->getColumnDimension($col)->setWidth($width);
            }

            // Auto filter
            $sheet->setAutoFilter('A' . $headerRow . ':' . $lastCol . $lastRow);

            // Freeze pane
            $sheet->freezePane('A5');

            // Border all data
            $rangeData = 'A' . $headerRow . ':' . $lastCol . $lastRow;
            $sheet->getStyle($rangeData)->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => self::BORDER_COLOR],
                    ],
                ],
            ]);

            // Zebra striping
            for ($i = 5; $i <= $lastRow; $i++) {
                if ($i % 2 == 0) {
                    $sheet->getStyle('A' . $i . ':' . $lastCol . $i)->applyFromArray([
                        'fill' => [
                            'fillType' => Fill::FILL_SOLID,
                            'startColor' => ['rgb' => self::BRAND_COLOR_LIGHT],
                        ],
                    ]);
                }
            }

            // Color code Compliance Status (H)
            for ($i = 5; $i <= $lastRow; $i++) {
                $cell = $sheet->getCell('H' . $i);
                $value = $cell->getValue();
                
                if (strpos($value, 'Compliant') !== false) {
                    $cell->getStyle()->applyFromArray([
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'D4EDDA']],
                        'font' => ['color' => ['rgb' => '155724']],
                    ]);
                } elseif (strpos($value, 'Expired') !== false) {
                    $cell->getStyle()->applyFromArray([
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F8D7DA']],
                        'font' => ['color' => ['rgb' => '721C24']],
                    ]);
                } else {
                    $cell->getStyle()->applyFromArray([
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FFF3CD']],
                        'font' => ['color' => ['rgb' => '856404']],
                    ]);
                }
            }


        };
        
        return $baseEvents;
    }
}
