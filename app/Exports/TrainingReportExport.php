<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;
use Illuminate\Support\Collection;

class TrainingReportExport implements WithMultipleSheets
{
    private $trainings;
    private $statistics;
    private $complianceDistribution;
    private $departmentReports;
    private $user;

    public function __construct($trainings, $statistics, $complianceDistribution, $departmentReports, $user)
    {
        $this->trainings = $trainings;
        $this->statistics = $statistics;
        $this->complianceDistribution = $complianceDistribution;
        $this->departmentReports = $departmentReports;
        $this->user = $user;
    }

    public function sheets(): array
    {
        return [
            new OverviewSheet($this->statistics, $this->complianceDistribution, $this->departmentReports, $this->user),
            new TrainingDetailsSheet($this->trainings),
            new DepartmentSummarySheet($this->departmentReports),
            new ComplianceSheet($this->complianceDistribution),
        ];
    }
}

class OverviewSheet implements FromCollection, WithHeadings, WithStyles, WithColumnWidths
{
    private $statistics;
    private $complianceDistribution;
    private $departmentReports;
    private $user;

    public function __construct($statistics, $complianceDistribution, $departmentReports, $user)
    {
        $this->statistics = $statistics;
        $this->complianceDistribution = $complianceDistribution;
        $this->departmentReports = $departmentReports;
        $this->user = $user;
    }

    public function collection()
    {
        $data = new Collection();
        
        // Title
        $data->push(['SISTEM MANAJEMEN PELATIHAN - RINGKASAN LAPORAN']);
        $data->push([]);
        
        // Info Section
        $data->push(['Tanggal Generate', date('d-m-Y H:i:s')]);
        $data->push(['Dibuat Oleh', $this->user->name]);
        $data->push(['']);
        
        // Statistics
        $data->push(['STATISTIK UTAMA']);
        $data->push([]);
        $data->push(['Metrik', 'Nilai']);
        $data->push(['Total Pengguna', $this->statistics['total_users'] ?? 0]);
        $data->push(['Tingkat Penyelesaian', ($this->statistics['completion_rate'] ?? 0) . '%']);
        $data->push(['Rata-rata Skor', number_format($this->statistics['average_score'] ?? 0, 2)]);
        $data->push(['Tingkat Kepatuhan', ($this->statistics['overall_compliance_rate'] ?? 0) . '%']);
        
        $data->push([]);
        $data->push(['STATUS KEPATUHAN']);
        $data->push(['Status', 'Jumlah']);
        
        foreach ($this->complianceDistribution as $item) {
            $data->push([$item['name'], $item['value']]);
        }
        
        return $data;
    }

    public function headings(): array
    {
        return [];
    }

    public function styles(Worksheet $sheet)
    {
        // Title styling
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1F4E78']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->mergeCells('A1:B1');
        
        // Info section
        $sheet->getStyle('A3:B6')->applyFromArray([
            'font' => ['size' => 11],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E7E6E6']],
        ]);
        
        // Header styling for tables
        $sheet->getStyle('A8:B8')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 12],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
        ]);
        
        // Data rows
        $sheet->getStyle('A9:B20')->applyFromArray([
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        
        // Section headers
        $sheet->getStyle('A8')->applyFromArray(['font' => ['bold' => true, 'size' => 12]]);
        $sheet->getStyle('A16')->applyFromArray(['font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => '1F4E78']]]);
    }

    public function columnWidths(): array
    {
        return ['A' => 30, 'B' => 20];
    }
}

class TrainingDetailsSheet implements FromCollection, WithHeadings, WithStyles, WithColumnWidths
{
    private $trainings;

    public function __construct($trainings)
    {
        $this->trainings = $trainings;
    }

    public function collection()
    {
        $data = new Collection();
        
        // Add header with extended columns
        $data->push([
            'Nama Pengguna',
            'Email',
            'NIP',
            'Departemen',
            'Lokasi',
            'Modul Pelatihan',
            'Passing Grade',
            'Durasi Modul',
            'Status',
            'Skor Akhir',
            'Tersertifikasi',
            'Attempts',
            'Highest Score',
            'Avg Attempt Score',
            'Tanggal Enrollment',
            'Tanggal Selesai',
            'Waktu Penyelesaian (jam)'
        ]);
        
        // Add training data
        foreach ($this->trainings as $training) {
            $timeMinutes = $training->time_to_complete_minutes ?? null;
            $timeHours = is_numeric($timeMinutes) && $timeMinutes > 0 ? round($timeMinutes / 60, 2) : '-';

            $data->push([
                $training->user_name ?? '-',
                $training->user_email ?? '-',
                $training->nip ?? '-',
                $training->department ?? '-',
                $training->location ?? '-',
                $training->module_title ?? '-',
                $training->passing_grade ?? '-',
                $training->module_duration ?? '-',
                $this->formatStatus($training->status),
                $training->final_score ?? '-',
                $training->is_certified ? 'Ya' : 'Tidak',
                $training->attempts ?? 0,
                $training->highest_score ?? '-',
                $training->avg_attempt_score ?? '-',
                $training->enrolled_at ? \Carbon\Carbon::parse($training->enrolled_at)->format('d-m-Y H:i') : '-',
                $training->completed_at ? \Carbon\Carbon::parse($training->completed_at)->format('d-m-Y H:i') : '-',
                $timeHours
            ]);
        }
        
        return $data;
    }

    public function headings(): array
    {
        return [];
    }

    public function styles(Worksheet $sheet)
    {
        // Header styling (extended to Q)
        $sheet->getStyle('A1:Q1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
        ]);
        
        // Data rows styling
        $rowCount = count($this->trainings) + 1;
        $sheet->getStyle('A2:Q' . $rowCount)->applyFromArray([
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
        ]);
        
        // Alternate row colors
        for ($row = 2; $row <= $rowCount; $row++) {
            if ($row % 2 == 0) {
                $sheet->getStyle('A' . $row . ':Q' . $row)->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F2F2F2']],
                ]);
            }
        }
        
        // Freeze header row
        $sheet->freezePane('A2');
    }

    public function columnWidths(): array
    {
        return ['A' => 22, 'B' => 28, 'C' => 12, 'D' => 18, 'E' => 16, 'F' => 28, 'G' => 12, 'H' => 14, 'I' => 12, 'J' => 12, 'K' => 12, 'L' => 10, 'M' => 12, 'N' => 14, 'O' => 18, 'P' => 18, 'Q' => 16];
    }

    private function formatStatus($status)
    {
        $statuses = [
            'not_started' => 'Belum Dimulai',
            'in_progress' => 'Sedang Berjalan',
            'completed' => 'Selesai',
            'failed' => 'Gagal',
        ];
        return $statuses[$status] ?? ucfirst($status);
    }
}

