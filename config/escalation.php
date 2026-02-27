<?php

/**
 * Escalation and Compliance Configuration
 * Define thresholds and rules for compliance monitoring and escalations
 */

return [
    'escalation_thresholds' => [
        // Days overdue before escalation level changes
        'critical' => 30,  // 30+ days overdue = critical
        'high' => 14,      // 14-29 days overdue = high
        'medium' => 7,     // 7-13 days overdue = medium
        'low' => 1,        // 1-6 days overdue = low
    ],

    'compliance_thresholds' => [
        'compliant' => 80,      // 80%+ compliance rate
        'at_risk' => 50,        // 50-79% compliance rate
        'non_compliant' => 0,   // Below 50% compliance rate
    ],

    'risk_levels' => [
        'dropout_critical' => 0.7,   // Risk score >= 0.7
        'dropout_high' => 0.5,       // Risk score 0.5-0.69
        'dropout_medium' => 0.3,     // Risk score 0.3-0.49
        'dropout_low' => 0,          // Risk score < 0.3
    ],

    'performance_benchmarks' => [
        'poor_score' => 40,      // Score below 40%
        'low_score' => 60,       // Score 40-59%
        'average_score' => 70,   // Score 70-79%
        'good_score' => 85,      // Score 85%+
    ],

    'inactivity_thresholds' => [
        'critical' => 90,  // 90+ days inactive = critical
        'warning' => 30,   // 30-89 days inactive = warning
    ],

    'completion_targets' => [
        'minimum' => 0.5,  // Minimum 50% completion expected
        'target' => 0.8,   // Target 80% completion
        'excellent' => 0.95, // Excellent 95%+ completion
    ],

    'actions' => [
        'critical' => 'Immediate intervention - contact user urgently, escalate to manager',
        'high' => 'Schedule follow-up meeting within 3 days, provide support resources',
        'medium' => 'Send encouragement message, offer tutoring',
        'low' => 'Continue monitoring, provide tips for improvement',
    ],

    'notification_settings' => [
        'notify_on_escalation' => true,
        'escalation_email_template' => 'emails.compliance.escalation',
        'escalation_sms_enabled' => false,
        'notify_manager_on_critical' => true,
        'notify_admin_on_critical' => true,
    ],

    'cache_ttl' => [
        'hierarchy' => 86400,      // 24 hours for department hierarchy
        'statistics' => 3600,      // 1 hour for statistics
        'predictions' => 7200,     // 2 hours for predictions
        'escalations' => 900,      // 15 minutes for escalations
    ],

    'report_settings' => [
        'auto_generate_weekly' => true,
        'auto_generate_monthly' => true,
        'report_recipients' => ['admin@example.com'],
        'include_at_risk_users' => true,
        'include_escalations' => true,
        'include_predictions' => true,
    ],
];
