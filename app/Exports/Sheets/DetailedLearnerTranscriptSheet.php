<?php

namespace App\Exports\Sheets;

use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

/**
 * DETAILED LEARNER TRANSCRIPT SHEET
 * 
 * "Satu Data Kebenaran" (Single Source of Truth) untuk:
 * - Siapa: Nama, NIP, Departemen
 * - Belajar Apa: Nama Modul, Kategori
 * - Kapan: Tanggal Mulai, Tanggal Selesai
 * - Hasilnya Bagaimana: Status, Nilai, Progress, Durasi, Sertifikat
 * 
 * Target: 1 Baris = 1 User dalam 1 Modul (Master Transcript)
 * Granularity: Individu per Program
 * Use Case: HR Audit, Compliance Verification, Individual Development Plans
 */
class DetailedLearnerTranscriptSheet extends BaseReportSheet
{
    public function __construct($data, $title = 'Master Transcript')
    {
        parent::__construct($data, $title);
    }

    /**
     * BUSINESS LOGIC: Mengambil data transcript granular
     * 1 Baris = 1 User dalam 1 Modul dengan semua history lengkap
     */
    public function prepareData(): array
    {
        // Query Builder untuk data detail
        $query = DB::table('user_trainings as ut')
            ->join('users as u', 'ut.user_id', '=', 'u.id')
            ->join('modules as m', 'ut.module_id', '=', 'm.id')
            // Optional join untuk sertifikat (jika ada)
            ->leftJoin('certificates as c', function($join) {
                $join->on('ut.user_id', '=', 'c.user_id')
                     ->on('ut.module_id', '=', 'c.module_id');
            })
            // Optional join untuk pre/post test scores
            ->leftJoin('exam_attempts as ea', function($join) {
                $join->on('ut.user_id', '=', 'ea.user_id')
                     ->on('ut.module_id', '=', 'ea.module_id')
                     ->where('ea.is_passed', true);
            })
            ->where('u.role', '!=', 'admin')
            ->select(
                // User Demographics
                'u.id as user_id',
                'u.nip',
                'u.name',
                'u.department',
                'u.email',
                'u.phone',
                
                // Module Information
                'm.id as module_id',
                'm.title as module_name',
                'm.category',
                'm.description as module_description',
                'm.duration_hours',
                
                // Training Progress Details
                'ut.id as enrollment_id',
                'ut.status',
                'ut.progress_percentage',
                'ut.final_score',
                'ut.enrolled_at',
                'ut.completed_at',
                'ut.duration_minutes',
                'ut.completion_percentage',
                
                // Assessment Data (avg of passed attempts)
                DB::raw('ROUND(AVG(CASE WHEN ea.is_passed = 1 THEN ea.score END), 2) as exam_score'),
                
                // Certificate Data
                'c.certificate_number',
                'c.issued_at',
                'c.expiry_date',
                'c.status as certificate_status'
            )
            ->groupBy(
                'u.id', 'u.nip', 'u.name', 'u.department', 'u.email', 'u.phone',
                'm.id', 'm.title', 'm.category', 'm.description', 'm.duration_hours',
                'ut.id', 'ut.status', 'ut.progress_percentage', 'ut.final_score', 
                'ut.enrolled_at', 'ut.completed_at', 'ut.duration_minutes', 'ut.completion_percentage',
                'c.certificate_number', 'c.issued_at', 'c.expiry_date', 'c.status'
            )
            ->orderBy('u.department', 'asc')
            ->orderBy('u.name', 'asc')
            ->orderBy('m.title', 'asc')
            ->get();

        // Transform data ke format Excel dengan logic bisnis
        return $query->map(function($row) {
            // ===== KOLOM A: NIP =====
            $nip = $row->nip ?? '-';

            // ===== KOLOM B: NAMA LENGKAP =====
            $name = $row->name ?? '-';

            // ===== KOLOM C: DEPARTEMEN =====
            $department = $row->department ?? 'Tidak Diketahui';

            // ===== KOLOM D: JUDUL PELATIHAN =====
            $moduleName = $row->module_name ?? '-';

            // ===== KOLOM E: KATEGORI =====
            $category = $row->category ?? 'General';

            // ===== KOLOM F: STATUS PELATIHAN =====
            // Logic: Mapping status ke label readable
            $statusLabel = match($row->status) {
                'completed' => '✓ LULUS',
                'in_progress' => '⏳ SEDANG BERJALAN',
                'pending' => '⭕ BELUM MULAI',
                'failed' => '✗ GAGAL',
                'cancelled' => '⊘ DIBATALKAN',
                default => strtoupper($row->status ?? 'UNKNOWN')
            };

            // ===== KOLOM G: NILAI AKHIR (0-100) =====
            // Logic: Jika ada exam_score, gunakan itu; jika tidak, gunakan final_score
            $finalScore = $row->exam_score ?? $row->final_score ?? 0;
            $finalScore = round($finalScore, 2);

            // ===== KOLOM H: PROGRESS (%) =====
            // Logic: Ubah dari persen (0-100) ke desimal (0-1) untuk Excel format
            $progress = ($row->progress_percentage ?? 0) / 100;

            // ===== KOLOM I: DURASI BELAJAR =====
            // Logic: Format durasi dari menit ke "Xj Ym" (jam dan menit)
            $duration = '-';
            if ($row->duration_minutes > 0) {
                $hours = floor($row->duration_minutes / 60);
                $mins = $row->duration_minutes % 60;
                $duration = ($hours > 0 ? "{$hours}j " : "") . "{$mins}m";
            }

            // ===== KOLOM J: TANGGAL MULAI =====
            // Logic: Format tanggal dari timestamp ke DD-MM-YYYY
            $enrolledDate = '-';
            if ($row->enrolled_at) {
                try {
                    $enrolledDate = date('d-m-Y', strtotime($row->enrolled_at));
                } catch (\Exception $e) {
                    $enrolledDate = $row->enrolled_at;
                }
            }

            // ===== KOLOM K: TANGGAL SELESAI =====
            // Logic: Jika belum selesai, tampilkan "-"
            $completedDate = '-';
            if ($row->completed_at && $row->status === 'completed') {
                try {
                    $completedDate = date('d-m-Y', strtotime($row->completed_at));
                } catch (\Exception $e) {
                    $completedDate = $row->completed_at;
                }
            }

            // ===== KOLOM L: HARI HINGGA SELESAI =====
            // Logic: Hitung days elapsed atau days remaining
            $daysDiff = '-';
            if ($row->enrolled_at) {
                $enDate = new \DateTime($row->enrolled_at);
                if ($row->completed_at && $row->status === 'completed') {
                    $comDate = new \DateTime($row->completed_at);
                    $daysDiff = $comDate->diff($enDate)->days;
                } else {
                    $daysDiff = $enDate->diff(new \DateTime())->days;
                }
            }

            // ===== KOLOM M: SERTIFIKAT STATUS =====
            // Logic: Ada 3 status: Belum Ada, Aktif, Expired
            $certificateStatus = 'Tidak Ada';
            if ($row->certificate_number) {
                $certificateStatus = match($row->certificate_status) {
                    'active' => 'Aktif',
                    'expired' => 'Kadaluarsa',
                    'revoked' => 'Dicabut',
                    default => 'Ada'
                };
            }

            // ===== KOLOM N: NOMOR SERTIFIKAT =====
            // Logic: Tampilkan nomor sertifikat jika ada
            $certificateNumber = $row->certificate_number ?? '-';

            // ===== KOLOM O: KUALITAS PEMBELAJARAN (INFERRED) =====
            // Logic: Deteksi kualitas berdasarkan combination durasi vs skor
            // Jika durasi sangat singkat tapi skor tinggi = mencurigakan (cheating?)
            // Jika durasi normal dan skor tinggi = berkualitas
            $qualityIndicator = $this->inferLearningQuality(
                $row->duration_minutes ?? 0,
                $finalScore,
                $row->module_name ?? '',
                $row->progress_percentage ?? 0
            );

            return [
                $nip,                           // A
                $name,                          // B
                $department,                    // C
                $moduleName,                    // D
                $category,                      // E
                $statusLabel,                   // F
                $finalScore,                    // G (numeric, will be formatted)
                $progress,                      // H (numeric, will be formatted as %)
                $duration,                      // I
                $enrolledDate,                  // J
                $completedDate,                 // K
                $daysDiff,                      // L
                $certificateStatus,             // M
                $certificateNumber,             // N
                $qualityIndicator               // O (Quality Indicator)
            ];
        })->toArray();
    }

