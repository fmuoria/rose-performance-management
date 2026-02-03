/**
 * API Communication Module
 * Handles all API calls to Google Apps Script backend
 * Includes error handling and retry logic
 * @module core/api
 */

// Dependencies: Requires CONFIG from core/config.js

/**
 * Helper function to build API URLs safely with URLSearchParams
 * @param {string} baseUrl - Base API URL
 * @param {Object} params - URL parameters as key-value pairs
 * @returns {string} Complete URL with query parameters
 */
function buildApiUrl(baseUrl, params) {
  const urlParams = new URLSearchParams(params);
  return baseUrl + '?' + urlParams.toString();
}

/**
 * Standard error handling wrapper with retry logic
 * @param {Function} fn - Async function to execute
 * @param {string} errorMessage - User-friendly error message
 * @param {number} retries - Number of retry attempts (default: 2)
 * @returns {Promise<any>}
 * @throws {Error} If all retry attempts fail
 */
async function withErrorHandling(fn, errorMessage, retries = 2) {
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.error(`${errorMessage} (Attempt ${attempt + 1}/${retries + 1}):`, error);
      
      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  // All attempts failed
  if (typeof showToast === 'function') {
    showToast(errorMessage, 'error');
  }
  throw lastError;
}

/**
 * Execute JSONP API call (for Google Apps Script)
 * @param {string} url - Complete URL with callback parameter
 * @param {string} callbackName - Name of the callback function
 * @param {number} timeout - Timeout in milliseconds (default: 30000)
 * @returns {Promise<any>} Response data from API
 */
function apiCallJsonp(url, callbackName, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('API call timeout'));
    }, timeout);
    
    const cleanup = () => {
      clearTimeout(timeoutId);
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window[callbackName];
    };
    
    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };
    
    const script = document.createElement('script');
    script.src = url;
    script.onerror = () => {
      cleanup();
      reject(new Error('Script loading failed'));
    };
    document.body.appendChild(script);
  });
}

/**
 * Execute async operation with button loading state
 * @param {HTMLButtonElement} button - Button element to show loading state
 * @param {Function} asyncFn - Async function to execute
 * @returns {Promise<any>}
 */
async function withLoadingState(button, asyncFn) {
  const originalText = button.textContent;
  const originalDisabled = button.disabled;
  
  button.disabled = true;
  button.textContent = '⏳ Processing...';
  button.setAttribute('aria-busy', 'true');
  
  try {
    return await asyncFn();
  } finally {
    button.disabled = originalDisabled;
    button.textContent = originalText;
    button.removeAttribute('aria-busy');
  }
}

/**
 * Get user role from API
 * @param {string} email - User email address
 * @returns {Promise<Object>} User role data
 */
async function getUserRoleApi(email) {
  const callbackName = 'handleUserRole_' + Date.now();
  const url = buildApiUrl(CONFIG.APPS_SCRIPT_URL, {
    action: 'getUserRole',
    email: email,
    callback: callbackName
  });
  
  return withErrorHandling(
    () => apiCallJsonp(url, callbackName),
    'Failed to fetch user role. Please try again.'
  );
}

/**
 * Get team members for manager/admin
 * @param {string} email - Manager/admin email address
 * @returns {Promise<Array>} List of team members
 */
async function getTeamMembersApi(email) {
  const callbackName = 'handleTeamMembers_' + Date.now();
  const url = buildApiUrl(CONFIG.APPS_SCRIPT_URL, {
    action: 'getTeamMembers',
    email: email,
    callback: callbackName
  });
  
  return withErrorHandling(
    () => apiCallJsonp(url, callbackName),
    'Failed to load team members. Please refresh the page.'
  );
}

/**
 * Get employee targets
 * @param {string} email - Employee email address
 * @returns {Promise<Object>} Employee targets data
 */
async function getTargetsApi(email) {
  const callbackName = 'handleTargets_' + Date.now();
  const url = buildApiUrl(CONFIG.APPS_SCRIPT_URL, {
    action: 'getTargets',
    email: email,
    callback: callbackName
  });
  
  return withErrorHandling(
    () => apiCallJsonp(url, callbackName),
    'Failed to load targets. Please try again.'
  );
}

/**
 * Save scorecard data
 * @param {Object} scorecardData - Scorecard data to save
 * @returns {Promise<Object>} Save response
 */
