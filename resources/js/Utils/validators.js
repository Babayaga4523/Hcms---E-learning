/**
 * Data Validators Utility
 * 
 * Provides comprehensive validation for API responses and data objects
 * Ensures safe access to object properties with sensible defaults
 * Prevents crashes from null/undefined/malformed data
 */

/**
 * Validates and normalizes training data
 * @param {*} training - Raw training data from API
 * @returns {Object} Validated training object with defaults
 * @throws {Error} If training data is invalid
 */
export const validateTraining = (training) => {
  if (!training) {
    throw new Error('Training data is required');
  }

  if (typeof training !== 'object') {
    throw new Error('Training must be an object');
  }

  // Parse objectives if string
  let objectives = [];
  if (training.objectives) {
    if (typeof training.objectives === 'string') {
      try {
        objectives = JSON.parse(training.objectives);
        if (!Array.isArray(objectives)) {
          objectives = [objectives];
        }
      } catch (e) {
        console.warn('Failed to parse objectives:', e);
        objectives = [];
      }
    } else if (Array.isArray(training.objectives)) {
      objectives = training.objectives;
    }
  }

  return {
    id: training.id || null,
    title: training.title || 'Untitled Training',
    description: training.description || '',
    full_description: training.full_description || '',
    category: training.category || 'General',
    status: training.status || 'not_started',
    progress: Number(training.progress) || 0,
    duration_hours: Number(training.duration_hours) || 0,
    materials_count: Number(training.materials_count) || 0,
    objectives: objectives,
    requirements: training.requirements || '',
    instructor: validateInstructor(training.instructor),
    created_at: training.created_at || null,
    updated_at: training.updated_at || null,
    enrollment_status: training.enrollment_status || null,
  };
};

/**
 * Validates instructor data
 * @param {*} instructor - Raw instructor data
 * @returns {Object|null} Validated instructor or null
 */
export const validateInstructor = (instructor) => {
  if (!instructor || typeof instructor !== 'object') {
    return null;
  }

  return {
    id: instructor.id || null,
    name: instructor.name || 'Unknown Instructor',
    title: instructor.title || 'Instructor',
    bio: instructor.bio || '',
    avatar: instructor.avatar || null,
  };
};

/**
 * Validates enrollment data
 * @param {*} enrollment - Raw enrollment data
 * @returns {Object} Validated enrollment object
 */
export const validateEnrollment = (enrollment) => {
  if (!enrollment || typeof enrollment !== 'object') {
    return {
      id: null,
      status: 'not_started',
      progress: 0,
      started_at: null,
      completed_at: null,
    };
  }

  return {
    id: enrollment.id || null,
    status: enrollment.status || 'not_started',
    progress: Number(enrollment.progress) || 0,
    started_at: enrollment.started_at || null,
    completed_at: enrollment.completed_at || null,
    enrolled_at: enrollment.enrolled_at || null,
  };
};

/**
 * Validates certificate data
 * @param {*} certificate - Raw certificate data from API
 * @returns {Object} Validated certificate object with defaults
 * @throws {Error} If certificate is not an object
 */
export const validateCertificate = (certificate) => {
  if (!certificate) {
    throw new Error('Certificate data is required');
  }

  if (typeof certificate !== 'object') {
    throw new Error('Certificate must be an object');
  }

  return {
    id: certificate.id || null,
    title: certificate.title || 'Certificate',
    user_name: certificate.user_name || 'Unknown User',
    training_title: certificate.training_title || 'Unknown Training',
    issued_at: certificate.issued_at || null,
    completed_at: certificate.completed_at || null,
    certificate_url: certificate.certificate_url || null,
    certificate_number: certificate.certificate_number || null,
    validity_period: certificate.validity_period || null,
    materials_completed: Number(certificate.materials_completed) || 0,
    score: Number(certificate.score) || 0,
  };
};

/**
 * Validates user data
 * @param {*} user - Raw user data
 * @returns {Object} Validated user object
 */
export const validateUser = (user) => {
  if (!user || typeof user !== 'object') {
    return {
      id: null,
      name: 'Unknown User',
      email: '',
      avatar: null,
    };
  }

  return {
    id: user.id || null,
    name: user.name || 'Unknown User',
    email: user.email || '',
    avatar: user.avatar || null,
    role: user.role || 'user',
  };
};

/**
 * Validates quiz/attempt data
 * @param {*} attempt - Raw quiz attempt data
 * @returns {Object} Validated attempt object
 */
export const validateQuizAttempt = (attempt) => {
  if (!attempt || typeof attempt !== 'object') {
    return {
      id: null,
      score: 0,
      status: 'pending',
      started_at: null,
      completed_at: null,
      correct_count: 0,
      total_questions: 0,
    };
  }

  return {
    id: attempt.id || null,
    score: Number(attempt.score) || 0,
    status: attempt.status || 'pending',
    started_at: attempt.started_at || null,
    completed_at: attempt.completed_at || null,
    correct_count: Number(attempt.correct_count) || 0,
    total_questions: Number(attempt.total_questions) || 0,
    attempt_number: Number(attempt.attempt_number) || 1,
  };
};