    /**
     * QUALITY INDICATOR LOGIC
     * Infer learning quality from behavioral signals
     */
    private function inferLearningQuality($durationMinutes, $score, $moduleName, $progress)
    {
        // Threshold: 60 menit = 1 jam sebagai baseline
        $minBaselineMinutes = 60;
        
        // Red Flags untuk cheating/skipping
        if ($durationMinutes < 5 && $score >= 80) {
            return 'SUSPECT'; // Duration terlalu singkat tapi skor tinggi
        }
        
        if ($progress > 80 && $score < 40) {
            return 'CONCERN'; // Progress tinggi tapi skor rendah = tidak paham
        }

        // Green Flags untuk pembelajaran berkualitas
        if ($durationMinutes > ($minBaselineMinutes * 1.5) && $score >= 70) {
            return 'EXCELLENT'; // Durasi cukup, skor bagus
        }
        
        if ($durationMinutes >= $minBaselineMinutes && $score >= 70) {
            return 'GOOD'; // Normal behavior
        }
        
        if ($score >= 70) {
            return 'PASSING'; // Lulus meski durasi kurang
        }

        return 'STANDARD'; // Neutral
    }

    /**
     * HEADER COLUMNS DEFINITION
     */
    public function headerColumns(): array
    {
        return [
            'ID Karyawan (NIP)',        // A
            'Nama Lengkap',             // B
            'Departemen',               // C
            'Judul Pelatihan',          // D
            'Kategori',                 // E
            'Status',                   // F
            'Nilai Akhir',              // G
            'Progress (%)',             // H
            'Durasi Belajar',           // I
            'Tanggal Mulai',            // J
            'Tanggal Selesai',          // K
            'Hari Training',            // L
            'Status Sertifikat',        // M
            'Nomor Sertifikat',         // N
            'Kualitas Pembelajaran',    // O
        ];
    }

