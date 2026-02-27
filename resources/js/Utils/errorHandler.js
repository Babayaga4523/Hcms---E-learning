/**
 * Error Handler Utility
 * Provides consistent error message mapping and retry logic
 * Maps various error types (network, validation, server) to user-friendly messages
 */

/**
 * Convert error object to user-friendly message
 * Handles HTTP status codes, network errors, validation errors, etc.
 * 
 * @param {Error|Object} error - Error object from axios, fetch, or custom error
 * @returns {string} - User-friendly error message in Indonesian/English
 */
export const getErrorMessage = (error) => {
  if (!error) {
    return 'Terjadi kesalahan yang tidak diketahui';
  }

  // Extract status code and server message
  const status = error?.response?.status;
  const serverMsg = error?.response?.data?.message;
  const errorCode = error?.code;

  // ==================== HTTP Status Code Errors ====================
  
  // 400 Bad Request - Invalid input data
  if (status === 400) {
    return serverMsg || 'Input data tidak valid. Silakan periksa kembali.';
  }

  // 401 Unauthorized - Auth expired or invalid
  if (status === 401) {
    return 'Session expired. Silakan login kembali.';
  }

  // 403 Forbidden - No access permission
  if (status === 403) {
    return 'Anda tidak memiliki akses ke resource ini.';
  }

  // 404 Not Found - Resource doesn't exist
  if (status === 404) {
    return serverMsg || 'Data tidak ditemukan. Resource mungkin telah dihapus.';
  }

  // 429 Too Many Requests - Rate limited
  if (status === 429) {
    return 'Terlalu banyak request. Silakan coba lagi dalam beberapa saat.';
  }

  // 500 Server Error - Internal server error
  if (status === 500) {
    return serverMsg || 'Server error. Tim support sedang menginvestigasi masalah ini.';
  }

  // 503 Service Unavailable - Maintenance or overloaded
  if (status === 503) {
    return 'Server sedang maintenance atau overloaded. Coba lagi dalam beberapa menit.';
  }

  // 5xx Server Errors - Any other 5xx error
  if (status >= 500) {
    return serverMsg || `Server error (${status}). Silakan coba lagi nanti.`;
  }

  // ==================== Network/Connection Errors ====================

  // Network is down - no internet
  if (errorCode === 'ERR_NETWORK') {
    return 'Koneksi internet terputus. Silakan periksa koneksi Anda.';
  }

  // Request timeout - server not responding
  if (errorCode === 'ECONNABORTED') {
    return 'Request timeout. Server tidak merespons dalam waktu yang ditentukan.';
  }

  // Connection refused - server not available
  if (errorCode === 'ECONNREFUSED') {
    return 'Tidak dapat terhubung ke server. Pastikan server sedang berjalan.';
  }

  // ==================== Validation/Client Errors ====================

  // Validation error from request interceptor
  if (error?.isValidationError) {
    return error.message || 'Data tidak valid. Silakan periksa input Anda.';
  }

  // ==================== Fallback ====================

  // Use server message if available
  if (serverMsg) {
    return serverMsg;
  }

  // Use error message if available
  if (error.message) {
    return error.message;
  }

  // Last resort
  return 'Gagal memproses request. Silakan coba lagi.';
};

/**
 * Determine if an error is retryable
 * Network errors and 5xx server errors are retryable
 * 4xx and 401/403 are not retryable (user/validation issue)
 * 
 * @param {Error|Object} error - Error object
 * @returns {boolean} - Whether the error can be retried
 */
export const isRetryableError = (error) => {
  if (!error) {
    return false;
  }

  const status = error?.response?.status;
  const code = error?.code;

  // Network errors are retryable
  if (code === 'ERR_NETWORK' || code === 'ECONNABORTED' || code === 'ECONNREFUSED') {
    return true;
  }

  // 5xx server errors are retryable
  if (status >= 500) {
    return true;
  }

  // 429 Too Many Requests is retryable (rate limit)
  if (status === 429) {
    return true;
  }

  // 4xx client errors are NOT retryable (user's fault)
  if (status >= 400 && status < 500) {
    return false;
  }

  // No response at all is retryable (network issue)
  if (!status) {
    return true;
  }

  return false;
};

