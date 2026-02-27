/**
 * API Client for Business Logic Endpoints
 * Handles all requests to the new API endpoints
 */

import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

// Auto-include CSRF token for all requests
apiClient.interceptors.request.use((config) => {
    const token = document.querySelector('meta[name="csrf-token"]')?.content;
    if (token) {
        config.headers['X-CSRF-TOKEN'] = token;
    }
    return config;
});

// Handle responses
apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        throw error;
    }
);

export const enrollmentApi = {
    /**
     * Enroll user in module
     */
    enroll: (userId, moduleId, data = {}) =>
        apiClient.post('/enrollments', { user_id: userId, module_id: moduleId, ...data }),

    /**
     * Transition enrollment state
     */
    transitionState: (enrollmentId, status, reason = null) =>
        apiClient.post(`/enrollments/${enrollmentId}/transition-state`, { status, reason }),

    /**
     * Issue certificate
     */
    issueCertificate: (enrollmentId) =>
        apiClient.post(`/enrollments/${enrollmentId}/issue-certificate`),

    /**
     * Get enrollment details
     */
    getEnrollment: (enrollmentId) =>
        apiClient.get(`/enrollments/${enrollmentId}`),

    /**
     * Get user's enrollments
     */
    getUserEnrollments: (userId) =>
        apiClient.get(`/enrollments/user/${userId}`),

    /**
     * Get module's enrollments
     */
    getModuleEnrollments: (moduleId) =>
        apiClient.get(`/enrollments/module/${moduleId}`),
};

export const complianceApi = {
    /**
     * Get compliance dashboard summary
     */
    getDashboard: () =>
        apiClient.get('/compliance/dashboard'),

    /**
     * Get non-compliant users for module
     */
    getNonCompliantUsers: (moduleId) =>
        apiClient.get(`/compliance/module/${moduleId}/non-compliant`),

    /**
     * Get at-risk users for module
     */
    getAtRiskUsers: (moduleId, daysBeforeDeadline = 7) =>
        apiClient.get(`/compliance/module/${moduleId}/at-risk`, {
            params: { days_before_deadline: daysBeforeDeadline },
        }),

    /**
     * Check single enrollment compliance
     */
    checkCompliance: (enrollmentId) =>
        apiClient.post(`/compliance/check/${enrollmentId}`),

    /**
     * Check all enrollments compliance
     */
    checkAllCompliance: () =>
        apiClient.post('/compliance/check-all'),

    /**
     * Resolve non-compliance
     */
    resolve: (enrollmentId, reason) =>
        apiClient.post(`/compliance/${enrollmentId}/resolve`, { reason }),

    /**
     * Get compliance audit logs
     */
    getAuditLogs: (enrollmentId) =>
        apiClient.get(`/compliance/${enrollmentId}/audit-logs`),
};

export const rolePermissionApi = {
    /**
     * Assign role to user
     */
    assignRole: (userId, roleId, departmentId = null, assignedBy = null) =>
        apiClient.post('/roles-permissions/assign-role', {
            user_id: userId,
            role_id: roleId,
            department_id: departmentId,
            assigned_by: assignedBy,
        }),

    /**
     * Remove role from user
     */
    removeRole: (userId, roleId) =>
        apiClient.post('/roles-permissions/remove-role', { user_id: userId, role_id: roleId }),

    /**
     * Add permission to role
     */
    addPermission: (roleId, permissionId) =>
        apiClient.post('/roles-permissions/add-permission', { role_id: roleId, permission_id: permissionId }),

    /**
     * Remove permission from role
     */
    removePermission: (roleId, permissionId) =>
        apiClient.post('/roles-permissions/remove-permission', { role_id: roleId, permission_id: permissionId }),

    /**
     * Bulk assign role
     */
    bulkAssignRole: (userIds, roleId, departmentId = null) =>
        apiClient.post('/roles-permissions/bulk-assign-role', {
            user_ids: userIds,
            role_id: roleId,
            department_id: departmentId,
        }),

    /**
     * Sync user permissions
     */
    syncPermissions: (userId) =>
        apiClient.post(`/roles-permissions/sync-permissions/${userId}`),

    /**
     * Get user roles and permissions
     */
    getUserRoles: (userId) =>
        apiClient.get(`/roles-permissions/user/${userId}`),

    /**
     * Get role sync history
     */
    getRoleSyncHistory: (roleId) =>
        apiClient.get(`/roles-permissions/role/${roleId}/sync-history`),
};

export const departmentApi = {
    /**
     * Get department hierarchy tree
     */
    getTree: () =>
        apiClient.get('/departments/tree'),

    /**
     * Get department path (breadcrumb)
     */
    getPath: (departmentId) =>
        apiClient.get(`/departments/${departmentId}/path`),

    /**
     * Get department descendants
     */
    getDescendants: (departmentId, includeSelf = false) =>
        apiClient.get(`/departments/${departmentId}/descendants`, {
            params: { include_self: includeSelf },
        }),

    /**
     * Get department ancestors
     */
    getAncestors: (departmentId, includeSelf = false) =>
        apiClient.get(`/departments/${departmentId}/ancestors`, {
            params: { include_self: includeSelf },
        }),

    /**
     * Get breadcrumb path
     */
    getBreadcrumb: (departmentId) =>
        apiClient.get(`/departments/${departmentId}/breadcrumb`),

    /**
     * Get department level
     */
    getLevel: (departmentId) =>
        apiClient.get(`/departments/${departmentId}/level`),

    /**
     * Move department to new parent
     */
    moveDepartment: (departmentId, parentId) =>
        apiClient.put(`/departments/${departmentId}/move`, { parent_id: parentId }),

    /**
     * Get user reporting structure
     */
    getReportingStructure: (userId) =>
        apiClient.get(`/reporting/user/${userId}/structure`),

    /**
     * Get user manager
     */
    getManager: (userId) =>
        apiClient.get(`/reporting/user/${userId}/manager`),

    /**
     * Get user subordinates
     */
    getSubordinates: (userId) =>
        apiClient.get(`/reporting/user/${userId}/subordinates`),
};

export default apiClient;
