<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use App\Exports\Sheets\{
    ExecutiveSummarySheet,
    MasterLearnerDataSheet,
    ProgramPerformanceSheet,
    AssessmentQualitySheet,
    QuestionPerformanceSheet,
    DepartmentLeaderboardSheet,
    CertificateLogSheet,
    LearningHabitsSheet
};

/**
 * UNIFIED REPORTS EXPORT - CONSOLIDATED 8-SHEET STRUCTURE
 * 
 * Strategic Consolidation: Reduced from 25 sheets to 8 High-Value Sheets
 * Fokus pada: Actionable Insights bukan Data Dump
 * 
 * ✅ Auto Filter pada header
 * ✅ Freeze Pane (sticky headers)
 * ✅ Zebra Striping (warna selang-seling)
 * ✅ Professional Wondr Styling
 * ✅ Merged Titles & Metadata
 * ✅ Auto Wrap Text
 * ✅ Border & Formatting
 * ✅ Color-Coded Risk/Status Indicators
 * 
 * 8 SHEETS (CONSOLIDATED):
 * 1. Executive Dashboard - KPI utama & ringkasan eksekutif
 * 2. Master Learner Data - Profil lengkap setiap learner (PALING PENTING!)
 * 3. Program Performance - Analisis modul dengan learning impact
 * 4. Assessment Quality - Kualitas soal & analisis reliabilitas
 * 5. Question Analysis - Detail per-butir soal (untuk pembuat soal)
 * 6. Department Insights - Leaderboard departemen & performa tim
 * 7. Certificate Log - Audit trail sertifikat & compliance
 * 8. Learning Habits - Tren pembelajaran & pola waktu optimal
 */
class UnifiedReportsExport implements WithMultipleSheets
{
    protected $data;

    public function __construct($data)
    {
        // Convert all data to pure arrays to avoid stdClass serialization issues
        $this->data = $this->convertToArray($data);
    }

    /**
     * Recursively convert stdClass objects and Collections to arrays
     */
    protected function convertToArray($data)
    {
        if (is_array($data)) {
            $result = [];
            foreach ($data as $key => $value) {
                $result[$key] = $this->convertToArray($value);
            }
            return $result;
        } elseif (is_object($data)) {
            // Convert stdClass to array
            if ($data instanceof \Illuminate\Support\Collection) {
                return $this->convertToArray($data->toArray());
            } else {
                return $this->convertToArray(get_object_vars($data));
            }
        }
        return $data;
    }

    public function sheets(): array
    {
        return [
            // 📊 EXECUTIVE DASHBOARD
            'Executive Dashboard' => new ExecutiveSummarySheet($this->data['stats'] ?? [], 'EXECUTIVE DASHBOARD'),
            
            // 👤 MASTER LEARNER DATA (PALING PENTING!)
            'Master Learner Data' => new MasterLearnerDataSheet([
                'learnerProgress' => $this->data['learnerProgress'] ?? [],
                'engagementAnalytics' => $this->data['engagementAnalytics'] ?? [],
                'learnerComparison' => $this->data['learnerComparison'] ?? [],
                'dormantUsers' => $this->data['dormantUsers'] ?? [],
                'atRiskUsers' => $this->data['atRiskUsers'] ?? [],
                'skillDevelopment' => $this->data['skillDevelopment'] ?? [],
            ], 'MASTER LEARNER DATA'),
            
            // 📚 PROGRAM PERFORMANCE
            'Program Performance' => new ProgramPerformanceSheet([
                'moduleStats' => $this->data['moduleStats'] ?? [],
                'programEnrollment' => $this->data['programEnrollment'] ?? [],
                'prePostAnalysis' => $this->data['prePostAnalysis'] ?? [],
            ], 'PROGRAM PERFORMANCE'),
            
            // 📝 ASSESSMENT QUALITY
            'Assessment Quality' => new AssessmentQualitySheet([
                'examPerformance' => $this->data['examPerformance'] ?? [],
                'quizDifficulty' => $this->data['quizDifficulty'] ?? [],
            ], 'ASSESSMENT QUALITY'),
            
            // ❓ QUESTION ANALYSIS
            'Question Analysis' => new QuestionPerformanceSheet($this->data['questionItemAnalysis'] ?? [], 'QUESTION ANALYSIS'),
            
            // 🏆 DEPARTMENT INSIGHTS
            'Department Insights' => new DepartmentLeaderboardSheet($this->data['departmentLeaderboard'] ?? [], 'DEPARTMENT INSIGHTS'),
            
            // 🛡️ CERTIFICATE LOG & COMPLIANCE
            'Certificate Log' => new CertificateLogSheet([
                'certificateStats' => $this->data['certificateStats'] ?? [],
                'complianceAudit' => $this->data['complianceAudit'] ?? [],
                'certificateDistribution' => $this->data['certificateDistribution'] ?? [],
            ], 'CERTIFICATE LOG & COMPLIANCE'),
            
            // 🔥 LEARNING HABITS ANALYTICS
            'Learning Habits' => new LearningHabitsSheet([
                'trendData' => $this->data['trendData'] ?? [],
                'performanceHeatmap' => $this->data['performanceHeatmap'] ?? [],
            ], 'LEARNING HABITS ANALYTICS'),
        ];
    }
}