/**
 * Get retry delay in milliseconds using exponential backoff
 * 1st retry: 1s (2^0 * 1000)
 * 2nd retry: 2s (2^1 * 1000)
 * 3rd retry: 4s (2^2 * 1000)
 * 4th retry: 8s (2^3 * 1000)
 * 
 * @param {number} retryCount - Current retry attempt (0-based)
 * @param {number} maxDelay - Maximum delay in milliseconds (default: 32000)
 * @returns {number} - Delay in milliseconds
 */
export const getRetryDelay = (retryCount = 0, maxDelay = 32000) => {
  const delay = Math.pow(2, retryCount) * 1000;
  return Math.min(delay, maxDelay);
};

/**
 * Get max retry count based on error type
 * Network errors: allow more retries (3-5)
 * Server errors: allow fewer retries (2-3)
 * 
 * @param {Error|Object} error - Error object
 * @returns {number} - Maximum retry count
 */
export const getMaxRetries = (error) => {
  if (!error) {
    return 0;
  }

  const code = error?.code;
  const status = error?.response?.status;

  // Network errors - more likely to be temporary
  if (code === 'ERR_NETWORK' || code === 'ECONNABORTED') {
    return 5;
  }

  // Connection refused - retry more times
  if (code === 'ECONNREFUSED') {
    return 4;
  }

  // Service unavailable (503) - allow more retries
  if (status === 503) {
    return 4;
  }

  // Rate limited (429) - allow some retries
  if (status === 429) {
    return 3;
  }

  // 5xx errors - allow some retries
  if (status >= 500) {
    return 2;
  }

  return 0;
};

/**
 * Check if user action is needed to resolve error
 * 401 = login, 403 = permission, 404 = resource gone, etc.
 * 
 * @param {Error|Object} error - Error object
 * @returns {boolean} - Whether error requires user action
 */
export const requiresUserAction = (error) => {
  const status = error?.response?.status;

  // 401 = Re-authenticate (login)
  // 403 = Permission issue (contact admin)
  // 404 = Resource doesn't exist (user made wrong request)
  // 400 = Validation error (user needs to fix input)
  return [400, 401, 403, 404].includes(status);
};

/**
 * Get user action label for errors that require action
 * 
 * @param {Error|Object} error - Error object
 * @returns {string|null} - Action label or null if no action needed
 */
export const getUserAction = (error) => {
  const status = error?.response?.status;

  if (status === 401) {
    return 'Login';
  }

  if (status === 403) {
    return 'Contact Admin';
  }

  if (status === 404) {
    return 'Go Back';
  }

  if (status === 400) {
    return 'Review Form';
  }

  return null;
};

/**
 * Format error for logging/debugging
 * Includes status code, message, error code, and context
 * 
 * @param {Error|Object} error - Error object
 * @param {string} context - Where error occurred (e.g., 'fetchTrainings')
 * @returns {Object} - Formatted error object for logging
 */
export const formatErrorForLogging = (error, context = 'unknown') => {
  return {
    context,
    timestamp: new Date().toISOString(),
    status: error?.response?.status,
    code: error?.code,
    message: error?.message,
    userMessage: getErrorMessage(error),
    isRetryable: isRetryableError(error),
    requiresAction: requiresUserAction(error),
    url: error?.config?.url,
    method: error?.config?.method,
  };
};

/**
 * Logger for API errors with different severity levels
 * 
 * @param {Error|Object} error - Error object
 * @param {string} context - Where error occurred
 * @param {string} level - Log level: 'error', 'warn', 'info'
 */
export const logError = (error, context = 'unknown', level = 'error') => {
  const formatted = formatErrorForLogging(error, context);

  if (import.meta.env.DEV) {
    const logFn = console[level] || console.error;
    logFn(`[${context}]`, formatted);
  }

  // In production, could send to error tracking service
  // e.g., Sentry.captureException(error, { tags: { context } });
};

/**
 * Export all utilities as object for convenient import
 */
export const ErrorHandler = {
  getErrorMessage,
  isRetryableError,
  getRetryDelay,
  getMaxRetries,
  requiresUserAction,
  getUserAction,
  formatErrorForLogging,
  logError,
};

export default ErrorHandler;