class DepartmentSummarySheet implements FromCollection, WithHeadings, WithStyles, WithColumnWidths
{
    private $departmentReports;

    public function __construct($departmentReports)
    {
        $this->departmentReports = $departmentReports;
    }

    public function collection()
    {
        $data = new Collection();
        
        // Add header
        $data->push([
            'Departemen',
            'Selesai',
            'Tertunda',
            'Gagal',
            'Total',
            'Tingkat Penyelesaian'
        ]);
        
        // Add department data
        $totalCompleted = 0;
        $totalPending = 0;
        $totalFailed = 0;
        
        foreach ($this->departmentReports as $dept) {
            $generated = $dept['generated'] ?? 0;
            $pending = $dept['pending'] ?? 0;
            $failed = $dept['failed'] ?? 0;
            $total = $generated + $pending + $failed;
            $completionRate = $total > 0 ? round(($generated / $total) * 100, 2) : 0;
            
            $data->push([
                $dept['name'] ?? '-',
                $generated,
                $pending,
                $failed,
                $total,
                $completionRate . '%'
            ]);
            
            $totalCompleted += $generated;
            $totalPending += $pending;
            $totalFailed += $failed;
        }
        
        // Total row
        $data->push([]);
        $grandTotal = $totalCompleted + $totalPending + $totalFailed;
        $totalCompletionRate = $grandTotal > 0 ? round(($totalCompleted / $grandTotal) * 100, 2) : 0;
        $data->push(['TOTAL', $totalCompleted, $totalPending, $totalFailed, $grandTotal, $totalCompletionRate . '%']);
        
        return $data;
    }

    public function headings(): array
    {
        return [];
    }

    public function styles(Worksheet $sheet)
    {
        // Header styling
        $sheet->getStyle('A1:F1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '70AD47']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
        ]);
        
        // Data rows
        $rowCount = count($this->departmentReports) + 1;
        $sheet->getStyle('A2:F' . $rowCount)->applyFromArray([
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        
        // Total row styling
        $sheet->getStyle('A' . ($rowCount + 2) . ':F' . ($rowCount + 2))->applyFromArray([
            'font' => ['bold' => true, 'size' => 11],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FFF2CC']],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
    }

    public function columnWidths(): array
    {
        return ['A' => 20, 'B' => 12, 'C' => 12, 'D' => 10, 'E' => 10, 'F' => 20];
    }
}

class ComplianceSheet implements FromCollection, WithHeadings, WithStyles, WithColumnWidths
{
    private $complianceDistribution;

    public function __construct($complianceDistribution)
    {
        $this->complianceDistribution = $complianceDistribution;
    }

    public function collection()
    {
        $data = new Collection();
        
        // Title
        $data->push(['DISTRIBUSI STATUS KEPATUHAN']);
        $data->push([]);
        
        // Add header
        $data->push(['Status', 'Jumlah', 'Persentase']);
        
        // Calculate total
        $total = array_sum(array_map(fn($item) => $item['value'], $this->complianceDistribution));
        
        // Add compliance data
        foreach ($this->complianceDistribution as $item) {
            $percentage = $total > 0 ? round(($item['value'] / $total) * 100, 2) : 0;
            $data->push([
                $item['name'],
                $item['value'],
                $percentage . '%'
            ]);
        }
        
        $data->push([]);
        $data->push(['TOTAL', $total, '100%']);
        
        return $data;
    }

    public function headings(): array
    {
        return [];
    }

    public function styles(Worksheet $sheet)
    {
        // Title
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'C55A11']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
        $sheet->mergeCells('A1:C1');
        
        // Header
        $sheet->getStyle('A3:C3')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'C55A11']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
        ]);
        
        // Data rows
        $rowCount = count($this->complianceDistribution) + 3;
        $sheet->getStyle('A4:C' . $rowCount)->applyFromArray([
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
        
        // Total row
        $sheet->getStyle('A' . ($rowCount + 2) . ':C' . ($rowCount + 2))->applyFromArray([
            'font' => ['bold' => true],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FFEB9C']],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
        ]);
    }

    public function columnWidths(): array
    {
        return ['A' => 25, 'B' => 15, 'C' => 15];
    }
}
