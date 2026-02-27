<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\ComplianceController;
use App\Http\Controllers\Api\RolePermissionController;
use App\Http\Controllers\Api\DepartmentHierarchyController;
use App\Http\Controllers\Api\UserStatisticsController;
use App\Http\Controllers\Api\EnrollmentConflictController;
use App\Http\Controllers\Api\ComplianceEscalationController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\PredictionController;
use App\Http\Controllers\Api\CertificateController;
use App\Models\User;
use App\Models\Role;

/**
 * API Routes for Business Logic Services
 * Some endpoints require authentication (middleware: api, auth:sanctum)
 * Prefix: /api
 */

// Public data endpoints (no auth required for reads)
Route::prefix('api')->middleware(['api'])->group(function () {
    /**
     * Users API Endpoints - public read
     */
    Route::get('/users', function () {
        return response()->json([
            'data' => User::select('id', 'name', 'email', 'department_id')->get()
        ]);
    });

    /**
     * Roles API Endpoints - public read
     */
    Route::get('/roles', function () {
        return response()->json([
            'data' => Role::select('id', 'name', 'description')->get()
        ]);
    });
});

// Protected endpoints that require authentication
Route::prefix('api')->middleware(['api', 'auth:sanctum'])->group(function () {
    Route::prefix('enrollments')->group(function () {
        Route::post('/', [EnrollmentController::class, 'enroll']);
        Route::post('/{enrollmentId}/transition-state', [EnrollmentController::class, 'transitionState']);
        Route::post('/{enrollmentId}/issue-certificate', [EnrollmentController::class, 'issueCertificate']);
        Route::get('/{enrollmentId}', [EnrollmentController::class, 'show']);
        Route::get('/user/{userId}', [EnrollmentController::class, 'userEnrollments']);
        Route::get('/module/{moduleId}', [EnrollmentController::class, 'moduleEnrollments']);
    });

    /**
     * Compliance Routes
     */
    Route::prefix('compliance')->group(function () {
        Route::get('/dashboard', [ComplianceController::class, 'dashboard']);
        Route::get('/module/{moduleId}/non-compliant', [ComplianceController::class, 'nonCompliant']);
        Route::get('/module/{moduleId}/at-risk', [ComplianceController::class, 'atRisk']);
        Route::post('/check/{enrollmentId}', [ComplianceController::class, 'check']);
        Route::post('/check-all', [ComplianceController::class, 'checkAll']);
        Route::post('/{enrollmentId}/resolve', [ComplianceController::class, 'resolve']);
        Route::get('/{enrollmentId}/audit-logs', [ComplianceController::class, 'auditLogs']);
    });

    /**
     * Role & Permission Routes
     */
    Route::prefix('roles-permissions')->group(function () {
        Route::post('/assign-role', [RolePermissionController::class, 'assignRole']);
        Route::post('/remove-role', [RolePermissionController::class, 'removeRole']);
        Route::post('/add-permission', [RolePermissionController::class, 'addPermission']);
        Route::post('/remove-permission', [RolePermissionController::class, 'removePermission']);
        Route::post('/bulk-assign-role', [RolePermissionController::class, 'bulkAssignRole']);
        Route::post('/sync-permissions/{userId}', [RolePermissionController::class, 'syncPermissions']);
        Route::get('/user/{userId}', [RolePermissionController::class, 'userRoles']);
        Route::get('/role/{roleId}/sync-history', [RolePermissionController::class, 'syncHistory']);
    });

    /**
     * Department Hierarchy Routes
     */
    Route::prefix('departments')->group(function () {
        Route::get('/tree', [DepartmentHierarchyController::class, 'tree']);
        Route::get('/{departmentId}/path', [DepartmentHierarchyController::class, 'path']);
        Route::get('/{departmentId}/descendants', [DepartmentHierarchyController::class, 'descendants']);
        Route::get('/{departmentId}/ancestors', [DepartmentHierarchyController::class, 'ancestors']);
        Route::get('/{departmentId}/breadcrumb', [DepartmentHierarchyController::class, 'breadcrumb']);
        Route::get('/{departmentId}/level', [DepartmentHierarchyController::class, 'level']);
        Route::put('/{departmentId}/move', [DepartmentHierarchyController::class, 'moveDepartment']);
    });

    /**
     * Reporting Structure Routes
     */
    Route::prefix('reporting')->group(function () {
        Route::get('/user/{userId}/structure', [DepartmentHierarchyController::class, 'reportingStructure']);
        Route::get('/user/{userId}/manager', [DepartmentHierarchyController::class, 'manager']);
        Route::get('/user/{userId}/subordinates', [DepartmentHierarchyController::class, 'subordinates']);
    });

    /**
     * User Statistics Routes
     */
    Route::prefix('admin/users')->group(function () {
        Route::get('/statistics', [UserStatisticsController::class, 'statistics']);
    });

    /**
     * Department Hierarchy Statistics Routes
     */
    Route::prefix('admin/departments')->group(function () {
        Route::get('/hierarchy', [DepartmentHierarchyController::class, 'hierarchy']);
    });

    /**
     * Enrollment Conflict Routes
     */
    Route::prefix('admin/enrollments')->group(function () {
        Route::get('/conflicts', [EnrollmentConflictController::class, 'conflicts']);
    });

    /**
     * Compliance Escalation Routes
     */
    Route::prefix('admin/compliance')->group(function () {
        Route::get('/escalations', [ComplianceEscalationController::class, 'escalations']);
    });

    /**
     * Audit Log Routes
     */
    Route::prefix('admin/audit')->group(function () {
        Route::get('/changes', [AuditController::class, 'changes']);
        Route::get('/user-activity/{userId}', [AuditController::class, 'userActivity']);
        Route::get('/statistics', [AuditController::class, 'statistics']);
        Route::get('/export', [AuditController::class, 'export']);
    });

    /**
     * Prediction & Dropout Risk Routes
     */
    Route::prefix('admin/predictions')->group(function () {
        Route::get('/dropout-risk', [PredictionController::class, 'dropoutRisk']);
    });

    /**
     * Certificate Management Routes
     */
    Route::prefix('admin/certificates')->group(function () {
        Route::post('/bulk-revoke', [CertificateController::class, 'bulkRevoke']);
        Route::get('/statistics', [CertificateController::class, 'statistics']);
        Route::get('/expiring-soon', [CertificateController::class, 'expiringSoon']);
        Route::get('/{id}', [CertificateController::class, 'show']);
        Route::get('/user/{userId}', [CertificateController::class, 'userCertificates']);
        Route::post('/{id}/revoke', [CertificateController::class, 'revoke']);
    });
});
