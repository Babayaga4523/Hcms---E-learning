<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class AtRiskUsersSheet extends BaseReportSheet
{
    public function __construct(array $data = [], $title = 'AT-RISK USERS')
    {
        parent::__construct($data, $title);
        $this->sheetDescription = 'Identifikasi Peserta yang Berisiko Putus Sekolah';
    }

    public function headerColumns(): array
    {
        return ['ID Learner', 'Nama', 'Email', 'Departemen', 'Hari Tidak Aktif', 'Umur Akun (hari)', 'Risk Level', 'Aksi'];
    }

    public function prepareData(): array
    {
        $users = $this->data['atRiskUsers'] ?? $this->data ?? [];
        
        if (empty($users)) {
            return [['', '', '', '', '', '', '', '']];
        }
        
        return array_map(function($user) {
            $id = is_object($user) ? ($user->id ?? '') : ($user['id'] ?? '');
            $name = is_object($user) ? ($user->name ?? '') : ($user['name'] ?? '');
            $email = is_object($user) ? ($user->email ?? '') : ($user['email'] ?? '');
            $dept = is_object($user) ? ($user->department ?? '') : ($user['department'] ?? '');
            $daysInactive = is_object($user) ? ($user->days_inactive ?? 0) : ($user['days_inactive'] ?? 0);
            $accountAge = is_object($user) ? ($user->account_age ?? 0) : ($user['account_age'] ?? 0);
            
            $riskLevel = $daysInactive > 60 ? 'CRITICAL' : ($daysInactive > 30 ? 'HIGH' : 'MEDIUM');

            return [
                $id,
                $name,
                $email,
                $dept,
                $daysInactive,
                $accountAge,
                $riskLevel,
                'Kirim Pengingat',
            ];
        }, (array)$users);
        return [];
    }
}
