<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Admin Dashboard Configuration
    |--------------------------------------------------------------------------
    | Configurable settings for admin dashboard and reporting features
    |
    */

    'dashboard' => [
        // Pagination and display limits
        'top_performers_limit' => env('ADMIN_DASHBOARD_TOP_PERFORMERS', 10),
        'recent_enrollments_limit' => env('ADMIN_DASHBOARD_RECENT_ENROLLMENTS', 10),
        'recent_completions_limit' => env('ADMIN_DASHBOARD_RECENT_COMPLETIONS', 10),
        'recent_activity_logs_limit' => env('ADMIN_DASHBOARD_ACTIVITY_LOGS', 10),
        'max_records_per_page' => 50,
        'default_page_size' => 15,
    ],

    'reports' => [
        // Report configuration
        'export_limit' => env('ADMIN_EXPORT_LIMIT', 5000),
        'csv_page_size' => 1000,
        'default_date_range_days' => 30,
        'cache_ttl' => env('ADMIN_CACHE_TTL', 600), // 10 minutes
        'top_users_limit' => env('ADMIN_REPORT_TOP_USERS', 5),
        'top_performers_limit' => env('ADMIN_REPORT_TOP_PERFORMERS', 20),
        'low_performers_limit' => env('ADMIN_REPORT_LOW_PERFORMERS', 10),
        'top_modules_limit' => env('ADMIN_REPORT_TOP_MODULES', 20),
        'sample_size' => env('ADMIN_REPORT_SAMPLE_SIZE', 100),
        'max_limit' => 100,
        'improvement_limit' => env('ADMIN_REPORT_IMPROVEMENT_LIMIT', 15),
        'top_scores_limit' => env('ADMIN_REPORT_TOP_SCORES_LIMIT', 5),
        'risk_assessment_limit' => env('ADMIN_REPORT_RISK_LIMIT', 30),
    ],

    'training_programs' => [
        // Training program management
        'default_passing_grade' => 70,
        'default_max_retakes' => 3,
        'max_upload_size_mb' => 20,
        'allowed_file_types' => ['pdf', 'mp4', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'],
        'allowed_mime_types' => [
            'application/pdf',
            'video/mp4',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
        ],
    ],

    'users' => [
        // User management configuration
        'csv_import_batch_size' => 100,
        'max_bulk_delete' => 100,
        'min_admin_users' => 2, // Minimum admins to keep in system
    ],

    'audit' => [
        // Audit logging configuration
        'sensitive_operations' => [
            'user_create',
            'user_update',
            'user_delete',
            'user_role_change',
            'user_password_reset',
            'user_bulk_delete',
            'module_delete',
            'module_update',
            'module_create',
            'csv_import',
            'report_export',
            'system_config_change',
        ],
        'log_retention_days' => env('ADMIN_AUDIT_LOG_RETENTION', 90),
    ],

    'pagination' => [
        // Default pagination settings
        'per_page' => 15,
        'max_per_page' => 100,
        'options' => [10, 15, 25, 50, 100],
    ],

    'categories' => [
        // Default training program categories
        'default' => [
            'Core Business & Product',
            'IT & Digital Security',
            'Compliance & Regulatory',
            'Sales & Marketing',
            'Human Resources',
            'Finance & Operations',
            'Customer Success',
            'Professional Development',
        ],
    ],
];
