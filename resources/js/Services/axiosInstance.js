/**
 * Axios Instance with Interceptors
 * Centralized HTTP client with error handling, auth, and retry logic
 */

import axios from 'axios';
import { API_BASE, AXIOS_CONFIG } from '@/Config/api';
import { handleAuthError } from '@/Utils/authGuard';

// Create axios instance with base configuration
const axiosInstance = axios.create(AXIOS_CONFIG);

// ==================== Request Interceptors ====================

/**
 * Request interceptor to add headers and auth tokens
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // Add CSRF token if available (Laravel)
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    if (csrfToken) {
      config.headers['X-CSRF-TOKEN'] = csrfToken;
    }

    // Add auth header if token exists
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add request ID for tracking
    config.headers['X-Request-ID'] = generateRequestId();

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==================== Response Interceptors ====================

/**
 * Response interceptor to handle errors and retry logic
 */
axiosInstance.interceptors.response.use(
  (response) => {
    // Success - just return data
    return response;
  },
  async (error) => {
    const config = error.config;

    // Handle 401 Unauthorized (auth expired/invalid)
    if (error.response?.status === 401) {
      const didRedirect = handleAuthError(error, '/login');
      if (didRedirect) {
        return Promise.reject(error);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('[API] Access forbidden:', error.config.url);
      return Promise.reject(error);
    }

    // Retry logic for transient failures (5xx, network errors)
    if (shouldRetry(error) && !config.__retryAttempt) {
      config.__retryAttempt = 1;

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, config.__retryAttempt - 1) * 1000;

      console.warn(
        `[API] Request failed, retrying in ${delay}ms:`,
        config.url,
        error.message
      );

      // Wait then retry
      await new Promise((resolve) => setTimeout(resolve, delay));
      return axiosInstance(config);
    }

    // Max retries exceeded or non-retryable error
    console.error('[API] Request failed:', {
      url: config.url,
      method: config.method,
      status: error.response?.status,
      message: error.message,
    });

    return Promise.reject(error);
  }
);

// ==================== Helper Functions ====================

/**
 * Determine if error is retryable
 * @param {Error} error - Axios error object
 * @returns {boolean}
 */
function shouldRetry(error) {
  // Retry on network errors
  if (!error.response) {
    return true;
  }

  const status = error.response.status;

  // Retry on 5xx server errors and 408/429 (timeout/rate limit)
  return status >= 500 || status === 408 || status === 429;
}

/**
 * Generate unique request ID for tracking
 * @returns {string}
 */
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current API base URL
 * Useful for redirects, links, etc.
 * @returns {string}
 */
export const getApiBase = () => API_BASE;

/**
 * Check if API is reachable
 * @returns {Promise<boolean>}
 */
export const checkApiHealth = async () => {
  try {
    const response = await axiosInstance.get('/health', {
      timeout: 5000, // Short timeout for health check
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

/**
 * Manually set auth token (if needed)
 * @param {string} token - Auth token
 */
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('auth_token', token);
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('auth_token');
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

/**
 * Manually clear auth (logout)
 */
export const clearAuth = () => {
  setAuthToken(null);
};

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('[Axios] Configured with base:', API_BASE);
}

export default axiosInstance;
