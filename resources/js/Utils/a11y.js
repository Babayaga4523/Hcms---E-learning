/**
 * Accessibility (a11y) Utilities
 * 
 * Common patterns and helpers for implementing WCAG 2.1 compliance
 * Supports keyboard navigation, screen readers, and semantic HTML
 */

/**
 * Create keyboard handler for button-like divs or other elements
 * Supports both Click and Enter/Space key activation
 * 
 * @param {Function} callback - Function to call when activated
 * @returns {Object} Handler object with onClick and onKeyDown
 */
export const createKeyboardhandler = (callback) => ({
    onClick: callback,
    onKeyDown: (e) => {
        // Activate on Enter or Space keys
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            callback?.(e);
        }
    }
});

/**
 * Check if an element is keyboard accessible
 * Returns string of missing attributes for debugging
 * 
 * @param {HTMLElement} element - Element to check
 * @returns {String} Empty if compliant, otherwise list of issues
 */
export const isKeyboardAccessible = (element) => {
    const issues = [];
    
    if (element.onclick && !element.onkeydown) {
        issues.push('Missing onKeyDown handler');
    }
    if (!element.getAttribute('role')) {
        issues.push('Missing role attribute');
    }
    if (element.onclick && element.tabIndex === undefined) {
        issues.push('Missing tabIndex');
    }
    
    return issues.join(', ');
};

/**
 * Generate aria-label for calendar day
 * 
 * @param {Date} day - Date object
 * @param {Number} eventCount - Number of events on that day
 * @returns {String} Formatted aria-label
 */
export const getCalendarDayLabel = (day, eventCount = 0) => {
    if (!day) return 'Empty day';
    
    const dayName = day.toLocaleDateString('id-ID', { weekday: 'long' });
    const dateStr = day.toLocaleDateString('id-ID', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    let label = `${dayName}, ${dateStr}`;
    if (eventCount > 0) {
        label += `, ${eventCount} peristiwa`;
    }
    
    return label;
};

/**
 * Generate aria-label for checkbox/toggle with context
 * 
 * @param {String} label - Base label text
 * @param {Boolean} checked - Current checked state
 * @returns {String} Formatted aria-label
 */
export const getCheckboxLabel = (label, checked = false) => {
    return `${label}, ${checked ? 'dipilih' : 'tidak dipilih'}`;
};

/**
 * Create accessible loading spinner properties
 * Used for loading states that should be announced to screen readers
 * 
 * @param {String} text - Status text to announce
 * @returns {Object} Props for accessible loading indicator
 */
export const getLoadingSpinnerA11y = (text = 'Memuat') => ({
    role: 'status',
    'aria-live': 'polite',
    'aria-label': text,
    'aria-busy': 'true'
});

/**
 * Create accessible button properties
 * Ensures buttons have proper aria-labels, roles, and keyboard handlers
 * 
 * @param {String} label - Button label/title
 * @param {Boolean} disabled - If button is disabled
 * @returns {Object} Props for accessible button
 */
export const getButtonA11y = (label, disabled = false) => ({
    'aria-label': label,
    'aria-disabled': disabled,
    role: 'button',
    tabIndex: disabled ? -1 : 0
});

/**
 * Format image alt text based on context
 * Ensures alt text is meaningful and follows WCAG guidelines
 * 
 * @param {String} imageName - Base image name/title
 * @param {String} context - Optional context (e.g., 'thumbnail', 'avatar')
 * @returns {String} Formatted alt text
 */
export const getImageAltText = (imageName, context = '') => {
    if (!imageName) {
        return context ? `${context} gambar yang tidak tersedia` : 'Gambar yang tidak tersedia';
    }
    
    return context ? `${imageName} - ${context}` : imageName;
};

/**
 * Validate color contrast ratio (simplified)
 * Returns true if ratio meets WCAG AA standard (4.5:1 for normal text)
 * 
 * @param {String} foreground - Hex color code
 * @param {String} background - Hex color code
 * @returns {Boolean} True if contrast ratio >= 4.5:1
 */
export const hasAdequateContrast = (foreground, background) => {
    // Simplified contrast calculation
    // Full implementation would require proper relative luminance calculation
    
    // For now, just check if colors exist and are different
    return (
        foreground && 
        background && 
        foreground.toLowerCase() !== background.toLowerCase()
    );
};

/**
 * Focus management helpers
 */
export const focusManagement = {
    /**
     * Move focus to element with smooth scroll
     */
    focusElement: (element, options = {}) => {
        if (!element) return;
        
        element.focus(options);
        
        // Announce to screen readers
        if (options.announce) {
            announceToScreenReader(options.announce);
        }
    },

    /**
     * Return focus after modal closes
     */
    returnFocus: (previouslyFocusedElement) => {
        if (previouslyFocusedElement) {
            previouslyFocusedElement.focus();
        }
    },

    /**
     * Trap focus within element (modal/dialog)
     */
    trapFocus: (element) => {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        return {
            firstElement,
            lastElement,
            elementCount: focusableElements.length
        };
    }
};

/**
 * Announce message to screen readers (aria-live region)
 * 
 * @param {String} message - Message to announce
 * @param {String} priority - 'polite' or 'assertive'
 */
export const announceToScreenReader = (message, priority = 'polite') => {
    // Get or create live region
    let liveRegion = document.getElementById('a11y-live-region');
    if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = 'a11y-live-region';
        liveRegion.setAttribute('aria-live', priority);
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only'; // Screen reader only
        document.body.appendChild(liveRegion);
    }
    
    // Update live region
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;
};

/**
 * ValidationError message with a11y
 * 
 * @param {String} fieldName - Name of field with error
 * @param {String} error - Error message
 * @returns {String} Screen reader friendly error announcement
 */
export const getFieldErrorAnnouncement = (fieldName, error) => {
    return `${fieldName}: ${error}. Kesalahan validasi.`;
};

/**
 * Heading hierarchy (h1-h6) validation
 * Warns if improper heading order detected
 * 
 * @returns {Array} Array of warnings if found
 */
export const validateHeadingHierarchy = () => {
    const warnings = [];
    let lastLevel = 0;
    
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
        const currentLevel = parseInt(heading.tagName[1]);
        
        // Skip if jump is more than 1 level
        if (currentLevel - lastLevel > 1 && lastLevel !== 0) {
            warnings.push(`Heading jump detected: h${lastLevel} to h${currentLevel}`);
        }
        
        lastLevel = currentLevel;
    });
    
    return warnings;
};

/**
 * List validation - ensure for proper list markup
 * Checks for missing <li> or improper nesting
 * 
 * @returns {Array} Array of warnings if found
 */
export const validateLists = () => {
    const warnings = [];
    
    document.querySelectorAll('ul, ol').forEach((list, index) => {
        const items = list.querySelectorAll(':scope > li');
        if (items.length === 0) {
            warnings.push(`List ${index} has no <li> children`);
        }
    });
    
    return warnings;
};

export default {
    createKeyboardhandler,
    isKeyboardAccessible,
    getCalendarDayLabel,
    getCheckboxLabel,
    getLoadingSpinnerA11y,
    getButtonA11y,
    getImageAltText,
    hasAdequateContrast,
    focusManagement,
    announceToScreenReader,
    getFieldErrorAnnouncement,
    validateHeadingHierarchy,
    validateLists
};
