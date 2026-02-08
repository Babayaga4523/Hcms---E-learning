<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use App\Exports\Sheets\{
    ExecutiveSummarySheet,
    LearnerProgressDetailSheet,
    ModulePerformanceDetailSheet,
    ExamPerformanceDetailSheet,
    DepartmentLeaderboardSheet,
    TrendAnalysisSheet,
    CertificateAnalyticsSheet,
    AtRiskUsersSheet,
    LearningImpactSheet,
    ComplianceAuditSheet,
    QuestionPerformanceSheet,
    LearnerComparisonSheet,
    EngagementAnalyticsSheet,
    TrainingMaterialSheet,
    ProgramEnrollmentSheet,
    CertificateDistributionSheet,
    DormantUserSheet,
    ModuleProgressTimelineSheet,
    SkillDevelopmentSheet,
    ResourceUtilizationSheet,
    PerformanceHeatmapSheet,
    DemographicAnalysisSheet,
    PrerequisiteComplianceSheet,
    QuizDifficultyAnalysisSheet
};

/**
 * UNIFIED REPORTS EXPORT - ENTERPRISE GRADE
 * 
 * 24 Professional Sheets dengan:
 * ✅ Auto Filter pada header
 * ✅ Freeze Pane (sticky headers)
 * ✅ Zebra Striping (warna selang-seling)
 * ✅ Professional Wondr Styling
 * ✅ Merged Titles & Metadata
 * ✅ Auto Wrap Text
 * ✅ Border & Formatting
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
            // 🎯 CORE SHEETS (9)
            'Executive Summary' => new ExecutiveSummarySheet($this->data['stats'] ?? [], 'EXECUTIVE SUMMARY'),
            'Learner Progress' => new LearnerProgressDetailSheet($this->data['learnerProgress'] ?? [], 'LEARNER PROGRESS'),
            'Module Performance' => new ModulePerformanceDetailSheet($this->data['moduleStats'] ?? [], 'MODULE PERFORMANCE'),
            'Exam Performance' => new ExamPerformanceDetailSheet($this->data['examPerformance'] ?? [], 'EXAM PERFORMANCE'),
            'Department Leaderboard' => new DepartmentLeaderboardSheet($this->data['departmentLeaderboard'] ?? [], 'DEPARTMENT LEADERBOARD'),
            'Trend Analysis' => new TrendAnalysisSheet($this->data['trendData'] ?? [], 'TREND ANALYSIS'),
            'Certificates' => new CertificateAnalyticsSheet($this->data['certificateStats'] ?? [], 'CERTIFICATES'),
            'At-Risk Users' => new AtRiskUsersSheet($this->data['atRiskUsers'] ?? [], 'AT-RISK USERS'),
            'Learning Impact' => new LearningImpactSheet($this->data['prePostAnalysis'] ?? [], 'LEARNING IMPACT'),
            
            // ⚖️ COMPLIANCE (3)
            'Compliance Audit' => new ComplianceAuditSheet($this->data['complianceAudit'] ?? [], 'COMPLIANCE AUDIT'),
            'Question Performance' => new QuestionPerformanceSheet($this->data['questionItemAnalysis'] ?? [], 'QUESTION PERFORMANCE'),
            'Prerequisite Compliance' => new PrerequisiteComplianceSheet($this->data['prerequisiteCompliance'] ?? [], 'PREREQUISITE COMPLIANCE'),
            
            // 📊 ANALYTICS (3)
            'Learner Comparison' => new LearnerComparisonSheet($this->data['learnerComparison'] ?? [], 'LEARNER COMPARISON'),
            'Engagement Analytics' => new EngagementAnalyticsSheet($this->data['engagementAnalytics'] ?? [], 'ENGAGEMENT ANALYTICS'),
            'Performance Heatmap' => new PerformanceHeatmapSheet($this->data['performanceHeatmap'] ?? [], 'PERFORMANCE HEATMAP'),
            
            // 📚 TRAINING (3)
            'Training Materials' => new TrainingMaterialSheet($this->data['trainingMaterials'] ?? [], 'TRAINING MATERIALS'),
            'Program Enrollment' => new ProgramEnrollmentSheet($this->data['programEnrollment'] ?? [], 'PROGRAM ENROLLMENT'),
            'Resource Utilization' => new ResourceUtilizationSheet($this->data['resourceUtilization'] ?? [], 'RESOURCE UTILIZATION'),
            
            // 👥 USER DEVELOPMENT (3)
            'Dormant Users' => new DormantUserSheet($this->data['dormantUsers'] ?? [], 'DORMANT USERS'),
            'Skill Development' => new SkillDevelopmentSheet($this->data['skillDevelopment'] ?? [], 'SKILL DEVELOPMENT'),
            'Demographics' => new DemographicAnalysisSheet($this->data['demographics'] ?? [], 'DEMOGRAPHICS'),
            
            // 🎓 PROGRAM & QUIZ (3)
            'Certificate Distribution' => new CertificateDistributionSheet($this->data['certificateDistribution'] ?? [], 'CERTIFICATE DISTRIBUTION'),
            'Module Timeline' => new ModuleProgressTimelineSheet($this->data['moduleTimeline'] ?? [], 'MODULE TIMELINE'),
            'Quiz Difficulty' => new QuizDifficultyAnalysisSheet($this->data['quizDifficulty'] ?? [], 'QUIZ DIFFICULTY'),
        ];
    }
}