/**
 * Validates quiz result data
 * @param {*} result - Raw quiz result data
 * @returns {Object} Validated result object
 */
export const validateQuizResult = (result) => {
  if (!result || typeof result !== 'object') {
    return {
      id: null,
      correct_count: null,
      passed: false,
      score: 0,
      answers: [],
    };
  }

  return {
    id: result.id || null,
    correct_count: result.correct_count !== undefined ? Number(result.correct_count) : null,
    passed: Boolean(result.passed),
    score: Number(result.score) || 0,
    answers: Array.isArray(result.answers) ? result.answers : [],
  };
};

/**
 * Validates material/lesson data
 * @param {*} material - Raw material data
 * @returns {Object} Validated material object
 */
export const validateMaterial = (material) => {
  if (!material || typeof material !== 'object') {
    return {
      id: null,
      title: 'Untitled Material',
      type: 'unknown',
      duration: 0,
      is_completed: false,
    };
  }

  return {
    id: material.id || null,
    title: material.title || 'Untitled Material',
    type: material.type || 'unknown',
    duration: Number(material.duration) || 0,
    is_completed: Boolean(material.is_completed),
    order: Number(material.order) || 0,
    content_url: material.content_url || null,
    description: material.description || '',
  };
};

/**
 * Validates array of items with a validator function
 * @param {*} arr - Array to validate
 * @param {Function} validator - Function to validate each item
 * @returns {Array} Validated array (empty if input not array)
 */
export const validateArray = (arr, validator) => {
  if (!Array.isArray(arr)) {
    return [];
  }

  if (typeof validator !== 'function') {
    return arr;
  }

  return arr.map(item => {
    try {
      return validator(item);
    } catch (error) {
      console.warn('Error validating array item:', error);
      return validator(null);
    }
  });
};

/**
 * Safe property access with default value
 * @param {*} obj - Object to access
 * @param {string} path - Property path (dot-notation: 'user.name.first')
 * @param {*} defaultValue - Default value if property is missing
 * @returns {*} Property value or default
 */
export const getSafeValue = (obj, path, defaultValue = null) => {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }

  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }

  return value !== undefined && value !== null ? value : defaultValue;
};

/**
 * Checks if object has required properties
 * @param {*} obj - Object to check
 * @param {string[]} requiredFields - Required field names
 * @returns {boolean} True if all required fields exist and are not null
 */
export const hasRequiredFields = (obj, requiredFields = []) => {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  return requiredFields.every(field => {
    const value = obj[field];
    return value !== null && value !== undefined && value !== '';
  });
};

/**
 * Validates that value is within acceptable range
 * @param {number} value - Value to check
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @param {number} defaultValue - Default if out of range
 * @returns {number} Value if in range, else default
 */
export const validateRange = (value, min = 0, max = 100, defaultValue = 0) => {
  const num = Number(value);
  if (isNaN(num)) {
    return defaultValue;
  }
  return num >= min && num <= max ? num : defaultValue;
};

/**
 * Generic object validator with schema
 * @param {*} obj - Object to validate
 * @param {Object} schema - Schema defining expected properties and validators
 * @returns {Object} Validated object
 * 
 * Example schema:
 * {
 *   name: { type: 'string', default: 'Unknown', required: true },
 *   age: { type: 'number', default: 0, min: 0, max: 150 },
 *   email: { type: 'string', default: '', validate: email => email.includes('@') }
 * }
 */
export const validateWithSchema = (obj, schema) => {
  if (!obj || typeof obj !== 'object') {
    obj = {};
  }

  const validated = {};

  for (const [key, rules] of Object.entries(schema)) {
    let value = obj[key];
    const { type, default: defaultVal, required, min, max, validate } = rules;

    // Type validation
    if (value !== undefined && typeof value !== type) {
      console.warn(`Field "${key}" expected type "${type}" but got "${typeof value}"`);
      value = undefined;
    }

    // Required validation
    if (required && (value === undefined || value === null || value === '')) {
      if (defaultVal !== undefined) {
        value = defaultVal;
      } else {
        throw new Error(`Required field "${key}" is missing`);
      }
    }

    // Range validation for numbers
    if (type === 'number' && value !== undefined) {
      if (min !== undefined && value < min) value = min;
      if (max !== undefined && value > max) value = max;
    }

    // Custom validation
    if (validate && typeof validate === 'function' && value !== undefined) {
      try {
        if (!validate(value)) {
          console.warn(`Field "${key}" failed custom validation`);
          value = defaultVal !== undefined ? defaultVal : undefined;
        }
      } catch (error) {
        console.warn(`Custom validator for "${key}" threw:`, error);
        value = defaultVal !== undefined ? defaultVal : undefined;
      }
    }

    // Use default if still undefined
    if (value === undefined && defaultVal !== undefined) {
      value = defaultVal;
    }

    validated[key] = value;
  }

  return validated;
};

export default {
  validateTraining,
  validateInstructor,
  validateEnrollment,
  validateCertificate,
  validateUser,
  validateQuizAttempt,
  validateQuizResult,
  validateMaterial,
  validateArray,
  getSafeValue,
  hasRequiredFields,
  validateRange,
  validateWithSchema,
};
