<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\AdminReportController;
use Illuminate\Http\Request;

/**
 * Proxy controller for Admin Reports
 * Delegates to AdminReportController for main functionality
 */
class ReportController extends Controller
{
    protected $adminReportController;

    public function __construct()
    {
        $this->adminReportController = new AdminReportController();
    }

    /**
     * Display reports & compliance dashboard
     */
    public function index(Request $request)
    {
        $this->authorize('view-reports');
        return $this->adminReportController->index($request);
    }

    /**
     * Get dashboard data via API
     */
    public function getDashboardData(Request $request)
    {
        $this->authorize('view-reports');
        return $this->adminReportController->index($request);
    }

    /**
     * Get learner progress data
     */
    public function getLearnerProgress(Request $request)
    {
        $this->authorize('view-reports');
        return $this->adminReportController->index($request);
    }

    /**
     * Export learner progress
     */
    public function exportLearnerProgress(Request $request)
    {
        $this->authorize('export-reports');
        $request->merge(['type' => 'learner-progress']);
        return $this->adminReportController->exportReport($request);
    }

    /**
     * Get question performance data
     */
    public function getQuestionPerformance(Request $request)
    {
        $this->authorize('view-reports');
        return $this->adminReportController->index($request);
    }

    /**
     * Export question performance
     */
    public function exportQuestionPerformance(Request $request)
    {
        $request->merge(['type' => 'question-performance']);
        return $this->adminReportController->exportReport($request);
    }

    /**
     * Get compliance audit trail data
     */
    public function getComplianceAuditTrail(Request $request)
    {
        return $this->adminReportController->index($request);
    }

    /**
     * Export compliance audit trail
     */
    public function exportComplianceAudit(Request $request)
    {
        $request->merge(['type' => 'compliance-audit']);
        return $this->adminReportController->exportReport($request);
    }

    /**
     * Get comparison report data
     */
    public function getComparisonReport(Request $request)
    {
        return $this->adminReportController->index($request);
    }

    /**
     * Export comparison report
     */
    public function exportComparisonReport(Request $request)
    {
        $request->merge(['type' => 'comparison']);
        return $this->adminReportController->exportReport($request);
    }

    /**
     * Get custom report builder page
     */
    public function getReportBuilder(Request $request)
    {
        return $this->adminReportController->index($request);
    }

    /**
     * Generate custom report
     */
    public function generateCustomReport(Request $request)
    {
        return $this->adminReportController->exportReport($request);
    }

    /**
     * Handle export by type
     */
    public function handleExport($type, Request $request)
    {
        $request->merge(['type' => $type]);
        return $this->adminReportController->exportReport($request);
    }
}