async function saveScorecardApi(scorecardData) {
  const callbackName = 'handleSaveResponse_' + Date.now();
  let url = CONFIG.APPS_SCRIPT_URL + '?action=saveScorecard&callback=' + callbackName;
  
  // Append scorecard fields to URL
  for (const key in scorecardData) {
    if (scorecardData.hasOwnProperty(key)) {
      url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(scorecardData[key]);
    }
  }
  
  return withErrorHandling(
    () => apiCallJsonp(url, callbackName),
    'Failed to save scorecard. Your data may not have been saved.'
  );
}

/**
 * Get employee scores/reports
 * @param {string} email - Employee email address
 * @returns {Promise<Array>} Employee scores data
 */
async function getEmployeeScoresApi(email) {
  const callbackName = 'handleReportsData_' + Date.now();
  const url = buildApiUrl(CONFIG.APPS_SCRIPT_URL, {
    email: email,
    callback: callbackName
  });
  
  return withErrorHandling(
    () => apiCallJsonp(url, callbackName),
    'Failed to load reports. Please try again.'
  );
}

/**
 * Get pending peer feedback requests
 * @param {string} email - User email address
 * @returns {Promise<Array>} Pending feedback requests
 */
async function getPendingFeedbackApi(email) {
  const callbackName = 'handlePendingFeedback_' + Date.now();
  const url = buildApiUrl(CONFIG.APPS_SCRIPT_URL, {
    action: 'getPendingFeedback',
    email: email,
    callback: callbackName
  });
  
  return withErrorHandling(
    () => apiCallJsonp(url, callbackName),
    'Failed to load peer feedback requests.'
  );
}

/**
 * Submit peer feedback
 * @param {Object} feedbackData - Feedback data to submit
 * @returns {Promise<Object>} Submission response
 */
async function submitPeerFeedbackApi(feedbackData) {
  const callbackName = 'handleSubmitFeedbackResponse_' + Date.now();
  let url = CONFIG.APPS_SCRIPT_URL + '?action=submitPeerFeedback&callback=' + callbackName;
  
  for (const key in feedbackData) {
    if (feedbackData.hasOwnProperty(key)) {
      url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(feedbackData[key]);
    }
  }
  
  return withErrorHandling(
    () => apiCallJsonp(url, callbackName),
    'Failed to submit feedback. Please try again.'
  );
}

/**
 * Get aggregated peer feedback
 * @param {string} employeeEmail - Employee email address
 * @param {number} year - Year
 * @param {number} month - Month
 * @returns {Promise<Object>} Aggregated feedback data
 */
async function getAggregatedFeedbackApi(employeeEmail, year, month) {
  const callbackName = 'handleAggregatedFeedback_' + Date.now();
  const url = buildApiUrl(CONFIG.APPS_SCRIPT_URL, {
    action: 'getAggregatedPeerFeedback',
    employeeEmail: employeeEmail,
    year: year,
    month: month,
    callback: callbackName
  });
  
  return withErrorHandling(
    () => apiCallJsonp(url, callbackName),
    'Failed to load peer feedback data.'
  );
}

/**
 * Lookup user information
 * @param {string} email - User email address
 * @returns {Promise<Object>} User data
 */
async function lookupUserApi(email) {
  const callbackName = 'handleUserData_' + Date.now();
  const url = buildApiUrl(CONFIG.APPS_SCRIPT_URL, {
    action: 'lookupUser',
    email: email,
    callback: callbackName
  });
  
  return withErrorHandling(
    () => apiCallJsonp(url, callbackName),
    'Failed to lookup user information.'
  );
}

// Make API functions available globally
if (typeof window !== 'undefined') {
  window.buildApiUrl = buildApiUrl;
  window.withErrorHandling = withErrorHandling;
  window.apiCallJsonp = apiCallJsonp;
  window.withLoadingState = withLoadingState;
  window.getUserRoleApi = getUserRoleApi;
  window.getTeamMembersApi = getTeamMembersApi;
  window.getTargetsApi = getTargetsApi;
  window.saveScorecardApi = saveScorecardApi;
  window.getEmployeeScoresApi = getEmployeeScoresApi;
  window.getPendingFeedbackApi = getPendingFeedbackApi;
  window.submitPeerFeedbackApi = submitPeerFeedbackApi;
  window.getAggregatedFeedbackApi = getAggregatedFeedbackApi;
  window.lookupUserApi = lookupUserApi;
}
