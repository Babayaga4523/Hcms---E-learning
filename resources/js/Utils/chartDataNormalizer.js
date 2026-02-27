/**
 * Chart Data Normalizer Utility
 * 
 * Ensures chart data is valid and contains properly typed numeric fields.
 * Provides safe defaults and validation to prevent chart rendering failures.
 */

/**
 * Normalize and validate chart data
 * Ensures all numeric fields are actual numbers and handles missing/invalid data
 * 
 * @param {any} data - Raw data to normalize (should be array)
 * @param {string} type - Chart type: 'trend', 'radar', 'bar', 'activity'
 * @param {Array} defaults - Default data to return if invalid (default: [])
 * @returns {Array} Normalized data with validated numeric fields
 */
export const normalizeChartData = (data, type, defaults = []) => {
    // Return defaults if data is invalid
    if (!data || !Array.isArray(data) || data.length === 0) {
        return defaults;
    }

    try {
        return data.map(item => {
            // Create normalized item with spread of original
            const normalized = { ...item };

            // Normalize numeric fields based on chart type
            switch (type) {
                case 'trend':
                case 'score':
                    // Trend/score charts need: score, target, month/date
                    normalized.score = Number(item.score) || 0;
                    normalized.target = Number(item.target) || 0;
                    break;

                case 'radar':
                case 'skill':
                    // Radar charts need: value, subject
                    normalized.value = Number(item.value) || 0;
                    break;

                case 'bar':
                case 'activity':
                    // Bar/activity charts need: hours, count, value
                    normalized.hours = Number(item.hours) || 0;
                    normalized.count = Number(item.count) || 0;
                    normalized.value = Number(item.value) || 0;
                    break;

                case 'learning':
                    // Learning activity needs: date, hours, completion
                    normalized.hours = Number(item.hours) || 0;
                    normalized.completion = Number(item.completion) || 0;
                    normalized.completion_percentage = Number(item.completion_percentage) || 0;
                    break;

                default:
                    // Generic type - ensure common numeric fields
                    if (typeof item.value !== 'undefined') {
                        normalized.value = Number(item.value) || 0;
                    }
                    if (typeof item.count !== 'undefined') {
                        normalized.count = Number(item.count) || 0;
                    }
            }

            // Ensure required text fields have string values
            if (item.name) normalized.name = String(item.name);
            if (item.subject) normalized.subject = String(item.subject);
            if (item.label) normalized.label = String(item.label);
            if (item.month) normalized.month = String(item.month);
            if (item.date) normalized.date = String(item.date);
            if (item.title) normalized.title = String(item.title);

            return normalized;
        });
    } catch (error) {
        console.error('[ChartDataNormalizer] Error normalizing data:', error);
        return defaults;
    }
};

/**
 * Validate if chart data is safe to render
 * Checks for non-empty array with valid structure
 * 
 * @param {any} data - Data to validate
 * @returns {boolean} true if data is valid for rendering
 */
export const isChartDataValid = (data) => {
    return Array.isArray(data) && data.length > 0 && data.some(item => item !== null && item !== undefined);
};

/**
 * Get safe numeric value from object field
 * Returns default if field is missing, null, undefined, or non-numeric
 * 
 * @param {Object} obj - Object to extract value from
 * @param {string} field - Field name to extract
 * @param {number} defaultValue - Value to return if invalid (default: 0)
 * @returns {number} Safe numeric value
 */
export const getSafeNumericValue = (obj, field, defaultValue = 0) => {
    if (!obj || typeof obj !== 'object') return defaultValue;

    const value = obj[field];

    // Handle null and undefined
    if (value === null || value === undefined) return defaultValue;

    // Convert to number
    const num = Number(value);

    // Return number if valid, otherwise default
    return isNaN(num) ? defaultValue : num;
};

/**
 * Get safe string value from object field
 * Returns default if field is missing or non-string
 * 
 * @param {Object} obj - Object to extract value from
 * @param {string} field - Field name to extract
 * @param {string} defaultValue - Value to return if invalid (default: '')
 * @returns {string} Safe string value
 */
export const getSafeStringValue = (obj, field, defaultValue = '') => {
    if (!obj || typeof obj !== 'object') return defaultValue;

    const value = obj[field];

    // Return string if valid, otherwise default
    return typeof value === 'string' && value.length > 0 ? value : defaultValue;
};

/**
 * Validate chart data array for Recharts compatibility
 * Ensures all required fields are present and properly typed
 * 
 * @param {Array} data - Data array to validate
 * @param {Array<string>} requiredFields - Required field names
 * @returns {Array} Filtered array with only valid items
 */
export const validateChartDataStructure = (data, requiredFields = []) => {
    if (!Array.isArray(data)) return [];

    return data.filter(item => {
        // Each item must be a non-null object
        if (!item || typeof item !== 'object') return false;

        // Check all required fields exist and are non-empty
        return requiredFields.every(field => {
            return field in item && item[field] !== null && item[field] !== undefined;
        });
    });
};

/**
 * Sanitize chart data for display
 * Ensures data won't break chart rendering
 * 
 * @param {any} data - Data to sanitize
 * @param {string} type - Chart type
 * @returns {Object} Sanitized data object with status
 */
export const sanitizeChartData = (data, type) => {
    return {
        isValid: isChartDataValid(data),
        data: isChartDataValid(data) ? normalizeChartData(data, type) : [],
        type: type,
        dataCount: Array.isArray(data) ? data.length : 0,
    };
};

/**
 * Create empty state message based on data type
 * 
 * @param {string} type - Chart type
 * @returns {string} Appropriate empty state message
 */
export const getEmptyStateMessage = (type) => {
    const messages = {
        trend: 'Belum ada data tren skor',
        score: 'Belum ada data skor',
        radar: 'Belum ada data kompetensi skill',
        skill: 'Belum ada data skill assessment',
        bar: 'Belum ada data aktivitas',
        activity: 'Belum ada data aktivitas pembelajaran',
        learning: 'Belum ada data pembelajaran',
        default: 'Data tidak tersedia untuk grafik ini'
    };

    return messages[type] || messages.default;
};

export default {
    normalizeChartData,
    isChartDataValid,
    getSafeNumericValue,
    getSafeStringValue,
    validateChartDataStructure,
    sanitizeChartData,
    getEmptyStateMessage,
};
