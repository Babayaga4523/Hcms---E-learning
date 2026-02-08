<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class ComprehensiveExport implements WithMultipleSheets
{
    use Exportable;

    protected $stats;
    protected $usersByDepartment;
    protected $usersByStatus;
    protected $moduleStats;
    protected $learnerProgress;
    protected $examPerformance;
    protected $questionAnalysis;
    protected $trendData;
    protected $complianceDistribution;
    protected $topPerformers;
    protected $strugglers;
    protected $engagementMetrics;

    public function __construct(
        $stats,
        $usersByDepartment,
        $usersByStatus,
        $moduleStats,
        $learnerProgress,
        $examPerformance,
        $questionAnalysis,
        $trendData,
        $complianceDistribution,
        $topPerformers,
        $strugglers,
        $engagementMetrics
    ) {
        $this->stats = $stats;
        $this->usersByDepartment = $usersByDepartment;
        $this->usersByStatus = $usersByStatus;
        $this->moduleStats = $moduleStats;
        $this->learnerProgress = $learnerProgress;
        $this->examPerformance = $examPerformance;
        $this->questionAnalysis = $questionAnalysis;
        $this->trendData = $trendData;
        $this->complianceDistribution = $complianceDistribution;
        $this->topPerformers = $topPerformers;
        $this->strugglers = $strugglers;
        $this->engagementMetrics = $engagementMetrics;
    }

    /**
     * @return array
     */
    public function sheets(): array
    {
        return [
            new Sheets\ComplianceDetailSheet($this->learnerProgress),
            new Sheets\UserAnalyticsSheet($this->usersByDepartment),
            new Sheets\ModulePerformanceSheet($this->moduleStats),
            new Sheets\LearnerDetailSheet($this->learnerProgress),
            new Sheets\ExamPerformanceSheet($this->examPerformance),
            new Sheets\SummaryAnalyticsSheet($this->stats),
        ];
    }
}
