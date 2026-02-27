<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

/**
 * Audit Service - Centralized audit logging for sensitive operations
 * Provides consistent audit trail across the application
 */
class AuditService
{
    /**
     * Log a sensitive operation
     */
    public static function log(
        string $action,
        string $entityType,
        ?int $entityId = null,
        array $oldValues = [],
        array $newValues = [],
        ?string $description = null
    ): void {
        try {
            AuditLog::create([
                'user_id' => Auth::id() ?? null,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'changes' => [
                    'old' => $oldValues,
                    'new' => $newValues,
                    'description' => $description,
                ],
                'ip_address' => Request::ip(),
                'logged_at' => now(),
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to create audit log: ' . $e->getMessage());
        }
    }

    /**
     * Log user creation
     */
    public static function logUserCreate(array $userData, ?int $adminId = null): void
    {
        self::log(
            'user_create',
            'User',
            null,
            [],
            $userData,
            "Admin created new user: {$userData['name']}"
        );
    }

    /**
     * Log user update
     */
    public static function logUserUpdate(int $userId, array $oldValues, array $newValues): void
    {
        self::log(
            'user_update',
            'User',
            $userId,
            $oldValues,
            $newValues,
            "User updated with new values"
        );
    }

    /**
     * Log user delete
     */
    public static function logUserDelete(int $userId, array $userData): void
    {
        self::log(
            'user_delete',
            'User',
            $userId,
            $userData,
            [],
            "User deleted: {$userData['name']}"
        );
    }

    /**
     * Log user role change
     */
    public static function logUserRoleChange(int $userId, string $oldRole, string $newRole): void
    {
        self::log(
            'user_role_change',
            'User',
            $userId,
            ['role' => $oldRole],
            ['role' => $newRole],
            "User role changed from {$oldRole} to {$newRole}"
        );
    }

    /**
     * Log password reset
     */
    public static function logPasswordReset(int $userId, string $userName): void
    {
        self::log(
            'user_password_reset',
            'User',
            $userId,
            [],
            ['password_reset' => true, 'force_change' => true],
            "Password reset for user: {$userName}"
        );
    }

    /**
     * Log bulk user deletion
     */
    public static function logBulkUserDelete(array $userIds, int $count): void
    {
        self::log(
            'user_bulk_delete',
            'User',
            null,
            ['user_ids' => $userIds],
            ['deleted_count' => $count],
            "Bulk deleted {$count} users"
        );
    }

    /**
     * Log CSV import
     */
    public static function logCsvImport(int $count, array $summary): void
    {
        self::log(
            'csv_import',
            'User',
            null,
            [],
            [
                'imported_count' => $count,
                'summary' => $summary
            ],
            "Imported {$count} users from CSV"
        );
    }

    /**
     * Log module/training creation
     */
    public static function logModuleCreate(int $moduleId, array $moduleData): void
    {
        self::log(
            'module_create',
            'Module',
            $moduleId,
            [],
            $moduleData,
            "Training module created: {$moduleData['title']}"
        );
    }

    /**
     * Log module/training update
     */
    public static function logModuleUpdate(int $moduleId, array $oldValues, array $newValues): void
    {
        self::log(
            'module_update',
            'Module',
            $moduleId,
            $oldValues,
            $newValues,
            "Training module updated"
        );
    }

    /**
     * Log module/training deletion
     */
    public static function logModuleDelete(int $moduleId, string $moduleTitle): void
    {
        self::log(
            'module_delete',
            'Module',
            $moduleId,
            ['title' => $moduleTitle],
            [],
            "Training module deleted: {$moduleTitle}"
        );
    }

    /**
     * Log report export
     */
    public static function logReportExport(string $reportType, string $format): void
    {
        self::log(
            'report_export',
            'Report',
            null,
            [],
            [
                'report_type' => $reportType,
                'format' => $format,
                'timestamp' => now()
            ],
            "Report exported as {$format}: {$reportType}"
        );
    }

    /**
     * Log system configuration change
     */
    public static function logConfigChange(string $configKey, $oldValue, $newValue): void
    {
        self::log(
            'system_config_change',
            'Config',
            null,
            [$configKey => $oldValue],
            [$configKey => $newValue],
            "System configuration changed: {$configKey}"
        );
    }

    /**
     * Log access to sensitive data
     */
    public static function logSensitiveAccess(string $dataType, ?int $entityId = null): void
    {
        self::log(
            'sensitive_data_access',
            $dataType,
            $entityId,
            [],
            [],
            "Sensitive data accessed: {$dataType}"
        );
    }

    /**
     * Log permission denied attempt
     */
    public static function logPermissionDenied(string $action, string $resource): void
    {
        self::log(
            'permission_denied',
            $resource,
            null,
            [],
            ['action_attempted' => $action],
            "Permission denied for action: {$action}"
        );
    }
}
