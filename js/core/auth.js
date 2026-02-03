/**
 * Authentication Module
 * Handles user authentication, session management, and role-based access
 * @module core/auth
 */

// Dependencies: Requires CONFIG from core/config.js

/**
 * Global user state
 */
let userProfile = null;
let userRole = null; // 'Admin', 'Manager', or 'Employee'

/**
 * Parse JWT token to extract payload
 * @param {string} token - JWT token string
 * @returns {Object} Decoded JWT payload
 */
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('')
  );
  return JSON.parse(jsonPayload);
}

/**
 * Save session to localStorage
 * @param {Object} profile - User profile object
 * @param {string} role - User role (Admin/Manager/Employee)
 */
function saveSession(profile, role) {
  try {
    const sessionData = {
      profile: profile,
      role: role,
      timestamp: Date.now()
    };
    localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(sessionData));
    localStorage.setItem(CONFIG.SESSION_EXPIRY_KEY, Date.now() + CONFIG.SESSION_DURATION);
    console.log('Session saved successfully');
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

/**
 * Load session from localStorage
 * @returns {Object|null} Session data or null if expired/not found
 */
function loadSession() {
  try {
    const sessionExpiry = localStorage.getItem(CONFIG.SESSION_EXPIRY_KEY);
    
    // Check if session has expired
    if (sessionExpiry && Date.now() > parseInt(sessionExpiry)) {
      console.log('Session expired, clearing...');
      clearSession();
      return null;
    }
    
    const sessionData = localStorage.getItem(CONFIG.SESSION_KEY);
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      console.log('Session loaded successfully');
      return parsed;
    }
  } catch (error) {
    console.error('Error loading session:', error);
  }
  return null;
}

/**
 * Clear session from localStorage
 */
function clearSession() {
  try {
    localStorage.removeItem(CONFIG.SESSION_KEY);
    localStorage.removeItem(CONFIG.SESSION_EXPIRY_KEY);
    console.log('Session cleared');
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}

/**
 * Get user role from backend API
 * Fetches the role and initializes the application
 */
function getUserRole() {
  const url = CONFIG.APPS_SCRIPT_URL + '?action=getUserRole&email=' + 
              encodeURIComponent(userProfile.email) + '&callback=handleUserRole';
  
  window.handleUserRole = function(data) {
    console.log('User role data:', data);
    userRole = data.role || 'Employee';
    
    // Save session to localStorage for persistence
    saveSession(userProfile, userRole);
    
    updateUserUI();
    renderTabs();
    renderScorecardRows();
    autofillUserDetails();
    loadUserReports();
    loadDashboard();
    
    // Load team data for managers/admins
    if (userRole === 'Manager' || userRole === 'Admin') {
      loadTeamMembers();
    }
    
    // Initialize real-time updates
    initializeRealtimeFeatures();
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}

/**
 * Update UI to reflect current user state
 * Shows/hides elements based on authentication status
 */
function updateUserUI() {
  const userStatus = document.getElementById("userStatus");
  const notificationBell = document.getElementById("notificationBell");
  
  if (userProfile && userRole) {
    const roleBadgeClass = userRole.toLowerCase();
    const safePicture = userProfile.picture || '';
    const safeName = userProfile.name || '';
    const safeRole = userRole || '';
    
    userStatus.innerHTML = `
      <span class="user">
        <img src="${safePicture}" alt="User profile picture" 
             loading="lazy" width="34" height="34" 
             style="width:34px;vertical-align:middle;border-radius:50%;margin-right:8px;">
        Welcome, <b>${safeName}</b> 
        <span class="role-badge ${roleBadgeClass}">${safeRole}</span>
      </span>
      <button class="signout-btn" onclick="signOut()" aria-label="Sign out of application">Sign out</button>
    `;
    document.getElementById("g_id_signin").style.display = "none";
    document.querySelectorAll('.tab-content, .tabs').forEach(el => el.style.display = "");
    
    // Show notification bell
    if (notificationBell) {
      notificationBell.style.display = "block";
      if (typeof updateNotificationBadge === 'function') {
        updateNotificationBadge();
      }
    }
  } else if (userProfile) {
    userStatus.innerHTML = `<span style="font-size:1.07rem;">Loading your profile...</span>`;
    if (notificationBell) {
      notificationBell.style.display = "none";
    }
  } else {
    userStatus.innerHTML = `<span style="font-size:1.07rem;">Please sign in with your Google account to use the scorecard.</span>`;
    document.getElementById("g_id_signin").style.display = "";
    document.querySelectorAll('.tab-content, .tabs').forEach(el => el.style.display = "none");
    if (notificationBell) {
      notificationBell.style.display = "none";
    }
  }
}

/**
 * Sign out current user
 * Clears session and reloads page
 */
function signOut() {
  if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
    google.accounts.id.disableAutoSelect();
  }
  clearSession();
  userProfile = null;
  userRole = null;
  if (typeof window.teamMembers !== 'undefined') {
    window.teamMembers = [];
  }
  updateUserUI();
  location.reload();
}

/**
 * Initialize authentication on page load
 * Attempts to restore session from localStorage
 */
function initAuth() {
  const session = loadSession();
  if (session) {
    userProfile = session.profile;
    userRole = session.role;
    updateUserUI();
    renderTabs();
    renderScorecardRows();
    autofillUserDetails();
    loadUserReports();
    loadDashboard();
    
    if (userRole === 'Manager' || userRole === 'Admin') {
      loadTeamMembers();
    }
    
    initializeRealtimeFeatures();
  }
}

// Make auth functions and state available globally
if (typeof window !== 'undefined') {
  window.userProfile = userProfile;
  window.userRole = userRole;
  window.parseJwt = parseJwt;
  window.saveSession = saveSession;
  window.loadSession = loadSession;
  window.clearSession = clearSession;
  window.getUserRole = getUserRole;
  window.updateUserUI = updateUserUI;
  window.signOut = signOut;
  window.initAuth = initAuth;
}
