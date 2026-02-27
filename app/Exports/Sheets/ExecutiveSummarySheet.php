<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ExecutiveSummarySheet extends BaseReportSheet
{
    public function __construct(array $data = [], $title = 'EXECUTIVE SUMMARY')
    {
        parent::__construct($data, $title);
        $this->sheetDescription = 'Ringkasan Statistik dan KPI Utama';
    }

    public function headerColumns(): array
    {
        return ['Metrik', 'Nilai', 'Keterangan'];
    }

    public function prepareData(): array
    {
        $stats = $this->data['stats'] ?? $this->data ?? [];
        $engagement = $this->data['engagementScore'] ?? 0;
        
        return [
            ['Total Learners', $stats['total_users'] ?? 0, 'Jumlah peserta terdaftar'],
            ['Pengguna Aktif', $stats['active_users'] ?? 0, 'Status aktif pada sistem'],
            ['Total Module', $stats['total_modules'] ?? 0, 'Program pembelajaran tersedia'],
            ['Module Aktif', $stats['active_modules'] ?? 0, 'Module yang sedang berjalan'],
            ['Total Assignments', $stats['total_assignments'] ?? 0, 'Total penugasan training'],
            ['Completed', $stats['completed_assignments'] ?? 0, 'Penugasan yang sudah selesai'],
            ['In Progress', $stats['in_progress_assignments'] ?? 0, 'Penugasan sedang berlangsung'],
            ['Avg Completion Rate', round($stats['compliance_rate'] ?? 0, 2), 'Persentase penyelesaian rata-rata'],
            ['Avg Exam Score', round($stats['avg_exam_score'] ?? 0, 2), 'Nilai rata-rata ujian (0-100)'],
            ['Engagement Score', round($engagement, 1), 'Tingkat keterlibatan aktif pengguna (%)'],
        ];
    }

    public function columnFormats(): array
    {
        return [
            'B' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED2,
        ];
    }

    public function registerEvents(): array
    {
        $baseEvents = parent::registerEvents();
        
        // Chart disabled - export data only
        
        return $baseEvents;
    }
}