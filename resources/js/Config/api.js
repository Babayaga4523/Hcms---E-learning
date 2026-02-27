/**
 * API Configuration
 * Centralized endpoint management with environment variable support
 * 
 * Environment Variables:
 * - VITE_API_BASE: Base URL for API endpoints (default: '/api')
 * - Usage: import.meta.env.VITE_API_BASE
 */

// Base API URL from environment or default to '/api'
export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

/**
 * Centralized API endpoints
 * All backend API endpoints should be defined here for:
 * - Single source of truth
 * - Easy migration to different API base
 * - Testing with mock servers
 * - Clear visibility of required endpoints
 */
export const API_ENDPOINTS = {
  // ==================== Authentication ====================
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh',
  USER_PROFILE: '/user/profile',

  // ==================== Trainings ====================
  USER_TRAININGS: '/user/trainings',
  USER_TRAINING_DETAIL: (trainingId) => `/user/trainings/${trainingId}`,
  TRAINING_MATERIALS: (trainingId) => `/training/${trainingId}/materials`,
  TRAINING_MATERIAL: (trainingId, materialId) => `/training/${trainingId}/materials/${materialId}`,
  
  // ==================== Training Schedules ====================
  USER_SCHEDULES: '/user/training-schedules',
  USER_SCHEDULE_DETAIL: (scheduleId) => `/user/training-schedules/${scheduleId}`,

  // ==================== Training Catalog ====================
  CATALOG: '/user/catalog',
  CATALOG_SEARCH: '/user/catalog/search',
  TRAINING_ENROLL: (trainingId) => `/trainings/${trainingId}/enroll`,
  TRAINING_START: (trainingId) => `/training/${trainingId}/start`,

  // ==================== Recent Activity ====================
  USER_ACTIVITY: '/user/recent-activity',
  USER_ACTIVITY_DETAIL: (activityId) => `/user/recent-activity/${activityId}`,

  // ==================== Dashboard ====================
  DASHBOARD_STATS: '/dashboard/statistics',
  DASHBOARD_ANNOUNCEMENTS: '/dashboard/announcements',
  DASHBOARD_RECOMMENDATIONS: '/user/training-recommendations',
  DASHBOARD_UNIFIED_UPDATES: '/dashboard/unified-updates',

  // ==================== Quiz ====================
  QUIZ_START: (trainingId, quizType) => `/training/${trainingId}/quiz/${quizType}/start`,
  QUIZ_SUBMIT: (examAttemptId) => `/quiz/${examAttemptId}/submit`,
  QUIZ_RESULT: (attemptId) => `/quiz/result/${attemptId}`,
  QUIZ_RETAKE: (examAttemptId) => `/quiz/${examAttemptId}/retake`,

  // ==================== Materials ====================
  MATERIAL_MARK_COMPLETE: (trainingId, materialId) => `/training/${trainingId}/material/${materialId}/complete`,
  MATERIAL_CONTENT: (trainingId, materialId) => `/training/${trainingId}/material/${materialId}`,

  // ==================== Certificates ====================
  USER_CERTIFICATES: '/user/certificates',
  CERTIFICATE_DETAIL: (certId) => `/certificates/${certId}`,
  CERTIFICATE_DOWNLOAD: (certId) => `/certificates/${certId}/download`,
  CERTIFICATE_VERIFY: (certId) => `/certificates/${certId}/verify`,

  // ==================== Notifications ====================
  NOTIFICATIONS: '/user/notifications',
  NOTIFICATIONS_READ: (notificationId) => `/user/notifications/${notificationId}/read`,
  NOTIFICATIONS_BULK_READ: '/user/notifications/bulk-read',
  NOTIFICATIONS_DELETE: (notificationId) => `/user/notifications/${notificationId}`,
  NOTIFICATIONS_BULK_DELETE: '/user/notifications/bulk-delete',
  NOTIFICATIONS_MARK_ALL_READ: '/user/notifications/mark-all-read',

  // ==================== Reports ====================
  USER_REPORTS: '/user/reports',
  LEARNER_PERFORMANCE: '/learner/performance',
  LEARNER_ANALYTICS: '/learner/analytics',
  EXPORT_REPORT_PDF: '/reports/export-pdf',
  EXPORT_REPORT_EXCEL: '/reports/export-excel',

  // ==================== Goals ====================
  USER_GOALS: '/user/goals',
  GOAL_DETAIL: (goalId) => `/goals/${goalId}`,
  GOAL_CREATE: '/goals',
  GOAL_UPDATE: (goalId) => `/goals/${goalId}`,
  GOAL_DELETE: (goalId) => `/goals/${goalId}`,
  GOAL_PROGRESS: (goalId) => `/goals/${goalId}/progress`,

  // ==================== Profile ====================
  PROFILE_UPDATE: '/user/profile/update',
  PASSWORD_CHANGE: '/user/password/change',
  AVATAR_UPLOAD: '/user/avatar/upload',

  // ==================== System ====================
  HEALTH_CHECK: '/health',
  VERSION: '/version',
};

/**
 * Get full API URL for a given endpoint
 * @param {string} endpoint - API endpoint from API_ENDPOINTS
 * @returns {string} - Full API URL
 */
export const getApiUrl = (endpoint) => {
  return `${API_BASE}${endpoint}`;
};

/**
 * Default axios configuration
 */
export const AXIOS_CONFIG = {
  baseURL: API_BASE,
  timeout: import.meta.env.VITE_API_TIMEOUT || 30000,
  withCredentials: true, // Include cookies in cross-origin requests
};

/**
 * API Configuration summary (for debugging)
 */
export const getApiConfig = () => ({
  baseURL: API_BASE,
  timeout: AXIOS_CONFIG.timeout,
  environment: import.meta.env.MODE,
  nodes: Object.keys(API_ENDPOINTS).length,
});

/**
 * Log API configuration for debugging
 */
export const logApiConfig = () => {
  if (import.meta.env.DEV) {
    console.log('[API Config]', getApiConfig());
  }
};
