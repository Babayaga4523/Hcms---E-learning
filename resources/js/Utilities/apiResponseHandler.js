/**
 * API Response Handler Utility
 * 
 * Standardizes inconsistent API response structures across the backend.
 * Handles multiple response formats and extracts the data array safely.
 * 
 * Supported Formats:
 * - Direct array: [...]
 * - Wrapped format: { data: [...] }
 * - Legacy formats: { trainings: [...], users: [...], notifications: [...] }
 * - Paginated: { data: [...], meta: { last_page, total, ... } }
 */

/**
 * Extracts data from inconsistent API response structures
 * @param {*} response - API response (array, object, or nested structure)
 * @param {*} defaultValue - Value to return if extraction fails (default: [])
 * @returns {Array} Extracted data array
 * 
 * @example
 * // Backend returns: { data: [...] }
 * const trainings = extractData(response.data);
 * 
 * @example
 * // Backend returns: { trainings: [...] }
 * const trainings = extractData(response.data);
 * 
 * @example
 * // Backend returns direct array: [...]
 * const trainings = extractData(response.data);
 */
export const extractData = (response, defaultValue = []) => {
  // If response is already an array, return it
  if (Array.isArray(response)) {
    return response;
  }

  // If response is not an object, return default
  if (!response || typeof response !== 'object') {
    return defaultValue;
  }

  // Check multiple possible data keys (in order of precedence)
  // Most common format first
  if (response.data && Array.isArray(response.data)) {
    return response.data;
  }

  // Handle paginated responses: { trainings: { data: [...], current_page, total, ... } }
  if (response.trainings && typeof response.trainings === 'object' && Array.isArray(response.trainings.data)) {
    return response.trainings.data;
  }

  if (response.users && typeof response.users === 'object' && Array.isArray(response.users.data)) {
    return response.users.data;
  }

  if (response.materials && typeof response.materials === 'object' && Array.isArray(response.materials.data)) {
    return response.materials.data;
  }

  if (response.programs && typeof response.programs === 'object' && Array.isArray(response.programs.data)) {
    return response.programs.data;
  }

  // Legacy format keys (direct arrays)
  if (response.trainings && Array.isArray(response.trainings)) {
    return response.trainings;
  }

  if (response.users && Array.isArray(response.users)) {
    return response.users;
  }

  if (response.notifications && Array.isArray(response.notifications)) {
    return response.notifications;
  }

  if (response.materials && Array.isArray(response.materials)) {
    return response.materials;
  }

  if (response.programs && Array.isArray(response.programs)) {
    return response.programs;
  }

  if (response.items && Array.isArray(response.items)) {
    return response.items;
  }

  // Default fallback
  return defaultValue;
};

/**
 * Extracts pagination metadata from API response
 * @param {Object} response - API response object
 * @returns {Object} Pagination metadata { totalPages, total, currentPage, perPage, hasMore }
 * 
 * @example
 * const meta = extractMeta(response.data);
 * console.log(meta.totalPages); // 5
 */
export const extractMeta = (response) => {
  if (!response || typeof response !== 'object') {
    return {
      totalPages: 1,
      total: 0,
      currentPage: 1,
      perPage: 20,
      hasMore: false,
    };
  }

  const meta = response.meta || response.pagination || {};

  return {
    totalPages: meta.last_page || meta.total_pages || 1,
    total: meta.total || 0,
    currentPage: meta.current_page || meta.from || 1,
    perPage: meta.per_page || meta.to || 20,
    hasMore: (meta.last_page || 1) > (meta.current_page || 1),
  };
};

/**
 * Safe response format helper - useful for debugging
 * @param {*} response - API response to format
 * @returns {Object} Formatted response info
 */
export const formatResponseInfo = (response) => {
  if (!response) return { type: 'null', value: null };

  if (Array.isArray(response)) {
    return { type: 'array', length: response.length, value: response };
  }

  if (typeof response !== 'object') {
    return { type: typeof response, value: response };
  }

  const keys = Object.keys(response);
  return { type: 'object', keys, value: response };
};

/**
 * Validates if response contains data
 * @param {*} response - API response to validate
 * @returns {boolean} True if response has extractable data
 */
export const hasData = (response) => {
  const data = extractData(response);
  return Array.isArray(data) && data.length > 0;
};

export default {
  extractData,
  extractMeta,
  formatResponseInfo,
  hasData,
};
