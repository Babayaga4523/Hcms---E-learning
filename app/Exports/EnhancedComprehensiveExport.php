<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/**
 * ENHANCED COMPREHENSIVE EXPORT
 * Multiple sheets with all data, optimized for memory efficiency
 * 6 sheets: Main Compliance, Users, Modules, Learners, Exams, Analytics
 */
class EnhancedComprehensiveExport implements WithMultipleSheets
{
    use Exportable;

    protected $complianceData;
    protected $userStats;
    protected $moduleStats;
    protected $learnerData;
    protected $examData;
    protected $analyticsData;

    public function __construct(
        $complianceData,
        $userStats,
        $moduleStats,
        $learnerData,
        $examData,
        $analyticsData
    ) {
        $this->complianceData = $complianceData;
        $this->userStats = $userStats;
        $this->moduleStats = $moduleStats;
        $this->learnerData = $learnerData;
        $this->examData = $examData;
        $this->analyticsData = $analyticsData;
    }

    public function sheets(): array
    {
        return [
            new Sheets\ComplianceDetailSheet($this->complianceData),
            new Sheets\UserAnalyticsSheet($this->userStats),
            new Sheets\ModulePerformanceSheet($this->moduleStats),
            new Sheets\LearnerDetailSheet($this->learnerData),
            new Sheets\ExamPerformanceSheet($this->examData),
            new Sheets\SummaryAnalyticsSheet($this->analyticsData),
        ];
    }
}
