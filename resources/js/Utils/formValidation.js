/**
 * Form Validation Utilities
 * Provides reusable validation functions for common form fields
 */

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateEmail = (email) => {
    if (!email || !email.trim()) {
        return 'Email wajib diisi';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Format email tidak valid. Gunakan format: nama@domain.com';
    }
    
    return null;
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {string[]|null} Array of error messages or null if valid
 */
export const validatePassword = (password) => {
    const errors = [];
    
    if (!password) {
        return ['Password wajib diisi'];
    }
    
    if (password.length < 8) {
        errors.push('Minimal 8 karakter');
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Minimal 1 huruf besar (A-Z)');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Minimal 1 huruf kecil (a-z)');
    }
    
    if (!/[0-9]/.test(password)) {
        errors.push('Minimal 1 angka (0-9)');
    }
    
    return errors.length > 0 ? errors : null;
};

/**
 * Validate password confirmation match
 * @param {string} password - Original password
 * @param {string} confirmation - Confirmation password
 * @returns {string|null} Error message or null if valid
 */
export const validatePasswordConfirmation = (password, confirmation) => {
    if (!confirmation) {
        return 'Konfirmasi password wajib diisi';
    }
    
    if (password !== confirmation) {
        return 'Password tidak cocok';
    }
    
    return null;
};

/**
 * Validate required field
 * @param {string} value - Field value
 * @param {string} fieldName - Field name for error message
 * @returns {string|null} Error message or null if valid
 */
export const validateRequired = (value, fieldName = 'Field') => {
    if (!value || !String(value).trim()) {
        return `${fieldName} wajib diisi`;
    }
    return null;
};

/**
 * Validate minimum length
 * @param {string} value - Field value
 * @param {number} minLength - Minimum length
 * @param {string} fieldName - Field name for error message
 * @returns {string|null} Error message or null if valid
 */
export const validateMinLength = (value, minLength, fieldName = 'Field') => {
    if (value && value.length < minLength) {
        return `${fieldName} minimal ${minLength} karakter`;
    }
    return null;
};

/**
 * Validate maximum length
 * @param {string} value - Field value
 * @param {number} maxLength - Maximum length
 * @param {string} fieldName - Field name for error message
 * @returns {string|null} Error message or null if valid
 */
export const validateMaxLength = (value, maxLength, fieldName = 'Field') => {
    if (value && value.length > maxLength) {
        return `${fieldName} maksimal ${maxLength} karakter`;
    }
    return null;
};

/**
 * Validate using a schema object
 * @param {object} formData - Form data object with field values
 * @param {object} schema - Schema object with validators: { fieldName: validator, ... }
 * @returns {object|null} Error object { fieldName: errorMessage } or null if valid
 */
export const validateForm = (formData, schema) => {
    const errors = {};
    
    for (const [field, validator] of Object.entries(schema)) {
        if (typeof validator === 'function') {
            const error = validator(formData[field]);
            if (error) {
                errors[field] = error;
            }
        }
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
};

/**
 * Get password strength score (0-5)
 * @param {string} password - Password to check
 * @returns {number} Strength score 0-5
 */
export const getPasswordStrength = (password) => {
    let strength = 0;
    
    if (!password) return 0;
    
    // Length checks
    if (password.length > 5) strength += 1;
    if (password.length > 8) strength += 1;
    
    // Character type checks
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    
    // Special characters bonus
    if (/[!@#$%^&*()_\-+=\[\]{};:'",.<>?\/\\|`~]/.test(password)) {
        strength = Math.min(5, strength + 1);
    }
    
    return Math.min(strength, 5);
};

/**
 * Get password strength label
 * @param {string} password - Password to check
 * @returns {object} { score: number, label: string, color: string }
 */
export const getPasswordStrengthLabel = (password) => {
    const score = getPasswordStrength(password);
    
    const strengths = {
        0: { score: 0, label: 'Sangat Lemah', color: 'bg-red-500' },
        1: { score: 1, label: 'Lemah', color: 'bg-orange-500' },
        2: { score: 2, label: 'Sedang', color: 'bg-amber-500' },
        3: { score: 3, label: 'Baik', color: 'bg-lime-500' },
        4: { score: 4, label: 'Kuat', color: 'bg-emerald-500' },
        5: { score: 5, label: 'Sangat Kuat', color: 'bg-green-600' },
    };
    
    return strengths[score];
};

/**
 * Get password requirements status
 * @param {string} password - Password to check
 * @returns {object} Object with requirements status
 */
export const getPasswordRequirements = (password) => {
    return {
        minLength: (password.length >= 8),
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[!@#$%^&*()_\-+=\[\]{};:'",.<>?\/\\|`~]/.test(password),
    };
};
