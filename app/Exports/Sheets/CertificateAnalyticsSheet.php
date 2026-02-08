<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class CertificateAnalyticsSheet extends BaseReportSheet
{
    public function __construct(array $data = [], $title = 'CERTIFICATES')
    {
        parent::__construct($data, $title);
        $this->sheetDescription = 'Analisis Distribusi Sertifikat per Program';
    }

    public function headerColumns(): array
    {
        return ['Nama Program', 'Total Diterbitkan', 'Persentase', 'Aktif', 'Kadaluarsa', 'Dicabut'];
    }

    public function prepareData(): array
    {
        $certStats = $this->data['certificateStats'] ?? $this->data ?? [];
        
        // If stats is array with by_program key, use it; otherwise treat as collection
        $byProgram = isset($certStats['by_program']) ? $certStats['by_program'] : $certStats;
        $total = isset($certStats['total_issued']) ? $certStats['total_issued'] : 1;
        
        if (empty($byProgram)) {
            return [['No certificate data available', '', '', '', '', '']];
        }

        return array_map(function($prog) use ($total) {
            $progName = is_object($prog) ? ($prog->name ?? '') : ($prog['name'] ?? '');
            $count = is_object($prog) ? ($prog->count ?? $prog->total_issued ?? 0) : ($prog['count'] ?? 0);
            $percentage = $total > 0 ? round(($count / $total) * 100, 2) : 0;
            $active = is_object($prog) ? ($prog->active ?? 0) : ($prog['active'] ?? 0);
            $expired = is_object($prog) ? ($prog->expired ?? 0) : ($prog['expired'] ?? 0);
            $revoked = is_object($prog) ? ($prog->revoked ?? 0) : ($prog['revoked'] ?? 0);
            
            return [
                $progName,
                $count,
                $percentage,
                $active,
                $expired,
                $revoked,
            ];
        }, (array)$byProgram);
    }

    public function columnFormats(): array
    {
        return [
            'C' => NumberFormat::FORMAT_PERCENTAGE_00,
        ];
    }
}
