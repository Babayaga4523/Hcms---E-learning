/**
 * Authentication Error Guard Utility
 * 
 * Handles 401 Unauthorized responses consistently across all API calls.
 * Provides graceful logout/redirect when authentication fails.
 */

import showToast from '@/Utils/toast';

/**
 * Check if error is a 401 Unauthorized response
 * @param {Error} error - Axios or fetch error
 * @returns {boolean} True if error is 401 status
 */
export const is401Error = (error) => {
  // Axios error format
  if (error?.response?.status === 401) {
    return true;
  }
  
  // Fetch error format (need to check status separately)
  if (error?.status === 401) {
    return true;
  }
  
  return false;
};

/**
 * Check if error is a 403 Forbidden response
 * @param {Error} error - Axios or fetch error
 * @returns {boolean} True if error is 403 status
 */
export const is403Error = (error) => {
  if (error?.response?.status === 403) {
    return true;
  }
  
  if (error?.status === 403) {
    return true;
  }
  
  return false;
};

/**
 * Handle authentication errors (401) gracefully
 * Clears session data and redirects to login with toast notification
 * 
 * @param {Error} error - The error object from axios/fetch
 * @param {string} redirectUrl - URL to redirect to (default: /login)
 * @param {boolean} showNotification - Whether to show toast notification (default: true)
 * @returns {boolean} True if error was handled (401), false otherwise
 * 
 * @example
 * try {
 *   const response = await axios.get('/api/user/data');
 *   setData(response.data);
 * } catch (error) {
 *   if (handleAuthError(error)) return;
 *   // Handle other errors
 *   showToast('Failed to load data', 'error');
 * }
 */
export const handleAuthError = (error, redirectUrl = '/login', showNotification = true) => {
  if (!is401Error(error)) {
    return false;
  }

  // Show notification to user
  if (showNotification) {
    showToast(
      'Sesi Anda telah berakhir. Silakan login kembali.',
      'warning',
      'top-right'
    );
  }

  // Clear any cached authentication data
  try {
    // Clear browser storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Optional: You could clear specific items instead
    // localStorage.removeItem('authToken');
    // localStorage.removeItem('userPreferences');
  } catch (storageError) {
    console.error('Error clearing storage:', storageError);
  }

  // Redirect to login after a small delay to allow toast to show
  setTimeout(() => {
    window.location.href = redirectUrl;
  }, 800);

  return true;
};

/**
 * Handle authorization errors (403) gracefully
 * Shows error message and optionally redirects
 * 
 * @param {Error} error - The error object
 * @param {string} customMessage - Custom error message
 * @returns {boolean} True if error was handled (403), false otherwise
 */
export const handleAuthorizationError = (error, customMessage = 'Anda tidak memiliki akses ke halaman ini') => {
  if (!is403Error(error)) {
    return false;
  }

  const message = error?.response?.data?.message || customMessage;
  showToast(message, 'error');

  return true;
};

/**
 * Handle 404 Not Found errors
 * @param {Error} error - The error object
 * @returns {boolean} True if error is 404, false otherwise
 */
export const is404Error = (error) => {
  return error?.response?.status === 404 || error?.status === 404;
};

/**
 * Get standard error message based on HTTP status code
 * @param {Error} error - The error object
 * @param {string} defaultMessage - Fallback message
 * @returns {string} Human-readable error message
 */
export const getAuthErrorMessage = (error, defaultMessage = 'Terjadi kesalahan saat mengakses data') => {
  const status = error?.response?.status || error?.status;
  const serverMsg = error?.response?.data?.message;

  if (status === 401) {
    return 'Sesi Anda telah berakhir. Silakan login kembali.';
  }

  if (status === 403) {
    return 'Anda tidak memiliki akses ke halaman ini.';
  }

  if (status === 404) {
    return 'Data tidak ditemukan.';
  }

  if (status === 500) {
    return 'Terjadi kesalahan pada server. Silakan coba lagi nanti.';
  }

  if (status === 503) {
    return 'Server sedang dalam maintenance. Silakan coba lagi nanti.';
  }

  // Network errors
  if (error?.code === 'ERR_NETWORK') {
    return 'Koneksi internet terputus.';
  }

  if (error?.code === 'ECONNABORTED') {
    return 'Permintaan timeout. Silakan coba lagi.';
  }

  // Return server message if available
  if (serverMsg) {
    return serverMsg;
  }

  return defaultMessage;
};

/**
 * Check if error is retryable (transient network error)
 * @param {Error} error - The error object
 * @returns {boolean} True if error can be retried
 */
export const isRetryableError = (error) => {
  const status = error?.response?.status;
  const code = error?.code;

  // Network errors are retryable
  if (code === 'ERR_NETWORK' || code === 'ECONNABORTED') {
    return true;
  }

  // Server errors (5xx) are retryable
  if (status && status >= 500) {
    return true;
  }

  // Too Many Requests
  if (status === 429) {
    return true;
  }

  return false;
};

/**
 * Wrap an async function with auth error handling
 * @param {Function} asyncFn - Async function to wrap
 * @param {string} errorToastMessage - Message to show on non-401 errors
 * @returns {Function} Wrapped function
 * 
 * @example
 * const safeLoadData = withAuthGuard(loadData, 'Failed to load data');
 */
export const withAuthGuard = (asyncFn, errorToastMessage = 'Operasi gagal') => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      // Handle 401 silently (it will redirect)
      if (handleAuthError(error)) {
        throw error;
      }

      // Show error message for other failures
      const message = getAuthErrorMessage(error, errorToastMessage);
      showToast(message, 'error');

      throw error;
    }
  };
};

export default {
  is401Error,
  is403Error,
  is404Error,
  handleAuthError,
  handleAuthorizationError,
  getAuthErrorMessage,
  isRetryableError,
  withAuthGuard,
};