    /**
     * COLUMN WIDTH DEFINITION (Optional)
     * Format: [column => width in Excel units]
     */
    public function columnWidths(): array
    {
        return [
            'A' => 15, // NIP
            'B' => 20, // Nama
            'C' => 18, // Departemen
            'D' => 25, // Modul
            'E' => 15, // Kategori
            'F' => 18, // Status
            'G' => 12, // Nilai
            'H' => 12, // Progress
            'I' => 15, // Durasi
            'J' => 15, // Tgl Mulai
            'K' => 15, // Tgl Selesai
            'L' => 12, // Hari
            'M' => 15, // Sertifikat
            'N' => 18, // No Sertifikat
            'O' => 18, // Kualitas
        ];
    }

    /**
     * NUMBER FORMAT DEFINITION
     * Format scoring columns and percentages
     */
    public function columnFormats(): array
    {
        return [
            'G' => '0.00',                              // Nilai Akhir (2 decimal)
            'H' => NumberFormat::FORMAT_PERCENTAGE_00,  // Progress %
            'L' => '0',                                 // Hari (integer)
        ];
    }

    /**
     * ALIGNMENT & STYLING HINTS
     * These are applied by BaseReportSheet
     */
    public function columnAlignments(): array
    {
        return [
            'A' => 'center', // NIP
            'F' => 'center', // Status
            'G' => 'right',  // Nilai (numeric)
            'H' => 'right',  // Progress (numeric)
            'L' => 'center', // Hari
            'M' => 'center', // Sertifikat
            'O' => 'center', // Kualitas
        ];
    }

    /**
     * CONDITIONAL FORMATTING RULES (Optional)
     * Can be enhanced in BaseReportSheet
     */
    public function getFormattingRules(): array
    {
        return [
            // Status color coding
            'F:F' => [
                'LULUS' => 'FF00B050',      // Green
                'SEDANG BERJALAN' => 'FFFFB050', // Orange
                'BELUM MULAI' => 'FFC5C5C5',     // Gray
                'GAGAL' => 'FFFF0000',      // Red
            ],
            // Nilai color coding (Traffic Light)
            'G:G' => [
                '>= 80' => 'FF00B050',  // Green: Excellent
                '>= 70' => 'FFFFFF00',  // Yellow: Good
                '>= 60' => 'FFFFB050',  // Orange: Passable
                '< 60' => 'FFFF0000',   // Red: Fail
            ],
            // Quality indicator colors
            'O:O' => [
                'EXCELLENT' => 'FF00B050',
                'GOOD' => 'FF92D050',
                'PASSING' => 'FFFFC000',
                'SUSPECT' => 'FFFF0000',
                'CONCERN' => 'FFFF0000',
                'STANDARD' => 'FFFFF000',
            ],
        ];
    }

    /**
     * DATA SUMMARY (Optional Footer)
     * Can be added at end of sheet for quick stats
     */
    public function getSummaryStats($data): array
    {
        $totalRows = count($data);
        $completed = collect($data)->filter(fn($row) => strpos($row[5], 'LULUS') !== false)->count();
        $inProgress = collect($data)->filter(fn($row) => strpos($row[5], 'SEDANG') !== false)->count();
        $avgScore = collect($data)->avg(fn($row) => $row[6]);

        return [
            'Total Records' => $totalRows,
            'Completed' => $completed . ' (' . round(($completed/$totalRows)*100, 1) . '%)',
            'In Progress' => $inProgress . ' (' . round(($inProgress/$totalRows)*100, 1) . '%)',
            'Average Score' => round($avgScore, 2),
            'Generated' => now()->format('Y-m-d H:i:s'),
        ];
    }
}
