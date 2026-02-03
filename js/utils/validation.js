/**
 * Validation Utilities Module
 * Provides comprehensive input validation functions
 * @module utils/validation
 */

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Validate number is within range
 * @param {number} value - Number to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {boolean} True if number is within range
 */
function validateNumberRange(value, min, max) {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return false;
  }
  return num >= min && num <= max;
}

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {number} maxLength - Maximum allowed length
 * @param {number} minLength - Minimum allowed length (default: 0)
 * @returns {boolean} True if string length is valid
 */
function validateStringLength(str, maxLength, minLength = 0) {
  if (typeof str !== 'string') {
    return false;
  }
  const length = str.trim().length;
  return length >= minLength && length <= maxLength;
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid date format
 */
function validateDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * Validate required field is not empty
 * @param {any} value - Value to validate
 * @returns {boolean} True if value is not empty
 */
function validateRequired(value) {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return true;
}

/**
 * Validate weight percentage (0-100)
 * @param {number} weight - Weight value to validate
 * @returns {boolean} True if weight is valid (0-100)
 */
function validateWeight(weight) {
  return validateNumberRange(weight, 0, 100);
}

/**
 * Validate total weights sum to 100
 * @param {Array<number>} weights - Array of weight values
 * @returns {boolean} True if weights sum to 100
 */
function validateWeightsSum(weights) {
  if (!Array.isArray(weights) || weights.length === 0) {
    return false;
  }
  const sum = weights.reduce((acc, w) => acc + parseFloat(w || 0), 0);
  return Math.abs(sum - 100) < 0.01; // Allow for floating point precision
}

/**
 * Sanitize HTML input to prevent XSS attacks
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Validate form field and show error message
 * @param {HTMLInputElement} field - Form field element
 * @param {Function} validationFn - Validation function
 * @param {string} errorMessage - Error message to display
 * @returns {boolean} True if valid
 */
function validateField(field, validationFn, errorMessage) {
  const isValid = validationFn(field.value);
  
  if (!isValid) {
    field.classList.add('invalid');
    field.setAttribute('aria-invalid', 'true');
    
    // Show error message
    let errorEl = field.nextElementSibling;
    if (!errorEl || !errorEl.classList.contains('error-message')) {
      errorEl = document.createElement('span');
      errorEl.className = 'error-message';
      errorEl.style.color = 'red';
      errorEl.style.fontSize = '0.85em';
      errorEl.style.display = 'block';
      errorEl.style.marginTop = '4px';
      field.parentNode.insertBefore(errorEl, field.nextSibling);
    }
    errorEl.textContent = errorMessage;
  } else {
    field.classList.remove('invalid');
    field.removeAttribute('aria-invalid');
    
    // Remove error message
    const errorEl = field.nextElementSibling;
    if (errorEl && errorEl.classList.contains('error-message')) {
      errorEl.remove();
    }
  }
  
  return isValid;
}

/**
 * Clear all validation errors from a form
 * @param {HTMLFormElement} form - Form element
 */
function clearValidationErrors(form) {
  const invalidFields = form.querySelectorAll('.invalid');
  invalidFields.forEach(field => {
    field.classList.remove('invalid');
    field.removeAttribute('aria-invalid');
  });
  
  const errorMessages = form.querySelectorAll('.error-message');
  errorMessages.forEach(msg => msg.remove());
}

// Make validation functions available globally
if (typeof window !== 'undefined') {
  window.validateEmail = validateEmail;
  window.validateNumberRange = validateNumberRange;
  window.validateStringLength = validateStringLength;
  window.validateDate = validateDate;
  window.validateRequired = validateRequired;
  window.validateWeight = validateWeight;
  window.validateWeightsSum = validateWeightsSum;
  window.sanitizeInput = sanitizeInput;
  window.validateField = validateField;
  window.clearValidationErrors = clearValidationErrors;
}
