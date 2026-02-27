<?php

namespace App\Exports\Sheets;

use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Events\AfterSheet;

class MasterLearnerDataSheet extends BaseReportSheet
{
    public function __construct(array $data = [], $title = 'MASTER LEARNER DATA')
    {
        parent::__construct($data, $title);
        $this->sheetDescription = 'Profil Lengkap Setiap Learner dengan Engagement & Risk Status - Sumber Tunggal untuk HR & Manager';
    }

    public function headerColumns(): array
    {
        return [
            'No.',
            'ID Karyawan',
            'Nama Peserta',
            'Departemen',
            'Nama Program',
            'Kategori',
            'Status Materi',
            'Nilai Pre-test',
            'Nilai Post-test',
            'Nilai Akhir',
            'Progress %',
            'Durasi (menit)',
            'Jumlah Percobaan',
            'Tanggal Mulai',
            'Tanggal Selesai',
            'Hari Sejak Mulai',
            'Last Active',
            'Engagement Score',
            'Login Count',
            'Risk Status',
            'Sertifikat',
            'No. Sertifikat',
        ];
    }

    public function prepareData(): array
    {
        // Query detailed user training data directly from database
        $trainings = \DB::table('user_trainings as ut')
            ->join('users as u', 'u.id', '=', 'ut.user_id')
            ->join('modules as m', 'm.id', '=', 'ut.module_id')
            ->leftJoin('certificates as c', function($join) {
                $join->on('u.id', '=', 'c.user_id')
                     ->on('m.id', '=', 'c.module_id');
            })
            ->select(
                'u.id',
                'u.name',
                'u.nip',
                'u.department',
                'm.title as module_title',
                'm.category',
                'ut.status',
                'ut.progress',
                'ut.final_score',
                'ut.duration_minutes',
                'ut.enrolled_at',
                'ut.completed_at',
                'ut.last_activity_at',
                'c.certificate_number',
                'c.issued_at'
            )
            ->where('u.role', '!=', 'admin')
            ->orderBy('u.department')
            ->orderBy('u.name')
            ->orderBy('m.title')
            ->get();

        if ($trainings->isEmpty()) {
            return [['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']];
        }

        // Build row data with attempt counts and pre/post test scores
        $rows = [];
        $rowNum = 1;

        foreach ($trainings as $training) {
            // Get pre-test and post-test scores
            $preTest = \DB::table('exam_attempts')
                ->where('user_id', $training->id)
                ->where('module_id', $training->id)
                ->where('exam_type', 'pre_test')
                ->orderBy('created_at', 'desc')
                ->value('score') ?? null;

            $postTest = \DB::table('exam_attempts')
                ->where('user_id', $training->id)
                ->where('module_id', $training->id)
                ->where('exam_type', 'post_test')
                ->orderBy('created_at', 'desc')
                ->value('score') ?? null;

            // Get attempt count
            $attemptCount = \DB::table('exam_attempts')
                ->where('user_id', $training->id)
                ->where('module_id', $training->id)
                ->count();

            // Get engagement data
            $engagement = \DB::table('users')
                ->where('id', $training->id)
                ->select(
                    \DB::raw('(SELECT COUNT(*) FROM audit_logs WHERE user_id = users.id AND action = "login" AND logged_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as login_count')
                )
                ->first();

            $loginCount = $engagement?->login_count ?? 0;

            // Calculate engagement score (0-100)
            $engagementScore = min(100, round(($attemptCount * 15) + ($loginCount * 5) + ($training->progress ?? 0) * 0.3));

            // Determine risk status
            $riskStatus = 'Active';
            if ($training->last_activity_at && \Carbon\Carbon::parse($training->last_activity_at)->diffInDays() > 30) {
                $riskStatus = 'Dormant';
            } elseif ($training->progress < 50 && $training->status !== 'completed') {
                $riskStatus = 'At-Risk';
            }

            // Format dates
            $startDate = $training->enrolled_at ? \Carbon\Carbon::parse($training->enrolled_at)->format('d-m-Y') : '-';
            $endDate = $training->completed_at ? \Carbon\Carbon::parse($training->completed_at)->format('d-m-Y') : '-';
            $lastActive = $training->last_activity_at ? \Carbon\Carbon::parse($training->last_activity_at)->format('d-m-Y H:i') : '-';

            // Calculate days since started
            $daysSinceStart = $training->enrolled_at ? 
                \Carbon\Carbon::parse($training->enrolled_at)->diffInDays(\Carbon\Carbon::now()) : '-';

            // Status display with emoji
            $statusDisplay = '';
            switch ($training->status) {
                case 'completed':
                    $statusDisplay = '✅ LULUS';
                    break;
                case 'in_progress':
                    $statusDisplay = '⏳ SEDANG BERJALAN';
                    break;
                case 'enrolled':
                    $statusDisplay = '⭕ BELUM MULAI';
                    break;
                case 'failed':
                    $statusDisplay = '❌ GAGAL';
                    break;
                default:
                    $statusDisplay = $training->status;
            }

            // Certificate status
            $certStatus = $training->certificate_number ? '✅ Ada' : '-';

            $rows[] = [
                $rowNum++,
                $training->nip ?? '-',
                $training->name ?? '-',
                $training->department ?? '-',
                $training->module_title ?? '-',
                $training->category ?? '-',
                $statusDisplay,
                $preTest !== null ? $preTest : '-',
                $postTest !== null ? $postTest : '-',
                $training->final_score !== null ? $training->final_score : '-',
                $training->progress ?? 0,
                $training->duration_minutes ?? '-',
                $attemptCount ?? 0,
                $startDate,
                $endDate,
                $daysSinceStart,
                $lastActive,
                $engagementScore,
                $loginCount,
                $riskStatus,
                $certStatus,
                $training->certificate_number ?? '-',
            ];
        }

        return $rows;
    }

    public function columnFormats(): array
    {
        return [
            'E' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
            'F' => NumberFormat::FORMAT_PERCENTAGE_00,
            'G' => '#,##0.0',
        ];
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
                'A' => 12, 'B' => 20, 'C' => 16, 'D' => 14, 'E' => 14, 'F' => 13, 'G' => 14,
                'H' => 12, 'I' => 14, 'J' => 13, 'K' => 13, 'L' => 13, 'M' => 14, 'N' => 22
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

            // Color code Risk Status column (J)
            for ($i = 5; $i <= $lastRow; $i++) {
                $cell = $sheet->getCell('J' . $i);
                $value = $cell->getValue();
                
                if (strpos($value, 'Active') !== false) {
                    $cell->getStyle()->applyFromArray([
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'D4EDDA']],
                        'font' => ['color' => ['rgb' => '155724']],
                    ]);
                } elseif (strpos($value, 'At-Risk') !== false) {
                    $cell->getStyle()->applyFromArray([
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FFF3CD']],
                        'font' => ['color' => ['rgb' => '856404']],
                    ]);
                } elseif (strpos($value, 'Dormant') !== false) {
                    $cell->getStyle()->applyFromArray([
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F8D7DA']],
                        'font' => ['color' => ['rgb' => '721C24']],
                    ]);
                }
            }


        };
        
        return $baseEvents;
    }
}
