// ===== CONFIGURATION =====
const CONFIG = {
  SESSION_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  POLLING_INTERVAL: 30000, // 30 seconds for real-time updates
  SERVICE_WORKER_PATH: '/sw.js', // Service worker file path
  SERVICE_WORKER_UPDATE_INTERVAL: 60000 // Check for updates every minute
};

// ===== UTILITY FUNCTIONS =====
// Helper function to build API URLs safely with URLSearchParams
function buildApiUrl(baseUrl, params) {
  const urlParams = new URLSearchParams(params);
  return baseUrl + '?' + urlParams.toString();
}

// ===== SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(CONFIG.SERVICE_WORKER_PATH)
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, CONFIG.SERVICE_WORKER_UPDATE_INTERVAL);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, notify user with custom notification
              showUpdateAvailableNotification(newWorker);
            }
          });
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// Custom notification for service worker updates
function showUpdateAvailableNotification(newWorker) {
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px; padding: 16px 20px;">
      <span style="font-size: 1.5em;">🔄</span>
      <div style="flex: 1;">
        <div style="font-weight: bold; margin-bottom: 4px;">New Version Available!</div>
        <div style="font-size: 0.9em; opacity: 0.9;">A new version of the app is ready. Update now for the latest features.</div>
      </div>
      <button onclick="updateServiceWorker()" id="updateBtn"
              style="background: white; color: #667eea; border: none; padding: 8px 16px; 
                     border-radius: 6px; cursor: pointer; font-weight: bold;">
        Update Now
      </button>
      <button onclick="this.closest('.update-notification').remove()"
              style="background: rgba(255,255,255,0.3); color: white; border: none; 
                     padding: 8px 16px; border-radius: 6px; cursor: pointer;">
        Later
      </button>
    </div>
  `;
  
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 10000;
    max-width: 450px;
    animation: slideUp 0.3s ease-out;
  `;
  
  // Add animation style
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // Store reference to new worker for update function
  window.pendingServiceWorker = newWorker;
}

// Function to activate new service worker
window.updateServiceWorker = function() {
  if (window.pendingServiceWorker) {
    window.pendingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
};

// ===== SESSION PERSISTENCE =====
const SESSION_KEY = 'rose_pms_session';
const SESSION_EXPIRY_KEY = 'rose_pms_session_expiry';

// Save session to localStorage
function saveSession(profile, role) {
  try {
    const sessionData = {
      profile: profile,
      role: role,
      timestamp: Date.now()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    localStorage.setItem(SESSION_EXPIRY_KEY, Date.now() + CONFIG.SESSION_DURATION);
    console.log('Session saved successfully');
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

// Load session from localStorage
function loadSession() {
  try {
    const sessionExpiry = localStorage.getItem(SESSION_EXPIRY_KEY);
    
    // Check if session has expired
    if (sessionExpiry && Date.now() > parseInt(sessionExpiry)) {
      console.log('Session expired, clearing...');
      clearSession();
      return null;
    }
    
    const sessionData = localStorage.getItem(SESSION_KEY);
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

// Clear session from localStorage
function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
    console.log('Session cleared');
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}

// ===== GLOBAL VARIABLES =====
let userProfile = null;
let userRole = null; // 'Admin', 'Manager', or 'Employee'
let teamMembers = [];
let weeklyHistory = []; // NEW: Store historical weekly data

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzF9u325VOjHzVuZKU3xR8EMtKzq4jdIxVJqxzFSFOUnhgyvldSAaCTP-e-34krIaEu_Q/exec";
const GOOGLE_CLIENT_ID = "851703142133-3186bsmuthhrklaa1eaddqa9c0tkb46d.apps.googleusercontent.com";

// Default scorecard dimensions
const SCORECARD_DIMENSIONS = [
  {
    dimension: "Financial",
    measures: [
      { measure: "Budget Management", type: "financial", weight: 10 }
    ]
  },
  {
    dimension: "Customer",
    measures: [
      { measure: "Internal Customer (Peer Review)", type: "peer-review", weight: 25, readonly: true },
      { measure: "External Customer Satisfaction", weight: 5 }
    ]
  },
  {
    dimension: "Internal Process",
    measures: [
      { measure: "Process Improvement", weight: 50 }
    ]
  },
  {
    dimension: "Learning & Growth",
    measures: [
      { measure: "Training Hours", weight: 10 }
    ]
  }
];

// ========== SIGN-IN & UI =============
window.onload = function() {
  // Try to restore session from localStorage first
  const savedSession = loadSession();
  if (savedSession && savedSession.profile && savedSession.role) {
    console.log('Restoring session from localStorage');
    userProfile = savedSession.profile;
    userRole = savedSession.role;
    
    // Initialize UI with saved session
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
    
    // Hide sign-in button since user is already signed in
    const signinBtn = document.getElementById("g_id_signin");
    if (signinBtn) signinBtn.style.display = "none";
    
    return; // Skip Google Sign-In initialization
  }
  
  // No saved session, proceed with Google Sign-In
  window.handleCredentialResponse = (response) => {
    const data = parseJwt(response.credential);
    userProfile = {
      email: data.email,
      name: data.name,
      picture: data.picture
    };
    
    // Get user role from backend
    getUserRole();
  };
  
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse
  });
  
  google.accounts.id.renderButton(
    document.getElementById("g_id_signin"),
    { theme: "outline", size: "large", width: 220 }
  );
  
  updateUserUI();
  renderScorecardRows();
};

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

function getUserRole() {
  const url = APPS_SCRIPT_URL + '?action=getUserRole&email=' + encodeURIComponent(userProfile.email) + '&callback=handleUserRole';
  
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
  
  // For employees, load targets when month is selected
  // (will be triggered by onchange event on month dropdown)
};
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}

function renderTabs() {
  const tabsContainer = document.getElementById('tabsContainer');
  let tabs = `
    <button class="tab-btn active" onclick="showTab('scorecardTab', this)" role="tab" aria-selected="true" aria-controls="scorecardTab" id="scorecard-tab">Scorecard</button>
    <button class="tab-btn" onclick="showTab('reportsTab', this)" role="tab" aria-selected="false" aria-controls="reportsTab" id="reports-tab">Reports</button>
    <button class="tab-btn" onclick="showTab('dashboardTab', this)" role="tab" aria-selected="false" aria-controls="dashboardTab" id="dashboard-tab">Dashboard</button>
    <button class="tab-btn" onclick="showTab('peerFeedbackTab', this)" role="tab" aria-selected="false" aria-controls="peerFeedbackTab" id="peer-feedback-tab">Peer Feedback</button>
    <button class="tab-btn" onclick="showTab('recognitionTab', this)" role="tab" aria-selected="false" aria-controls="recognitionTab" id="recognition-tab">🏆 Recognition</button>
  `;
  
  if (userRole === 'Manager' || userRole === 'Admin') {
    tabs += `
      <button class="tab-btn" onclick="showTab('myTeamTab', this)" role="tab" aria-selected="false" aria-controls="myTeamTab" id="team-tab">My Team</button>
      <button class="tab-btn" onclick="showTab('setTargetsTab', this)" role="tab" aria-selected="false" aria-controls="setTargetsTab" id="targets-tab">Set Targets</button>
      <button class="tab-btn" onclick="showTab('quarterlyReviewTab', this)" role="tab" aria-selected="false" aria-controls="quarterlyReviewTab" id="quarterly-review-tab">📊 Quarterly Review</button>
      <button class="tab-btn" onclick="showTab('requestPeerFeedbackTab', this)" role="tab" aria-selected="false" aria-controls="requestPeerFeedbackTab" id="request-feedback-tab">Request Feedback</button>
      <button class="tab-btn" onclick="showTab('aiInsightsTab', this)" role="tab" aria-selected="false" aria-controls="aiInsightsTab" id="ai-insights-tab">🤖 AI Insights</button>
      <button class="tab-btn" onclick="showTab('teamReportsTab', this)" role="tab" aria-selected="false" aria-controls="teamReportsTab" id="team-reports-tab">Team Reports</button>
      <button class="tab-btn" onclick="showTab('teamDashboardTab', this)" role="tab" aria-selected="false" aria-controls="teamDashboardTab" id="team-dashboard-tab">Team Dashboard</button>
    `;
  }
  
  tabsContainer.innerHTML = tabs;
}

function updateUserUI() {
  const userStatus = document.getElementById("userStatus");
  const notificationBell = document.getElementById("notificationBell");
  
  if (userProfile && userRole) {
    const roleBadgeClass = userRole.toLowerCase();
    // Note: Profile pictures from Google are already optimized
    // For custom images, consider using WebP format with fallback:
    // <picture><source srcset="image.webp" type="image/webp"><img src="image.jpg"></picture>
    userStatus.innerHTML = `
      <span class="user">
        <img src="${userProfile.picture}" alt="User profile picture" loading="lazy" width="34" height="34" style="width:34px;vertical-align:middle;border-radius:50%;margin-right:8px;">
        Welcome, <b>${userProfile.name}</b> 
        <span class="role-badge ${roleBadgeClass}">${userRole}</span>
      </span>
      <button class="signout-btn" onclick="signOut()" aria-label="Sign out of application">Sign out</button>
    `;
    document.getElementById("g_id_signin").style.display = "none";
    document.querySelectorAll('.tab-content, .tabs').forEach(el => el.style.display = "");
    
    // Show notification bell and update badge
    if (notificationBell) {
      notificationBell.style.display = "block";
      if (typeof updateNotificationBadge === 'function') {
        updateNotificationBadge();
      }
    }
  } else if (userProfile) {
    userStatus.innerHTML = `<span style="font-size:1.07rem;">Loading your profile...</span>`;
    if (notificationBell) notificationBell.style.display = "none";
  } else {
    userStatus.innerHTML = `<span style="font-size:1.07rem;">Please sign in with your Google account to use the scorecard.</span>`;
    document.getElementById("g_id_signin").style.display = "";
    document.querySelectorAll('.tab-content, .tabs').forEach(el => el.style.display = "none");
    if (notificationBell) notificationBell.style.display = "none";
  }
}

function signOut() {
  google.accounts.id.disableAutoSelect();
  clearSession(); // Clear saved session
  userProfile = null;
  userRole = null;
  teamMembers = [];
  updateUserUI();
  location.reload();
}

// ========== TABS ==============
function showTab(tabId, btn) {
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.remove('active');
    el.setAttribute('aria-hidden', 'true');
  });
  const activeTab = document.getElementById(tabId);
  activeTab.classList.add('active');
  activeTab.setAttribute('aria-hidden', 'false');
  
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
  
  if (tabId === 'reportsTab') loadUserReports();
  if (tabId === 'dashboardTab') loadDashboard();
  if (tabId === 'myTeamTab') displayTeamMembers();
  if (tabId === 'setTargetsTab') loadSetTargetsTab();
  if (tabId === 'quarterlyReviewTab') loadQuarterlyReviewTab();
  if (tabId === 'teamReportsTab') loadTeamReportsTab();
  if (tabId === 'teamDashboardTab') loadTeamDashboardTab();
  if (tabId === 'peerFeedbackTab') loadPeerFeedbackTab();
  if (tabId === 'requestPeerFeedbackTab') loadRequestPeerFeedbackTab();
  if (tabId === 'aiInsightsTab') loadAIInsightsTab();
  if (tabId === 'recognitionTab') loadRecognitionTab();
}

// ========== TEAM MANAGEMENT (MANAGER/ADMIN) ==========
function loadTeamMembers() {
  const url = APPS_SCRIPT_URL + '?action=getTeamMembers&email=' + encodeURIComponent(userProfile.email) + '&callback=handleTeamMembers';
  
  window.handleTeamMembers = function(data) {
    console.log('Team members:', data);
    teamMembers = data || [];
    displayTeamMembers();
    populateTeamSelects();
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}

function displayTeamMembers() {
  const wrap = document.getElementById('teamMembersWrap');
  if (!wrap) return;
  
  if (teamMembers.length === 0) {
    wrap.innerHTML = `<div class="empty-msg">No team members found.</div>`;
    return;
  }
  
  let html = '<div class="team-grid">';
  teamMembers.forEach(member => {
    const roleBadgeClass = (member.role || 'Employee').toLowerCase();
    html += `
      <div class="team-card">
        <h4>${member.name}</h4>
        <p><strong>Email:</strong> ${member.email}</p>
        <p><strong>Title:</strong> ${member.title}</p>
        <p><strong>Division:</strong> ${member.division}</p>
        <p><strong>Role:</strong> <span class="role-badge ${roleBadgeClass}">${member.role || 'Employee'}</span></p>
      </div>
    `;
  });
  html += '</div>';
  
  wrap.innerHTML = html;
}

function populateTeamSelects() {
  const selects = ['targetEmployeeSelect', 'teamReportSelect', 'teamDashboardSelect'];
  
  selects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- Select Team Member --</option>';
    
    teamMembers.forEach(member => {
      const option = document.createElement('option');
      option.value = member.email;
      option.textContent = `${member.name} (${member.title})`;
      select.appendChild(option);
    });
    
    if (currentValue) select.value = currentValue;
  });
}

// ========== SET TARGETS (MANAGER/ADMIN) ==========
function loadSetTargetsTab() {
  const wrap = document.getElementById('targetsFormWrap');
  if (!wrap) return;
  
  const selectedEmployee = document.getElementById('targetEmployeeSelect').value;
  
  if (!selectedEmployee) {
    wrap.innerHTML = `<div class="empty-msg">Please select a team member to set targets.</div>`;
    return;
  }
  
  wrap.innerHTML = `
    <div class="targets-form">
      <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
        <h3 style="margin-top: 0; color: #667eea;">📊 Weight Allocation Rules</h3>
        <p style="margin: 10px 0;"><strong>Customer Dimension (30% total):</strong></p>
        <ul style="margin: 5px 0 15px 20px;">
          <li><strong>Internal Customer (25%)</strong> - ✅ Automatic (Peer Review)</li>
          <li><strong>External Customer (max 5%)</strong> - You can add measures below</li>
        </ul>
        
        <p style="margin: 10px 0;"><strong>Other Dimensions:</strong></p>
        <ul style="margin: 5px 0;">
          <li><strong>Financial:</strong> Maximum 15%</li>
          <li><strong>Internal Process:</strong> Maximum 50%</li>
          <li><strong>Learning & Growth:</strong> Maximum 10%</li>
        </ul>
        
        <p style="margin-top: 15px; padding: 10px; background: white; border-radius: 5px; font-weight: 600; color: #2d3748;">
          Total must equal: 25% (Internal Customer) + Your targets (75%) = <span style="color: #667eea;">100%</span>
        </p>
      </div>
      
      <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
        <h3 style="margin-top: 0; color: #92400e;">🎯 Target Entry Mode</h3>
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
          <label style="display: flex; align-items: center; padding: 10px; background: white; border-radius: 6px; cursor: pointer; flex: 1;">
            <input type="radio" name="targetMode" value="quarterly" checked onchange="switchTargetMode(this.value)" style="margin-right: 8px;">
            <span>Set Quarterly Targets</span>
          </label>
          <label style="display: flex; align-items: center; padding: 10px; background: white; border-radius: 6px; cursor: pointer; flex: 1;">
            <input type="radio" name="targetMode" value="yearly" onchange="switchTargetMode(this.value)" style="margin-right: 8px;">
            <span>Set Yearly Targets (Auto-divided)</span>
          </label>
        </div>
        <p style="margin: 0; color: #78350f; font-size: 0.95em;" id="targetModeHelp">
          <strong>Quarterly Mode:</strong> Set targets for the selected quarter only.
        </p>
      </div>
      
      <h3>Set Performance Targets</h3>
      <div id="targetsList"></div>
      <div class="targets-button-row">
        <button onclick="addTargetRow()" style="background: #667eea;">+ Add Target</button>
        <button onclick="saveTargets()" style="background: #48bb78;">💾 Save All Targets</button>
        <button onclick="validateWeights()" style="background: #ed8936;">🔍 Check Weights</button>
        <button onclick="resetTargetsForm()" style="background: linear-gradient(135deg, #231f1f 0%, #555 100%);">🔄 Reset Form</button>
      </div>
    </div>
  `;
  
  addTargetRow();
}

function resetTargetsForm() {
  if (confirm('Are you sure you want to reset the form? This will clear all unsaved changes.')) {
    // Clear the targets list while preserving the selected employee
    const targetsList = document.getElementById('targetsList');
    if (targetsList) {
      targetsList.innerHTML = '';
      // Add one empty row to start fresh
      addTargetRow();
    }
  }
}

function switchTargetMode(mode) {
  const helpText = document.getElementById('targetModeHelp');
  if (!helpText) return;
  
  if (mode === 'yearly') {
    helpText.innerHTML = '<strong>Yearly Mode:</strong> Enter yearly targets. They will be automatically divided by 4 for each quarter when saved.';
  } else {
    helpText.innerHTML = '<strong>Quarterly Mode:</strong> Set targets for the selected quarter only.';
  }
  
  // Update all existing rows to show/hide yearly input
  const rows = document.querySelectorAll('.target-row');
  rows.forEach(row => {
    const yearlyInput = row.querySelector('.target-yearly');
    const quarterlyInput = row.querySelector('.target-value');
    if (mode === 'yearly') {
      if (yearlyInput) yearlyInput.style.display = 'block';
      if (quarterlyInput) quarterlyInput.style.display = 'none';
    } else {
      if (yearlyInput) yearlyInput.style.display = 'none';
      if (quarterlyInput) quarterlyInput.style.display = 'block';
    }
  });
}

let targetRowCount = 0;

function addTargetRow() {
  const targetsList = document.getElementById('targetsList');
  if (!targetsList) return;
  
  targetRowCount++;
  const rowId = `targetRow_${targetRowCount}`;
  
  const isYearlyMode = document.querySelector('input[name="targetMode"]:checked')?.value === 'yearly';
  
  const row = document.createElement('div');
  row.className = 'target-row';
  row.id = rowId;
  row.innerHTML = `
    <select class="target-dimension">
      <option value="">Dimension</option>
      <option value="Financial">Financial</option>
      <option value="Customer">Customer</option>
      <option value="Internal Process">Internal Process</option>
      <option value="Learning & Growth">Learning & Growth</option>
    </select>
    <input type="text" class="target-measure" placeholder="Measure (e.g., Budget Savings)" style="flex: 2;">
    <input type="number" class="target-value" placeholder="Quarterly Target" style="flex: 1; ${isYearlyMode ? 'display:none;' : ''}">
    <input type="number" class="target-yearly" placeholder="Yearly Target" style="flex: 1; ${isYearlyMode ? '' : 'display:none;'}">
    <input type="number" class="target-weight" placeholder="Weight %" min="0" max="100" style="flex: 1;">
    <select class="target-frequency">
      <option value="Weekly">Weekly</option>
      <option value="Monthly">Monthly</option>
      <option value="Quarterly">Quarterly</option>
    </select>
    <button onclick="document.getElementById('${rowId}').remove()" style="background: #f56565; padding: 8px 12px;">Remove</button>
  `;
  
  targetsList.appendChild(row);
}

function loadEmployeeCurrentTargets() {
  const selectedEmployee = document.getElementById('targetEmployeeSelect').value;
  if (!selectedEmployee) return;
  
  loadSetTargetsTab();
  
  // Load existing targets
  const year = document.getElementById('targetYear').value;
  const quarter = document.getElementById('targetQuarter').value;
  
  const url = APPS_SCRIPT_URL + '?action=getTargets&email=' + encodeURIComponent(selectedEmployee) + 
              '&year=' + year + '&quarter=' + quarter + '&callback=handleExistingTargets';
  
  window.handleExistingTargets = function(targets) {
    console.log('Existing targets:', targets);
    if (targets && targets.length > 0) {
      const targetsList = document.getElementById('targetsList');
      targetsList.innerHTML = '';
      
      targets.forEach(target => {
        addTargetRow();
        const rows = targetsList.querySelectorAll('.target-row');
        const lastRow = rows[rows.length - 1];
        
        lastRow.querySelector('.target-dimension').value = target.Dimension || target.dimension || '';
        lastRow.querySelector('.target-measure').value = target.Measure || target.measure || '';
        lastRow.querySelector('.target-value').value = target['Target Value'] || target.targetValue || '';
        lastRow.querySelector('.target-weight').value = target.Weight || target.weight || '';
        lastRow.querySelector('.target-frequency').value = target.Frequency || target.frequency || 'Weekly';
      });
    }
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}

function saveTargets() {
  const selectedEmployee = document.getElementById('targetEmployeeSelect').value;
  const year = document.getElementById('targetYear').value;
  const quarter = document.getElementById('targetQuarter').value;
  const isYearlyMode = document.querySelector('input[name="targetMode"]:checked')?.value === 'yearly';
  
  if (!selectedEmployee) {
    alert('Please select a team member.');
    return;
  }
  
  const targetRows = document.querySelectorAll('.target-row');
  const targets = [];
  
  // Dimension weight limits
  const dimensionLimits = {
    'Financial': 15,
    'Customer': 5, // Only external customer (internal is fixed at 25%)
    'Internal Process': 50,
    'Learning & Growth': 10
  };
  
  const dimensionTotals = {
    'Financial': 0,
    'Customer': 0,
    'Internal Process': 0,
    'Learning & Growth': 0
  };
  
  // Collect targets and calculate dimension totals
  targetRows.forEach(row => {
    const dimension = row.querySelector('.target-dimension').value;
    const measure = row.querySelector('.target-measure').value;
    let targetValue;
    
    if (isYearlyMode) {
      const yearlyValue = parseFloat(row.querySelector('.target-yearly').value);
      if (yearlyValue) {
        targetValue = (yearlyValue / 4).toFixed(2); // Auto-divide yearly by 4 for quarterly
      }
    } else {
      targetValue = row.querySelector('.target-value').value;
    }
    
    const weight = parseFloat(row.querySelector('.target-weight').value) || 0;
    const frequency = row.querySelector('.target-frequency').value;
    
    if (dimension && measure && targetValue && weight) {
      targets.push({
        dimension: dimension,
        measure: measure,
        targetValue: targetValue,
        weight: weight,
        frequency: frequency
      });
      
      if (dimensionTotals.hasOwnProperty(dimension)) {
        dimensionTotals[dimension] += weight;
      }
    }
  });
  
  if (targets.length === 0) {
    alert('Please add at least one target.');
    return;
  }
  
  // Validate dimension limits
  let validationErrors = [];
  
  Object.keys(dimensionLimits).forEach(dimension => {
    if (dimensionTotals[dimension] > dimensionLimits[dimension]) {
      validationErrors.push(`${dimension}: ${dimensionTotals[dimension]}% exceeds limit of ${dimensionLimits[dimension]}%`);
    }
  });
  
  if (validationErrors.length > 0) {
    alert('⚠️ Weight Limit Exceeded:\n\n' + validationErrors.join('\n') + '\n\nReminder:\n• Financial: max 15%\n• External Customer: max 5%\n• Internal Process: max 50%\n• Learning & Growth: max 10%\n• Internal Customer (25%) is automatic');
    return;
  }
  
  // Calculate total weight (including automatic 25% for Internal Customer)
  const totalWeight = Object.values(dimensionTotals).reduce((sum, val) => sum + val, 0) + 25;
  
  if (Math.abs(totalWeight - 100) > 0.01) {
    alert(`⚠️ Total Weight Error:\n\nCurrent total: ${totalWeight.toFixed(1)}%\n\nBreakdown:\n• Internal Customer: 25% (automatic)\n• Financial: ${dimensionTotals['Financial']}%\n• External Customer: ${dimensionTotals['Customer']}%\n• Internal Process: ${dimensionTotals['Internal Process']}%\n• Learning & Growth: ${dimensionTotals['Learning & Growth']}%\n\nTotal must equal 100%`);
    return;
  }
  
  // If yearly mode, save to all 4 quarters
  if (isYearlyMode) {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    let savedCount = 0;
    
    quarters.forEach((q, index) => {
      const data = {
        managerEmail: userProfile.email,
        employeeEmail: selectedEmployee,
        year: year,
        quarter: q,
        targets: targets,
        isYearlyDistribution: true
      };
      
      console.log(`Saving targets for ${q}:`, data);
      
      const jsonData = JSON.stringify(data);
      const chunkSize = 1500;
      const chunks = [];
      for (let i = 0; i < jsonData.length; i += chunkSize) {
        chunks.push(jsonData.substring(i, i + chunkSize));
      }
      
      let url = APPS_SCRIPT_URL + '?action=saveTargets&callback=handleSaveTargetsResponse_' + q;
      chunks.forEach((chunk, idx) => {
        url += '&chunk' + idx + '=' + encodeURIComponent(chunk);
      });
      
      window['handleSaveTargetsResponse_' + q] = function(resp) {
        console.log(`Save targets response for ${q}:`, resp);
        savedCount++;
        
        if (resp.result !== 'success') {
          if (typeof showToast === 'function') {
            showToast(`❌ Error saving targets for ${q}: ` + (resp.message || 'Unknown error'), 'error');
          } else {
            alert(`Error saving targets for ${q}: ` + (resp.message || 'Unknown error'));
          }
        }
        
        // After all quarters saved
        if (savedCount === quarters.length) {
          if (typeof showToast === 'function') {
            showToast(`✅ Yearly targets saved for all 4 quarters! Each quarter target = Yearly ÷ 4`, 'success', 5000);
          } else {
            alert(`✅ Yearly targets saved successfully for all 4 quarters!\n\n• Targets automatically distributed across Q1, Q2, Q3, Q4\n• Each quarter target = Yearly target ÷ 4\n• Internal Customer (25%) + Your targets (${totalWeight - 25}%) = 100%`);
          }
          loadEmployeeCurrentTargets();
        }
      };
      
      const script = document.createElement('script');
      script.src = url;
      document.body.appendChild(script);
    });
  } else {
    // Quarterly mode - save only for selected quarter
    const data = {
      managerEmail: userProfile.email,
      employeeEmail: selectedEmployee,
      year: year,
      quarter: quarter,
      targets: targets
    };
    
    console.log('Saving targets:', data);
    
    const jsonData = JSON.stringify(data);
    const chunkSize = 1500;
    const chunks = [];
    for (let i = 0; i < jsonData.length; i += chunkSize) {
      chunks.push(jsonData.substring(i, i + chunkSize));
    }
    
    let url = APPS_SCRIPT_URL + '?action=saveTargets&callback=handleSaveTargetsResponse';
    chunks.forEach((chunk, index) => {
      url += '&chunk' + index + '=' + encodeURIComponent(chunk);
    });
    
    window.handleSaveTargetsResponse = function(resp) {
      console.log('Save targets response:', resp);
      if (resp.result === 'success') {
        if (typeof showToast === 'function') {
          showToast('✅ Targets saved successfully! Internal Customer (25%) + Your targets (' + (totalWeight - 25) + '%) = 100%', 'success', 5000);
        } else {
          alert('✅ Targets saved successfully!\n\n• Internal Customer (25%) - Peer Review\n• Your custom targets - ' + (totalWeight - 25) + '%\n• Total: 100%');
        }
        loadEmployeeCurrentTargets();
      } else {
        if (typeof showToast === 'function') {
          showToast('❌ Error saving targets: ' + (resp.message || 'Unknown error'), 'error');
        } else {
          alert('Error saving targets: ' + (resp.message || 'Unknown error'));
        }
      }
    };
    
    const script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);
  }
}

  function validateWeights() {
  const targetRows = document.querySelectorAll('.target-row');
  
  const dimensionLimits = {
    'Financial': 15,
    'Customer': 5,
    'Internal Process': 50,
    'Learning & Growth': 10
  };
  
  const dimensionTotals = {
    'Financial': 0,
    'Customer': 0,
    'Internal Process': 0,
    'Learning & Growth': 0
  };
  
  targetRows.forEach(row => {
    const dimension = row.querySelector('.target-dimension').value;
    const weight = parseFloat(row.querySelector('.target-weight').value) || 0;
    
    if (dimensionTotals.hasOwnProperty(dimension)) {
      dimensionTotals[dimension] += weight;
    }
  });
  
  const totalWeight = Object.values(dimensionTotals).reduce((sum, val) => sum + val, 0) + 25;
  
  let report = '📊 Weight Validation Report:\n\n';
  report += '✅ Internal Customer: 25% (automatic)\n\n';
  report += 'Your Targets:\n';
  
  Object.keys(dimensionLimits).forEach(dimension => {
    const current = dimensionTotals[dimension];
    const limit = dimensionLimits[dimension];
    const status = current <= limit ? '✅' : '❌';
    const label = dimension === 'Customer' ? 'External Customer' : dimension;
    
    report += `${status} ${label}: ${current}% / ${limit}% max\n`;
  });
  
  report += `\n${'─'.repeat(35)}\n`;
  report += `Total: ${totalWeight}% / 100%\n`;
  
  if (totalWeight === 100) {
    report += '\n✅ Perfect! Weights add up to 100%';
  } else if (totalWeight < 100) {
    report += `\n⚠️ Need ${(100 - totalWeight).toFixed(1)}% more`;
  } else {
    report += `\n❌ Exceeded by ${(totalWeight - 100).toFixed(1)}%`;
  }
  
  alert(report);
}

// ========== TEAM REPORTS (MANAGER/ADMIN) ==========
function loadTeamReportsTab() {
  populateTeamSelects();
}

function loadTeamMemberReports() {
  const selectedEmail = document.getElementById('teamReportSelect').value;
  if (!selectedEmail) {
    document.getElementById('teamReportsWrap').innerHTML = '<div class="empty-msg">Please select a team member.</div>';
    return;
  }
  
  const url = APPS_SCRIPT_URL + '?action=getEmployeeScores&employeeEmail=' + encodeURIComponent(selectedEmail) + '&callback=handleTeamMemberReports';
  
  window.handleTeamMemberReports = function(records) {
    renderReportsTable(records, 'teamReportsWrap');
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}

// ========== TEAM DASHBOARD (MANAGER/ADMIN) ==========
function loadTeamDashboardTab() {
  populateTeamSelects();
}

function loadTeamMemberDashboard() {
  const selectedEmail = document.getElementById('teamDashboardSelect').value;
  if (!selectedEmail) {
    document.getElementById('teamDashboardWrap').innerHTML = '<div class="empty-msg">Please select a team member.</div>';
    return;
  }
  
  const url = APPS_SCRIPT_URL + '?action=getEmployeeScores&employeeEmail=' + encodeURIComponent(selectedEmail) + '&callback=handleTeamMemberDashboard';
  
  window.handleTeamMemberDashboard = function(records) {
    renderDashboard(records, 'teamDashboardWrap');
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}

// ========== QUARTERLY REVIEW (MANAGER/ADMIN) ==========
function loadQuarterlyReviewTab() {
  populateTeamSelects();
  
  // Populate quarterly review employee selector
  const select = document.getElementById('quarterlyReviewEmployeeSelect');
  if (select) {
    select.innerHTML = '<option value="">-- Select Team Member --</option>';
    teamMembers.forEach(member => {
      const option = document.createElement('option');
      option.value = member.email;
      option.textContent = `${member.name} (${member.title})`;
      option.dataset.name = member.name;
      select.appendChild(option);
    });
  }
}

function loadQuarterlyReviewData() {
  const selectedEmail = document.getElementById('quarterlyReviewEmployeeSelect').value;
  const year = document.getElementById('quarterlyReviewYear').value;
  const quarter = document.getElementById('quarterlyReviewQuarter').value;
  const wrap = document.getElementById('quarterlyReviewWrap');
  
  if (!selectedEmail) {
    wrap.innerHTML = '<div class="empty-msg">Please select a team member to view quarterly review.</div>';
    return;
  }
  
  // Show loading message
  wrap.innerHTML = '<div class="empty-msg">Loading quarterly data...</div>';
  
  const employeeName = document.querySelector('#quarterlyReviewEmployeeSelect option:checked')?.dataset.name || 'Employee';
  
  // Fetch employee scores for the specified quarter
  const url = APPS_SCRIPT_URL + '?action=getEmployeeScores&employeeEmail=' + encodeURIComponent(selectedEmail) + 
              '&year=' + year + '&quarter=' + quarter + '&callback=handleQuarterlyReviewData';
  
  window.handleQuarterlyReviewData = function(records) {
    console.log('Quarterly review data:', records);
    renderQuarterlyReview(records, employeeName, year, quarter, selectedEmail);
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}

function renderQuarterlyReview(records, employeeName, year, quarter, employeeEmail) {
  const wrap = document.getElementById('quarterlyReviewWrap');
  
  if (!records || records.length === 0) {
    wrap.innerHTML = `<div class="empty-msg">No data found for ${employeeName} in ${year} ${quarter}.</div>`;
    return;
  }
  
  // Filter records for the selected quarter
  const quarterMonths = {
    'Q1': ['01', '02', '03'],
    'Q2': ['04', '05', '06'],
    'Q3': ['07', '08', '09'],
    'Q4': ['10', '11', '12']
  };
  
  const quarterlyRecords = records.filter(rec => {
    const recYear = (rec.Year || rec.year) + '';
    const recMonth = (rec.Month || rec.month) + '';
    const paddedMonth = recMonth.padStart(2, '0');
    return recYear === year && quarterMonths[quarter].includes(paddedMonth);
  });
  
  if (quarterlyRecords.length === 0) {
    wrap.innerHTML = `<div class="empty-msg">No data found for ${employeeName} in ${year} ${quarter}.</div>`;
    return;
  }
  
  // Aggregate scores by dimension and measure
  const aggregated = {};
  const frequencyMap = {};
  
  quarterlyRecords.forEach(rec => {
    const freq = rec.progressFrequency || 'weekly';
    frequencyMap[freq] = (frequencyMap[freq] || 0) + 1;
    
    try {
      let scoresData = rec.Scores || rec.scores;
      let scoresArr = typeof scoresData === 'string' ? JSON.parse(scoresData) : scoresData;
      
      if (Array.isArray(scoresArr)) {
        scoresArr.forEach(score => {
          const key = `${score.dimension}_${score.measure}`;
          if (!aggregated[key]) {
            aggregated[key] = {
              dimension: score.dimension,
              measure: score.measure,
              ratings: [],
              actuals: [],
              targets: [],
              weights: []
            };
          }
          
          aggregated[key].ratings.push(parseFloat(score.rating) || 0);
          aggregated[key].actuals.push(parseFloat(score.actual || score.actualSpent) || 0);
          aggregated[key].targets.push(parseFloat(score.target || score.targetBudget) || 0);
          aggregated[key].weights.push(parseFloat(score.weight) || 0);
        });
      }
    } catch (e) {
      console.error('Error parsing scores:', e);
    }
  });
  
  // Calculate averages
  const summaryData = Object.values(aggregated).map(item => {
    const avgRating = item.ratings.length > 0 ? 
      (item.ratings.reduce((a, b) => a + b, 0) / item.ratings.length) : 0;
    const totalActual = item.actuals.reduce((a, b) => a + b, 0);
    const avgTarget = item.targets.length > 0 ? 
      (item.targets.reduce((a, b) => a + b, 0) / item.targets.length) : 0;
    const avgWeight = item.weights.length > 0 ? 
      (item.weights.reduce((a, b) => a + b, 0) / item.weights.length) : 0;
    const weightedScore = (avgRating * avgWeight) / 100;
    
    return {
      dimension: item.dimension,
      measure: item.measure,
      avgRating: avgRating.toFixed(2),
      totalActual: totalActual.toFixed(2),
      avgTarget: avgTarget.toFixed(2),
      avgWeight: avgWeight.toFixed(1),
      weightedScore: weightedScore.toFixed(2),
      entries: item.ratings.length
    };
  });
  
  const totalWeightedScore = summaryData.reduce((sum, item) => 
    sum + parseFloat(item.weightedScore), 0).toFixed(2);
  
  // Build HTML
  let html = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 12px; margin-bottom: 25px;">
      <h3 style="margin: 0 0 10px 0; color: white;">Quarterly Review: ${employeeName}</h3>
      <p style="margin: 0; font-size: 1.1em;">
        <strong>${year} - ${quarter}</strong> | 
        Submissions: ${quarterlyRecords.length} | 
        Total Score: <span style="font-size: 1.3em; font-weight: bold;">${totalWeightedScore}</span>
      </p>
    </div>
    
    <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h4 style="margin-top: 0;">📈 Progress Summary</h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
        <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
          <div style="font-size: 0.9em; color: #718096;">Total Entries</div>
          <div style="font-size: 1.8em; font-weight: bold; color: #2d3748;">${quarterlyRecords.length}</div>
        </div>
        ${Object.keys(frequencyMap).map(freq => `
          <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #48bb78;">
            <div style="font-size: 0.9em; color: #718096;">${freq.charAt(0).toUpperCase() + freq.slice(1)} Entries</div>
            <div style="font-size: 1.8em; font-weight: bold; color: #2d3748;">${frequencyMap[freq]}</div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <h4 style="margin-top: 0;">📊 Performance by Dimension</h4>
      <table class="summary-table" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f7fafc;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Dimension</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Measure</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Entries</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Avg Rating</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Total Actual</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Avg Target</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Weight %</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Weighted Score</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  summaryData.forEach((item, index) => {
    const bgColor = index % 2 === 0 ? '#ffffff' : '#f7fafc';
    html += `
      <tr style="background: ${bgColor};">
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;"><strong>${item.dimension}</strong></td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${item.measure}</td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">${item.entries}</td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;"><strong>${item.avgRating}</strong></td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">${item.totalActual}</td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">${item.avgTarget}</td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">${item.avgWeight}%</td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;"><strong style="color: #667eea;">${item.weightedScore}</strong></td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
        <tfoot>
          <tr style="background: #f7fafc; font-weight: bold;">
            <td colspan="7" style="padding: 15px; text-align: right; border-top: 2px solid #e2e8f0;">Total Weighted Score:</td>
            <td style="padding: 15px; text-align: center; border-top: 2px solid #e2e8f0;">
              <span style="font-size: 1.3em; color: #667eea;">${totalWeightedScore}</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
    
    <div style="margin-top: 25px; text-align: center;">
      <button onclick="exportQuarterlyReview('${employeeName}', '${year}', '${quarter}')" 
              style="background: #48bb78; color: white; border: none; padding: 12px 30px; 
                     border-radius: 6px; cursor: pointer; font-size: 1em; font-weight: 600;">
        📄 Export to PDF
      </button>
      <button onclick="viewDetailedHistory('${employeeEmail}', '${year}', '${quarter}')" 
              style="background: #667eea; color: white; border: none; padding: 12px 30px; 
                     border-radius: 6px; cursor: pointer; font-size: 1em; font-weight: 600; margin-left: 15px;">
        📜 View Detailed History
      </button>
    </div>
  `;
  
  wrap.innerHTML = html;
}

function exportQuarterlyReview(employeeName, year, quarter) {
  window.print();
}

function viewDetailedHistory(employeeEmail, year, quarter) {
  // Switch to Team Reports tab and load data
  const teamReportSelect = document.getElementById('teamReportSelect');
  if (teamReportSelect) {
    teamReportSelect.value = employeeEmail;
    const teamReportsBtn = document.getElementById('team-reports-tab');
    if (teamReportsBtn) {
      showTab('teamReportsTab', teamReportsBtn);
      loadTeamMemberReports();
    }
  }
}

// ========== SCORECARD TABLE BUILDING ============
function renderScorecardRows() {
  const tbody = document.getElementById("scorecardBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  let idx = 0;
  
  SCORECARD_DIMENSIONS.forEach(dim => {
    const dimRow = document.createElement("tr");
    dimRow.className = "scorecard-section-header";
    dimRow.innerHTML = `<td colspan="10">${dim.dimension}</td>`;
    tbody.appendChild(dimRow);

    dim.measures.forEach(m => {
      idx++;
      const currentIdx = idx;
      
      if (m.type === "financial") {
        // Financial row (unchanged)
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${dim.dimension}</td>
          <td><b>${m.measure}</b></td>
          <td><input type="number" id="target_budget_${currentIdx}" placeholder="Enter target budget" style="width:100%"></td>
          <td><input type="number" id="actual_spent_${currentIdx}" min="0" placeholder="Enter amount spent" style="width:100%"></td>
          <td><input type="text" id="pct_used_${currentIdx}" disabled style="width:80px;background:#eef;"></td>
          <td><input type="number" id="rating_${currentIdx}" min="1" max="5" step="0.1" disabled style="width:70px;background:#eef;"></td>
          <td><input type="number" id="weight_${currentIdx}" value="${m.weight || 30}" min="0" max="100" step="1" required style="width:65px"></td>
          <td><input type="text" id="weighted_${currentIdx}" disabled style="width:80px; background:#f5f5fd;"></td>
          <td><textarea id="comment_${currentIdx}" style="width:98%;"></textarea></td>
          <td><input type="url" id="evidence_${currentIdx}" placeholder="https://drive.google.com/..." style="width:100%; padding: 6px; font-size: 0.95em;"></td>
        `;
        tbody.appendChild(row);

        document.getElementById(`target_budget_${currentIdx}`).addEventListener('input', () => updateFinancialRow(currentIdx));
        document.getElementById(`actual_spent_${currentIdx}`).addEventListener('input', () => updateFinancialRow(currentIdx));
        document.getElementById(`weight_${currentIdx}`).addEventListener('input', () => updateFinancialRow(currentIdx));
      } else if (m.type === "peer-review") {
        // Peer Review row - read-only, auto-populated from peer feedback
        const row = document.createElement("tr");
        row.style.background = "#f0f9ff"; // Light blue background
        row.innerHTML = `
          <td>${dim.dimension}</td>
          <td><b>${m.measure}</b><br><span style="font-size:0.85em;color:#667eea;">Based on core values peer feedback</span></td>
          <td><input type="text" id="target_${currentIdx}" value="N/A" disabled style="width:100%;background:#eef;text-align:center;"></td>
          <td><input type="text" id="actual_${currentIdx}" value="Loading..." disabled style="width:100%;background:#eef;text-align:center;"></td>
          <td></td>
          <td><input type="number" id="rating_${currentIdx}" min="1" max="5" step="0.1" disabled style="width:70px;background:#eef;"></td>
          <td><input type="number" id="weight_${currentIdx}" value="${m.weight}" disabled style="width:65px;background:#eef;"></td>
          <td><input type="text" id="weighted_${currentIdx}" disabled style="width:80px; background:#f5f5fd;"></td>
          <td><textarea id="comment_${currentIdx}" disabled style="width:98%;background:#eef;" placeholder="Aggregated peer feedback"></textarea></td>
          <td><button type="button" onclick="viewPeerFeedbackDetails()" style="padding:6px 12px;font-size:0.9em;background:#667eea;">View Feedback</button></td>
        `;
        tbody.appendChild(row);
        
        // Store this as the peer review row index
        window.peerReviewRowIndex = currentIdx;
        
        // Load peer feedback score
        loadPeerFeedbackScore(currentIdx);
      } else {
        // Regular non-financial row
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${dim.dimension}</td>
          <td>${m.measure}</td>
          <td><input type="number" id="target_${currentIdx}" placeholder="Enter target" style="width:100%"></td>
          <td><input type="number" id="actual_${currentIdx}" placeholder="Enter actual" style="width:100%"></td>
          <td></td>
          <td><input type="number" id="rating_${currentIdx}" min="1" max="5" step="0.1" disabled style="width:70px;background:#eef;"></td>
          <td><input type="number" id="weight_${currentIdx}" value="${m.weight || 10}" min="0" max="100" step="1" required style="width:65px"></td>
          <td><input type="text" id="weighted_${currentIdx}" disabled style="width:80px; background:#f5f5fd;"></td>
          <td><textarea id="comment_${currentIdx}" style="width:98%;"></textarea></td>
          <td><input type="url" id="evidence_${currentIdx}" placeholder="https://drive.google.com/..." style="width:100%; padding: 6px; font-size: 0.95em;"></td>
        `;
        tbody.appendChild(row);

        document.getElementById(`target_${currentIdx}`).addEventListener('input', () => updateNonFinancialRow(currentIdx));
        document.getElementById(`actual_${currentIdx}`).addEventListener('input', () => updateNonFinancialRow(currentIdx));
        document.getElementById(`weight_${currentIdx}`).addEventListener('input', () => updateNonFinancialRow(currentIdx));
      }
    });
  });
  updateScoreSummary();
}
  // ========== LOAD PEER FEEDBACK SCORE ==========
function loadPeerFeedbackScore(rowIdx) {
  if (!userProfile) return;
  
  const year = document.getElementById("periodYear")?.value || new Date().getFullYear();
  const month = document.getElementById("periodMonth")?.value;
  
  if (!month) {
    document.getElementById(`actual_${rowIdx}`).value = "Select month first";
    return;
  }
  
  const quarter = "Q" + Math.ceil(parseInt(month) / 3);
  
  const url = APPS_SCRIPT_URL + '?action=getAggregatedPeerFeedback&employeeEmail=' + 
              encodeURIComponent(userProfile.email) + '&year=' + year + '&quarter=' + quarter + 
              '&callback=handlePeerFeedbackScore';
  
  window.handlePeerFeedbackScore = function(data) {
    console.log('Peer feedback score:', data);
    
    const actualEl = document.getElementById(`actual_${rowIdx}`);
    const ratingEl = document.getElementById(`rating_${rowIdx}`);
    const weightEl = document.getElementById(`weight_${rowIdx}`);
    const weightedEl = document.getElementById(`weighted_${rowIdx}`);
    const commentEl = document.getElementById(`comment_${rowIdx}`);
    
    if (data.count === 0) {
      actualEl.value = "No feedback yet";
      ratingEl.value = "";
      weightedEl.value = "";
      commentEl.value = "No peer feedback received for this quarter.";
    } else {
      const avgScore = parseFloat(data.averageScore);
      actualEl.value = avgScore.toFixed(2);
      ratingEl.value = avgScore.toFixed(1);
      
      const weight = parseFloat(weightEl.value) || 0;
      const weighted = ((avgScore * weight) / 100).toFixed(2);
      weightedEl.value = weighted;
      
      commentEl.value = `Based on ${data.count} peer review${data.count > 1 ? 's' : ''} evaluating 7 core values.`;
    }
    
    updateScoreSummary();
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}

function viewPeerFeedbackDetails() {
  if (userRole === 'Manager' || userRole === 'Admin') {
    // For managers, show detailed modal with aggregated feedback
    showManagerPeerFeedbackModal();
  } else {
    // For employees, show simple message
    alert("Peer feedback is anonymous. Your manager can view detailed feedback.\n\nYour score is based on the average of peer ratings across 7 ROSE core values.");
  }
}

function showManagerPeerFeedbackModal() {
  const year = document.getElementById("periodYear")?.value || new Date().getFullYear();
  const month = document.getElementById("periodMonth")?.value;
  
  if (!month) {
    alert("Please select a month first to view peer feedback.");
    return;
  }
  
  const quarter = "Q" + Math.ceil(parseInt(month) / 3);
  
  const url = APPS_SCRIPT_URL + '?action=getAggregatedPeerFeedback&employeeEmail=' + 
              encodeURIComponent(userProfile.email) + '&year=' + year + '&quarter=' + quarter + 
              '&callback=handleManagerPeerFeedbackView';
  
  window.handleManagerPeerFeedbackView = function(data) {
    console.log('Manager peer feedback view:', data);
    
    if (!data || data.count === 0) {
      alert("No peer feedback has been received for this quarter yet.");
      return;
    }
    
    // Validate and sanitize data
    const safeCount = parseInt(data.count) || 0;
    const safeYear = String(year).replace(/[<>&"']/g, '');
    const safeQuarter = String(quarter).replace(/[<>&"']/g, '');
    const avgScore = parseFloat(data.averageScore);
    
    if (isNaN(avgScore) || safeCount === 0) {
      alert("Invalid feedback data received.");
      return;
    }
    
    // Create modal to display detailed aggregated feedback
    const modal = document.createElement('div');
    modal.className = 'scorecard-modal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h2>📊 Internal Customer Perspective - Peer Feedback Results</h2>
          <button class="modal-close" onclick="this.closest('.scorecard-modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
            <p style="margin: 0; color: #2d3748;">
              <strong>Period:</strong> ${safeYear}, ${safeQuarter} | 
              <strong>Total Reviews:</strong> ${safeCount} | 
              <strong>Average Score:</strong> <span style="color: #667eea; font-size: 1.2em; font-weight: bold;">${avgScore.toFixed(2)}</span> / 5.0
            </p>
          </div>
          
          <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; font-size: 0.95em; color: #78350f;">
              ℹ️ <strong>Privacy Notice:</strong> This feedback is aggregated from multiple peer reviewers to maintain anonymity. 
              Individual reviewer identities are protected.
            </p>
          </div>
          
          <h3 style="color: #667eea; margin-top: 25px;">Core Values Assessment</h3>
          <p style="color: #718096; margin-bottom: 15px;">
            Peer reviewers evaluated performance across 7 ROSE core values. Below are the aggregated results:
          </p>
          
          <div id="feedbackBreakdown">
            ${generateFeedbackBreakdown(data)}
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #f7fafc; border-radius: 8px; border: 2px solid #e2e8f0;">
            <h4 style="margin-top: 0; color: #2d3748;">📝 Summary</h4>
            <p style="color: #4a5568; line-height: 1.6;">
              Based on <strong>${safeCount}</strong> peer review${safeCount > 1 ? 's' : ''}, 
              this employee has demonstrated strong alignment with ROSE core values, achieving an 
              average score of <strong style="color: #667eea;">${avgScore.toFixed(2)}</strong> out of 5.0.
            </p>
            <p style="color: #718096; font-size: 0.9em; margin: 10px 0 0 0;">
              This score contributes 25% to the overall performance scorecard as part of the Internal Customer Perspective.
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button onclick="this.closest('.scorecard-modal').remove()" class="btn-close-modal">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}

function generateFeedbackBreakdown(data) {
  // Generate a breakdown display for the aggregated feedback
  // Validate and parse the average score
  const avgScore = parseFloat(data.averageScore);
  
  // Check if avgScore is a valid number
  if (isNaN(avgScore) || avgScore < 0 || avgScore > 5) {
    return `
      <div style="margin: 20px 0; padding: 20px; background: #fee; border-radius: 8px; border-left: 4px solid #ef4444;">
        <p style="color: #991b1b; margin: 0;">
          ⚠️ Unable to display feedback breakdown. Invalid score data received.
        </p>
      </div>
    `;
  }
  
  const scorePercentage = (avgScore / 5.0) * 100;
  
  let rating = '';
  let ratingColor = '';
  
  if (avgScore >= 4.5) {
    rating = 'Exceptional';
    ratingColor = '#10b981';
  } else if (avgScore >= 4.0) {
    rating = 'Excellent';
    ratingColor = '#3b82f6';
  } else if (avgScore >= 3.5) {
    rating = 'Very Good';
    ratingColor = '#667eea';
  } else if (avgScore >= 3.0) {
    rating = 'Good';
    ratingColor = '#f59e0b';
  } else {
    rating = 'Needs Improvement';
    ratingColor = '#ef4444';
  }
  
  // Escape values for safe HTML insertion
  const safeRating = rating.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeScore = avgScore.toFixed(2);
  const safePercentage = scorePercentage.toFixed(1);
  
  return `
    <div style="margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span style="font-weight: 600; color: #2d3748;">Overall Performance Rating:</span>
        <span style="font-weight: 700; font-size: 1.3em; color: ${ratingColor};">${safeRating}</span>
      </div>
      
      <div style="background: #e2e8f0; border-radius: 10px; height: 30px; overflow: hidden; position: relative;">
        <div style="background: linear-gradient(90deg, ${ratingColor}, ${ratingColor}dd); height: 100%; width: ${safePercentage}%; 
                    border-radius: 10px; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; 
                    transition: width 0.5s ease;">
          <span style="color: white; font-weight: bold; font-size: 0.9em;">${safeScore}/5.0</span>
        </div>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">
        <h4 style="margin-top: 0; color: #2d3748;">ROSE Core Values Covered:</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
          <div style="padding: 8px; background: #f0f9ff; border-radius: 6px;">✅ Results-Oriented</div>
          <div style="padding: 8px; background: #f0f9ff; border-radius: 6px;">✅ Ownership & Accountability</div>
          <div style="padding: 8px; background: #f0f9ff; border-radius: 6px;">✅ Service Excellence</div>
          <div style="padding: 8px; background: #f0f9ff; border-radius: 6px;">✅ Collaboration</div>
          <div style="padding: 8px; background: #f0f9ff; border-radius: 6px;">✅ Innovation</div>
          <div style="padding: 8px; background: #f0f9ff; border-radius: 6px;">✅ Integrity</div>
          <div style="padding: 8px; background: #f0f9ff; border-radius: 6px;">✅ Continuous Learning</div>
        </div>
      </div>
    </div>
  `;
}
  // ========== LOAD EMPLOYEE TARGETS ==========
function loadEmployeeTargets() {
  if (!userProfile || !userRole) return;
  
  // Only load targets for employees and managers (not for own scorecard)
  const year = document.getElementById("periodYear")?.value || new Date().getFullYear();
  const month = document.getElementById("periodMonth")?.value;
  
  if (!month) {
    console.log("No month selected yet");
    return;
  }
  
  // Calculate quarter from month
  const quarter = "Q" + Math.ceil(parseInt(month) / 3);
  
  console.log(`Loading targets for ${userProfile.email}, Year: ${year}, Quarter: ${quarter}`);
  
  const url = APPS_SCRIPT_URL + '?action=getTargets&email=' + encodeURIComponent(userProfile.email) + 
              '&year=' + year + '&quarter=' + quarter + '&callback=handleEmployeeTargets';
  
  window.handleEmployeeTargets = function(targets) {
    console.log('Loaded targets:', targets);
    
    if (!targets || targets.length === 0) {
      // No targets set - show warning for employees
      if (userRole === 'Employee') {
        alert('Your manager has not set targets for this quarter yet. Please contact your manager before submitting your scorecard.');
        disableScorecard();
      }
      return;
    }
    
    // Apply targets to scorecard
    applyTargetsToScorecard(targets);
    enableScorecard();
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}
  // ========== LOAD WEEKLY HISTORY FOR CUMULATIVE TRACKING ==========
function loadWeeklyHistory() {
  if (!userProfile) return;
  
  const year = document.getElementById("periodYear")?.value || new Date().getFullYear();
  const month = document.getElementById("periodMonth")?.value;
  
  if (!month) return;
  
  const url = APPS_SCRIPT_URL + '?action=getWeeklyHistory&email=' + encodeURIComponent(userProfile.email) + 
              '&year=' + year + '&month=' + month + '&callback=handleWeeklyHistory';
  
  window.handleWeeklyHistory = function(history) {
    console.log('Weekly history:', history);
    weeklyHistory = history || [];
    
    // After loading history, load targets
    loadEmployeeTargets();
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}

// Helper: Get cumulative total for a measure
function getCumulativeTotal(dimension, measure) {
  let total = 0;
  
  weeklyHistory.forEach(entry => {
    if (entry.scores && Array.isArray(entry.scores)) {
      entry.scores.forEach(score => {
        if (score.dimension === dimension && score.measure === measure) {
          const actual = parseFloat(score.actual || score.actualSpent || 0);
          total += actual;
        }
      });
    }
  });
  
  return total;
}

// Helper: Get average rating for a measure
function getAverageRating(dimension, measure) {
  let totalRating = 0;
  let count = 0;
  
  weeklyHistory.forEach(entry => {
    if (entry.scores && Array.isArray(entry.scores)) {
      entry.scores.forEach(score => {
        if (score.dimension === dimension && score.measure === measure) {
          const rating = parseFloat(score.rating || 0);
          if (rating > 0) {
            totalRating += rating;
            count++;
          }
        }
      });
    }
  });
  
  return count > 0 ? (totalRating / count) : 0;
}

// Helper: Get weekly breakdown for a measure
function getWeeklyBreakdown(dimension, measure) {
  const breakdown = [];
  
  weeklyHistory.forEach(entry => {
    if (entry.scores && Array.isArray(entry.scores)) {
      entry.scores.forEach(score => {
        if (score.dimension === dimension && score.measure === measure) {
          breakdown.push({
            week: entry.week,
            actual: parseFloat(score.actual || score.actualSpent || 0),
            rating: parseFloat(score.rating || 0)
          });
        }
      });
    }
  });
  
  return breakdown;
}

function applyTargetsToScorecard(targets) {
  console.log('Applying targets to scorecard:', targets);
  
  renderScorecardRows();
  
  const targetsByDimension = {};
  targets.forEach(target => {
    const dim = target.Dimension || target.dimension || '';
    if (!targetsByDimension[dim]) {
      targetsByDimension[dim] = [];
    }
    targetsByDimension[dim].push(target);
  });
  
  const tbody = document.getElementById("scorecardBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  
  let idx = 0;
  
  const dimensions = ['Financial', 'Customer', 'Internal Process', 'Learning & Growth'];
  const currentWeek = parseInt(document.getElementById("periodWeek")?.value || 1);
  
  dimensions.forEach(dimensionName => {
    if (!targetsByDimension[dimensionName] && dimensionName !== 'Customer') {
      return;
    }
    
    const dimRow = document.createElement("tr");
    dimRow.className = "scorecard-section-header";
    dimRow.innerHTML = `<td colspan="10">${dimensionName}</td>`;
    tbody.appendChild(dimRow);
    
    // Customer dimension - Internal Customer
    if (dimensionName === 'Customer') {
      idx++;
      const currentIdx = idx;
      
      const row = document.createElement("tr");
      row.style.background = "#f0f9ff";
      row.innerHTML = `
        <td>${dimensionName}</td>
        <td><b>Internal Customer (Peer Review)</b><br><span style="font-size:0.85em;color:#667eea;">Quarterly - Based on core values peer feedback</span></td>
        <td><input type="text" id="target_${currentIdx}" value="N/A" disabled style="width:100%;background:#eef;text-align:center;"></td>
        <td><input type="text" id="actual_${currentIdx}" value="Loading..." disabled style="width:100%;background:#eef;text-align:center;"></td>
        <td></td>
        <td><input type="number" id="rating_${currentIdx}" min="1" max="5" step="0.1" disabled style="width:70px;background:#eef;"></td>
        <td><input type="number" id="weight_${currentIdx}" value="25" disabled style="width:65px;background:#eef;"></td>
        <td><input type="text" id="weighted_${currentIdx}" disabled style="width:80px; background:#f5f5fd;"></td>
        <td><textarea id="comment_${currentIdx}" disabled style="width:98%;background:#eef;" placeholder="Aggregated peer feedback"></textarea></td>
        <td><button type="button" onclick="viewPeerFeedbackDetails()" style="padding:6px 12px;font-size:0.9em;background:#667eea;">View Feedback</button></td>
      `;
      tbody.appendChild(row);
      
      window.peerReviewRowIndex = currentIdx;
      loadPeerFeedbackScore(currentIdx);
    }
    
    // Other measures
    if (targetsByDimension[dimensionName]) {
      targetsByDimension[dimensionName].forEach(target => {
        idx++;
        const currentIdx = idx;
        
        const measure = target.Measure || target.measure || '';
        const targetValue = parseFloat(target['Target Value'] || target.targetValue || 0);
        const weight = target.Weight || target.weight || '';
        const frequency = target.Frequency || target.frequency || 'Weekly';
        
        const isFinancial = dimensionName === 'Financial';
        const isCumulative = (dimensionName === 'Internal Process' || dimensionName === 'Learning & Growth');
        
        // Get historical data
        const cumulativeSoFar = isCumulative ? getCumulativeTotal(dimensionName, measure) : 0;
        const averageRating = !isCumulative ? getAverageRating(dimensionName, measure) : 0;
        const weeklyBreakdown = getWeeklyBreakdown(dimensionName, measure);
        
        // Calculate remaining
        const remaining = isCumulative ? Math.max(0, targetValue - cumulativeSoFar) : 0;
        const progressPct = isCumulative ? Math.min(100, (cumulativeSoFar / targetValue * 100)) : 0;
        
        // Calculate weeks remaining in period
        let weeksInPeriod = 4; // Default for monthly
        if (frequency === 'Quarterly') weeksInPeriod = 13;
        const weeksRemaining = Math.max(0, weeksInPeriod - weeklyHistory.length);
        
        if (isFinancial) {
          // Financial dimension - Show average performance
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${dimensionName}</td>
            <td><b>${measure}</b><br><span style="font-size:0.85em;color:#667eea;">${frequency}</span></td>
            <td>
              <input type="number" id="target_budget_${currentIdx}" value="${targetValue}" disabled style="width:100%;background:#eef;">
              ${weeklyBreakdown.length > 0 ? `
                <div style="font-size:0.8em;color:#718096;margin-top:5px;padding:5px;background:#fef3c7;border-radius:4px;">
                  📊 Average so far: <strong>${averageRating.toFixed(2)}</strong> rating<br>
                  ${weeklyBreakdown.map(w => `Week ${w.week}: ${w.actual.toFixed(0)} (${w.rating.toFixed(1)})`).join(', ')}
                </div>
              ` : ''}
            </td>
            <td><input type="number" id="actual_spent_${currentIdx}" min="0" placeholder="This week's amount" style="width:100%"></td>
            <td><input type="text" id="pct_used_${currentIdx}" disabled style="width:80px;background:#eef;"></td>
            <td><input type="number" id="rating_${currentIdx}" min="1" max="5" step="0.1" disabled style="width:70px;background:#eef;"></td>
            <td><input type="number" id="weight_${currentIdx}" value="${weight}" disabled style="width:65px;background:#eef;"></td>
            <td><input type="text" id="weighted_${currentIdx}" disabled style="width:80px; background:#f5f5fd;"></td>
            <td><textarea id="comment_${currentIdx}" style="width:98%;"></textarea></td>
            <td><input type="url" id="evidence_${currentIdx}" placeholder="https://drive.google.com/..." style="width:100%; padding: 6px; font-size: 0.95em;"></td>
          `;
          tbody.appendChild(row);
          
          document.getElementById(`actual_spent_${currentIdx}`).addEventListener('input', () => updateFinancialRow(currentIdx));
        } else if (isCumulative) {
          // Cumulative measures - Show running total
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${dimensionName}</td>
            <td>${measure}<br><span style="font-size:0.85em;color:#667eea;">${frequency} - Cumulative</span></td>
            <td>
              <input type="number" id="target_${currentIdx}" value="${targetValue}" disabled style="width:100%;background:#eef;">
              <div style="margin-top:8px;padding:8px;background:#dcfce7;border-radius:6px;border-left:3px solid #22c55e;">
                <div style="font-size:0.85em;font-weight:600;color:#14532d;margin-bottom:4px;">
                  📈 Cumulative Progress
                </div>
                <div style="font-size:0.9em;color:#166534;margin:3px 0;">
                  <strong>So far:</strong> ${cumulativeSoFar.toFixed(1)} ${dimensionName === 'Learning & Growth' ? 'hours' : 'units'}
                </div>
                <div style="font-size:0.9em;color:#166534;margin:3px 0;">
                  <strong>Remaining:</strong> ${remaining.toFixed(1)} ${dimensionName === 'Learning & Growth' ? 'hours' : 'units'}
                </div>
                <div style="font-size:0.85em;color:#64748b;margin:3px 0;">
                  <strong>Weeks left:</strong> ${weeksRemaining} ${weeksRemaining === 1 ? 'week' : 'weeks'}
                </div>
                <div style="margin-top:6px;background:#fff;border-radius:4px;height:20px;overflow:hidden;">
                  <div style="background:#22c55e;height:100%;width:${progressPct}%;transition:width 0.3s;display:flex;align-items:center;justify-content:center;color:white;font-size:0.75em;font-weight:600;">
                    ${progressPct.toFixed(0)}%
                  </div>
                </div>
                ${weeklyBreakdown.length > 0 ? `
                  <div style="font-size:0.75em;color:#64748b;margin-top:6px;padding-top:6px;border-top:1px solid #86efac;">
                    ${weeklyBreakdown.map(w => `Week ${w.week}: +${w.actual.toFixed(1)}`).join(' • ')}
                  </div>
                ` : ''}
              </div>
            </td>
            <td>
              <input type="number" id="actual_${currentIdx}" placeholder="Add this week" style="width:100%;">
              <div style="font-size:0.8em;color:#667eea;margin-top:3px;">
                New total: <span id="new_total_${currentIdx}">${cumulativeSoFar.toFixed(1)}</span>
              </div>
              <input type="hidden" id="cumulative_${currentIdx}" value="${cumulativeSoFar}">
            </td>
            <td></td>
            <td><input type="number" id="rating_${currentIdx}" min="1" max="5" step="0.1" disabled style="width:70px;background:#eef;"></td>
            <td><input type="number" id="weight_${currentIdx}" value="${weight}" disabled style="width:65px;background:#eef;"></td>
            <td><input type="text" id="weighted_${currentIdx}" disabled style="width:80px; background:#f5f5fd;"></td>
            <td><textarea id="comment_${currentIdx}" style="width:98%;"></textarea></td>
            <td><input type="url" id="evidence_${currentIdx}" placeholder="https://drive.google.com/..." style="width:100%; padding: 6px; font-size: 0.95em;"></td>
          `;
          tbody.appendChild(row);
          
          // Add listener for cumulative calculation
          document.getElementById(`actual_${currentIdx}`).addEventListener('input', () => updateCumulativeRow(currentIdx));
        } else {
          // Non-cumulative, non-financial (Customer External)
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${dimensionName}</td>
            <td>${measure}<br><span style="font-size:0.85em;color:#667eea;">${frequency}</span></td>
            <td>
              <input type="number" id="target_${currentIdx}" value="${targetValue}" disabled style="width:100%;background:#eef;">
              ${weeklyBreakdown.length > 0 ? `
                <div style="font-size:0.8em;color:#718096;margin-top:5px;padding:5px;background:#fef3c7;border-radius:4px;">
                  📊 Average so far: <strong>${averageRating.toFixed(2)}</strong> rating<br>
                  ${weeklyBreakdown.map(w => `Week ${w.week}: ${w.actual.toFixed(1)} (${w.rating.toFixed(1)})`).join(', ')}
                </div>
              ` : ''}
            </td>
            <td><input type="number" id="actual_${currentIdx}" placeholder="This week" style="width:100%"></td>
            <td></td>
            <td><input type="number" id="rating_${currentIdx}" min="1" max="5" step="0.1" disabled style="width:70px;background:#eef;"></td>
            <td><input type="number" id="weight_${currentIdx}" value="${weight}" disabled style="width:65px;background:#eef;"></td>
            <td><input type="text" id="weighted_${currentIdx}" disabled style="width:80px; background:#f5f5fd;"></td>
            <td><textarea id="comment_${currentIdx}" style="width:98%;"></textarea></td>
            <td><input type="url" id="evidence_${currentIdx}" placeholder="https://drive.google.com/..." style="width:100%; padding: 6px; font-size: 0.95em;"></td>
          `;
          tbody.appendChild(row);
          
          document.getElementById(`actual_${currentIdx}`).addEventListener('input', () => updateNonFinancialRow(currentIdx));
        }
      });
    }
  });
  
  updateScoreSummary();
}

function disableScorecard() {
  const tbody = document.getElementById("scorecardBody");
  if (tbody) tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:30px;color:#e53e3e;font-size:1.1em;"><strong>⚠️ Scorecard Disabled</strong><br><br>Your manager has not set quarterly targets yet. Please contact your manager to set up your performance targets before you can submit your scorecard.</td></tr>`;
  
  const submitBtn = document.querySelector('#scorecardForm button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  
  document.getElementById("scoreSummary").innerHTML = '';
}

function enableScorecard() {
  const submitBtn = document.querySelector('#scorecardForm button[type="submit"]');
  if (submitBtn) submitBtn.disabled = false;
}

function calcFinancialRating(targetBudget, actualSpent) {
  if (targetBudget === 0 || actualSpent === 0) return 0;
  
  let rating = 3.0;
  
  if (actualSpent < targetBudget) {
    rating = 3.0 + 2.0 * ((targetBudget - actualSpent) / targetBudget);
  } else if (actualSpent > targetBudget) {
    rating = 3.0 - 2.0 * ((actualSpent - targetBudget) / targetBudget);
  }
  
  rating = Math.max(1.0, Math.min(5.0, rating));
  return Number(rating.toFixed(1));
}

function updateFinancialRow(idx) {
  const targetBudgetEl = document.getElementById(`target_budget_${idx}`);
  const actualSpentEl = document.getElementById(`actual_spent_${idx}`);
  const pctUsedEl = document.getElementById(`pct_used_${idx}`);
  const ratingEl = document.getElementById(`rating_${idx}`);
  const weightEl = document.getElementById(`weight_${idx}`);
  const weightedEl = document.getElementById(`weighted_${idx}`);

  const targetBudget = parseFloat(targetBudgetEl.value) || 0;
  const actualSpent = parseFloat(actualSpentEl.value) || 0;
  const weight = parseFloat(weightEl.value) || 0;

  let pctUsed = targetBudget > 0 ? (actualSpent / targetBudget * 100) : 0;
  pctUsedEl.value = pctUsed ? pctUsed.toFixed(1) + '%' : '';

  const rating = calcFinancialRating(targetBudget, actualSpent);
  ratingEl.value = rating;

  const weighted = ((rating * weight) / 100).toFixed(2);
  weightedEl.value = isNaN(weighted) ? "" : weighted;

  updateScoreSummary();
}

function calcNonFinancialRating(target, actual) {
  if (target === 0 || actual === 0) return 0;
  
  let rating = 3.0;
  
  if (actual >= target) {
    rating = 3.0 + 2.0 * ((actual - target) / target);
  } else {
    rating = 3.0 - 2.0 * ((target - actual) / target);
  }
  
  rating = Math.max(1.0, Math.min(5.0, rating));
  return Number(rating.toFixed(1));
}

function updateNonFinancialRow(idx) {
  const targetEl = document.getElementById(`target_${idx}`);
  const actualEl = document.getElementById(`actual_${idx}`);
  const ratingEl = document.getElementById(`rating_${idx}`);
  const weightEl = document.getElementById(`weight_${idx}`);
  const weightedEl = document.getElementById(`weighted_${idx}`);

  const target = parseFloat(targetEl.value) || 0;
  const actual = parseFloat(actualEl.value) || 0;
  const weight = parseFloat(weightEl.value) || 0;

  const rating = calcNonFinancialRating(target, actual);
  ratingEl.value = rating;

  const weighted = ((rating * weight) / 100).toFixed(2);
  weightedEl.value = isNaN(weighted) ? "" : weighted;

  updateScoreSummary();
}
  function updateCumulativeRow(idx) {
  const targetEl = document.getElementById(`target_${idx}`);
  const actualEl = document.getElementById(`actual_${idx}`);
  const cumulativeEl = document.getElementById(`cumulative_${idx}`);
  const newTotalEl = document.getElementById(`new_total_${idx}`);
  const ratingEl = document.getElementById(`rating_${idx}`);
  const weightEl = document.getElementById(`weight_${idx}`);
  const weightedEl = document.getElementById(`weighted_${idx}`);

  const target = parseFloat(targetEl.value) || 0;
  const thisWeek = parseFloat(actualEl.value) || 0;
  const soFar = parseFloat(cumulativeEl.value) || 0;
  const weight = parseFloat(weightEl.value) || 0;

  // Calculate new total
  const newTotal = soFar + thisWeek;
  newTotalEl.textContent = newTotal.toFixed(1);
  newTotalEl.style.fontWeight = 'bold';
  newTotalEl.style.color = newTotal >= target ? '#22c55e' : '#667eea';

  // Calculate rating based on new total vs target
  const rating = calcNonFinancialRating(target, newTotal);
  ratingEl.value = rating.toFixed(1);

  const weighted = ((rating * weight) / 100).toFixed(2);
  weightedEl.value = isNaN(weighted) ? "" : weighted;

  updateScoreSummary();
}

function getScoreInputsCount() {
  const rows = document.querySelectorAll('#scorecardBody tr:not(.scorecard-section-header)');
  return rows.length;
}

function updateScoreSummary() {
  const n = getScoreInputsCount();
  let totalWeighted = 0, totalWeight = 0;
  for (let i = 1; i <= n; ++i) {
    const weighted = parseFloat(document.getElementById(`weighted_${i}`)?.value) || 0;
    const weight = parseFloat(document.getElementById(`weight_${i}`)?.value) || 0;
    totalWeighted += weighted;
    totalWeight += weight;
  }
  let finalScore = totalWeighted;
  let summary = `<b>Total Weighted Score:</b> ${finalScore.toFixed(2)}<br>`;
  summary += `<b>Total Weight:</b> ${totalWeight}`;
  document.getElementById("scoreSummary").innerHTML = summary;
}

function resetScorecard() {
  renderScorecardRows();
  document.getElementById("scoreSummary").innerHTML = "";
}

function getScorecardFields() {
  const results = [];
  const n = getScoreInputsCount();
  
  for (let i = 1; i <= n; ++i) {
    const rows = document.querySelectorAll('#scorecardBody tr:not(.scorecard-section-header)');
    const row = rows[i - 1];
    if (!row) continue;
    
    const cells = row.cells;
    const dim = cells[0]?.textContent || "";
    const measure = cells[1]?.textContent || "";
    
    const comment = document.getElementById(`comment_${i}`)?.value || "";
    const evidence = document.getElementById(`evidence_${i}`)?.value || "";
    
    let obj = { dimension: dim, measure: measure, comment: comment, evidence: evidence };
    
    if (dim === "Financial") {
      obj.targetBudget = document.getElementById(`target_budget_${i}`)?.value || "";
      obj.actualSpent = document.getElementById(`actual_spent_${i}`)?.value || "";
      obj.pctUsed = document.getElementById(`pct_used_${i}`)?.value || "";
    } else {
      obj.target = document.getElementById(`target_${i}`)?.value || "";
      obj.actual = document.getElementById(`actual_${i}`)?.value || "";
    }
    
    obj.rating = document.getElementById(`rating_${i}`)?.value || "";
    obj.weight = document.getElementById(`weight_${i}`)?.value || "";
    obj.weighted = document.getElementById(`weighted_${i}`)?.value || "";
    
    results.push(obj);
  }
  
  return results;
}

function autofillUserDetails() {
  if (!userProfile) return;
  
  console.log('Fetching user details for:', userProfile.email);
  
  const url = APPS_SCRIPT_URL + '?action=lookupUser&email=' + encodeURIComponent(userProfile.email) + '&callback=handleUserData';
  
  window.handleUserData = function(data) {
    console.log('Received data:', data);
    if (Array.isArray(data) && data.length > 0) {
      const user = data[0];
      document.getElementById("employeeName").value = user["Full Name"] || "";
      document.getElementById("employeeJob").value = user["Title"] || "";
      document.getElementById("division").value = user["Division"] || "";
      document.getElementById("level").value = user["Level"] || "";
    } else {
      console.log('No user data found for email:', userProfile.email);
    }
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}

// ========== PROGRESS FREQUENCY SELECTOR ==========
function updateProgressFrequency() {
  const frequency = document.getElementById('progressFrequency')?.value;
  const weekField = document.getElementById('periodWeek');
  const monthField = document.getElementById('periodMonth');
  const infoDiv = document.getElementById('frequencyInfo');
  const messageSpan = document.getElementById('frequencyMessage');
  
  if (!frequency || !infoDiv || !messageSpan) return;
  
  infoDiv.style.display = 'block';
  
  if (frequency === 'weekly') {
    weekField.required = true;
    weekField.disabled = false;
    messageSpan.textContent = 'You are entering weekly progress. Select the specific week within the month.';
  } else if (frequency === 'monthly') {
    weekField.required = false;
    weekField.disabled = true;
    weekField.value = '1'; // Default to week 1 for monthly
    messageSpan.textContent = 'You are entering monthly progress. Progress will be recorded for the entire month.';
  } else if (frequency === 'quarterly') {
    weekField.required = false;
    weekField.disabled = true;
    weekField.value = '1'; // Default to week 1 for quarterly
    messageSpan.textContent = 'You are entering quarterly progress. Progress will be recorded for the entire quarter based on the selected month.';
  }
}

function saveScorecard() {
  if (!userProfile) {
    alert("You must be signed in to submit a scorecard.");
    return;
  }
  
  if (!document.getElementById("employeeName").value.trim() ||
      !document.getElementById("employeeJob").value.trim() ||
      !document.getElementById("division").value.trim() ||
      !document.getElementById("periodMonth").value ||
      !document.getElementById("periodWeek").value) {
    alert("Please fill out all required fields.");
    return;
  }
  
  const year = document.getElementById("periodYear").value;
  const month = document.getElementById("periodMonth").value;
  const week = document.getElementById("periodWeek").value;
  
  const isDuplicate = window.currentReports && window.currentReports.some(rec => {
    return (rec.Year || rec.year) == year && 
           (rec.Month || rec.month) == month && 
           (rec.Week || rec.week) == week;
  });
  
  if (isDuplicate) {
    alert(`You have already submitted a scorecard for Year ${year}, Month ${month}, Week ${week}.\n\nPlease select a different week or month.`);
    return;
  }
  
  const n = getScoreInputsCount();

  let totalWeight = 0;
  for (let i = 1; i <= n; ++i) {
    const weightValue = document.getElementById(`weight_${i}`)?.value;
    if (!weightValue || weightValue.trim() === "") {
      alert("Please fill in all Weights.");
      return;
    }
    totalWeight += parseFloat(weightValue) || 0;
  }

  if (Math.abs(totalWeight - 100) > 0.01) {
    alert(`Weight percentages must add up to 100%.\n\nCurrent total: ${totalWeight.toFixed(2)}%\n\nPlease adjust the weights before submitting.`);
    return;
  }

  const progressFrequency = document.getElementById("progressFrequency")?.value || 'weekly';
  
  const data = {
    userEmail: userProfile.email,
    name: document.getElementById("employeeName").value,
    job: document.getElementById("employeeJob").value,
    division: document.getElementById("division").value,
    level: document.getElementById("level").value,
    year: year,
    month: month,
    week: week,
    progressFrequency: progressFrequency,
    quarter: 'Q' + Math.ceil(parseInt(month) / 3),
    scores: getScorecardFields()
  };

  console.log("Sending data:", data);

  const jsonData = JSON.stringify(data);
  const chunkSize = 1500;
  const chunks = [];
  for (let i = 0; i < jsonData.length; i += chunkSize) {
    chunks.push(jsonData.substring(i, i + chunkSize));
  }
  
  let url = APPS_SCRIPT_URL + '?action=saveScorecard&callback=handleSaveResponse';
  chunks.forEach((chunk, index) => {
    url += '&chunk' + index + '=' + encodeURIComponent(chunk);
  });
  
  window.handleSaveResponse = function(resp) {
    console.log("Response data:", resp);
    if (resp.result === "success") {
      if (typeof showToast === 'function') {
        showToast("✅ Scorecard saved successfully!", "success");
      } else {
        alert("Scorecard saved successfully!");
      }
      resetScorecard();
      loadUserReports();
      loadDashboard();
    } else {
      if (typeof showToast === 'function') {
        showToast("❌ Error saving scorecard: " + (resp.message || "Unknown error"), "error");
      } else {
        alert("Error saving scorecard: " + (resp.message || "Unknown error"));
      }
      console.error("Server error:", resp);
    }
  };
  
  const script = document.createElement('script');
  script.src = url;
  script.onerror = function() {
    if (typeof showToast === 'function') {
      showToast("❌ Failed to save scorecard. The data might be too large.", "error");
    } else {
      alert("Error: Failed to save scorecard. The data might be too large.");
    }
  };
  document.body.appendChild(script);
}

function loadUserReports() {
  if (!userProfile) return;
  
  const url = APPS_SCRIPT_URL + '?email=' + encodeURIComponent(userProfile.email) + '&callback=handleReportsData';
  
  window.handleReportsData = function(records) {
    renderReportsTable(records, 'reportsTableWrap');
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}

function renderReportsTable(records, wrapId) {
  wrapId = wrapId || 'reportsTableWrap';
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  
  if (!records || records.length === 0) {
    wrap.innerHTML = `<div class="empty-msg">No submissions yet.</div>`;
    return;
  }
  
  let html = `<table class="reports-table"><thead><tr>
    <th>Timestamp</th><th>Year</th><th>Month</th><th>Week</th><th>Division</th><th>Job</th><th>Level</th>
    <th>Weighted Score</th><th>Actions</th>
  </tr></thead><tbody>`;
  
  records.forEach((rec, index) => {
    let weightedScore = '';
    if (rec.Scores || rec.scores) {
      try {
        let scoresData = rec.Scores || rec.scores;
        let scoresArr = typeof scoresData === 'string' ? JSON.parse(scoresData) : scoresData;
        
        if (Array.isArray(scoresArr)) {
          weightedScore = scoresArr.reduce((sum, s) => {
            return sum + (parseFloat(s.weighted) || 0);
          }, 0).toFixed(2);
        }
      } catch (e) {
        console.error("Error parsing scores:", e);
      }
    }
    
    let timestamp = rec.Timestamp || rec.timestamp || "";
    if (timestamp && typeof timestamp === 'object' && timestamp.toLocaleString) {
      timestamp = timestamp.toLocaleString();
    }
    
    html += `<tr>
      <td>${timestamp}</td>
      <td>${rec.Year || rec.year || ""}</td>
      <td>${rec.Month || rec.month || ""}</td>
      <td>${rec.Week || rec.week || ""}</td>
      <td>${rec.Division || rec.division || ""}</td>
      <td>${rec.Job || rec.job || ""}</td>
      <td>${rec.Level || rec.level || ""}</td>
      <td><strong>${weightedScore}</strong></td>
      <td><button class="btn-view" onclick="viewScorecardDetails(${index}, '${wrapId}')">View Details</button></td>
    </tr>`;
  });
  
  html += `</tbody></table>`;
  wrap.innerHTML = html;
  
  if (wrapId === 'reportsTableWrap') {
    window.currentReports = records;
  } else {
    window.teamCurrentReports = records;
  }
}

function viewScorecardDetails(index, wrapId) {
  const record = (wrapId === 'reportsTableWrap') ? window.currentReports[index] : window.teamCurrentReports[index];
  if (!record) {
    alert("Could not load scorecard details.");
    return;
  }
  
  let scoresData = record.Scores || record.scores;
  let scoresArr = [];
  try {
    scoresArr = typeof scoresData === 'string' ? JSON.parse(scoresData) : scoresData;
  } catch (e) {
    alert("Error loading scorecard data.");
    return;
  }
  
  // Check if user is a manager viewing team member data
  const isManagerView = (userRole === 'Manager' || userRole === 'Admin') && wrapId === 'teamReportsWrap';
  const employeeEmail = record['User Email'] || record.userEmail || '';
  
  const modal = document.createElement('div');
  modal.className = 'scorecard-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Scorecard Details</h2>
        <button class="modal-close" onclick="this.closest('.scorecard-modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="detail-info">
          <p><strong>Employee:</strong> ${record.Name || record.name || ''}</p>
          <p><strong>Job Title:</strong> ${record.Job || record.job || ''}</p>
          <p><strong>Division:</strong> ${record.Division || record.division || ''}</p>
          <p><strong>Level:</strong> ${record.Level || record.level || ''}</p>
          <p><strong>Period:</strong> Year ${record.Year || record.year}, Month ${record.Month || record.month}, Week ${record.Week || record.week}</p>
          <p><strong>Submitted:</strong> ${record.Timestamp || record.timestamp || ''}</p>
        </div>
        
        <h3>Performance Breakdown</h3>
        <table class="details-table">
          <thead>
            <tr>
              <th>Dimension</th>
              <th>Measure</th>
              <th>Target</th>
              <th>Actual</th>
              <th>Rating</th>
              <th>Weight (%)</th>
              <th>Weighted Score</th>
              <th>Comment</th>
              <th>Evidence</th>
                        </tr>
          </thead>
          <tbody>
            ${scoresArr.map(score => {
              // Check if this is an Internal Customer (Peer Review) row
              const isPeerReview = score.measure && score.measure.includes('Internal Customer') && score.measure.includes('Peer Review');
              
              return `
              <tr ${isPeerReview && isManagerView ? 'style="background: #f0f9ff;"' : ''}>
                <td><strong>${score.dimension}</strong></td>
                <td>${score.measure}</td>
                <td>${score.target || score.targetBudget || ''}</td>
                <td>${score.actual || score.actualSpent || ''}</td>
                <td>${score.rating}</td>
                <td>${score.weight}%</td>
                <td><strong>${score.weighted}</strong></td>
                <td>${score.comment || '-'}</td>
                <td>${isPeerReview && isManagerView && employeeEmail && (record.Year || record.year) && (record.Month || record.month) ? 
                  `<button onclick="viewTeamMemberPeerFeedback('${employeeEmail.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}', '${record.Year || record.year}', '${record.Month || record.month}')" 
                          style="padding: 6px 12px; font-size: 0.9em; background: #667eea; color: white; border: none; 
                          border-radius: 6px; cursor: pointer;">View Detailed Feedback</button>` : 
                  isPeerReview && isManagerView ? 'Data unavailable' :
                  (score.evidence ? `<a href="${score.evidence}" target="_blank" style="color: #667eea; text-decoration: underline;">View Evidence</a>` : '-')
                }</td>
              </tr>
            `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="6" style="text-align: right;"><strong>Total Weighted Score:</strong></td>
              <td colspan="3"><strong style="font-size: 1.2em; color: #5a67d8;">
                ${scoresArr.reduce((sum, s) => sum + (parseFloat(s.weighted) || 0), 0).toFixed(2)}
              </strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="modal-footer">
        <button onclick="this.closest('.scorecard-modal').remove()" class="btn-close-modal">Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function viewTeamMemberPeerFeedback(employeeEmail, year, month) {
  // Validate inputs
  if (!employeeEmail || !year || !month) {
    alert("Unable to load feedback. Missing required parameters.");
    return;
  }
  
  const monthNum = parseInt(month);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    alert("Invalid month value.");
    return;
  }
  
  const quarter = "Q" + Math.ceil(monthNum / 3);
  
  const url = APPS_SCRIPT_URL + '?action=getAggregatedPeerFeedback&employeeEmail=' + 
              encodeURIComponent(employeeEmail) + '&year=' + encodeURIComponent(year) + '&quarter=' + quarter + 
              '&callback=handleTeamMemberFeedbackView';
  
  window.handleTeamMemberFeedbackView = function(data) {
    console.log('Team member peer feedback view:', data);
    
    if (!data || data.count === 0) {
      alert("No peer feedback has been received for this employee in this quarter.");
      return;
    }
    
    // Validate and sanitize data
    const safeCount = parseInt(data.count) || 0;
    const safeYear = String(year).replace(/[<>&"']/g, '');
    const safeQuarter = String(quarter).replace(/[<>&"']/g, '');
    const avgScore = parseFloat(data.averageScore);
    
    if (isNaN(avgScore) || safeCount === 0) {
      alert("Invalid feedback data received.");
      return;
    }
    
    // Create modal to display detailed aggregated feedback
    const modal = document.createElement('div');
    modal.className = 'scorecard-modal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h2>📊 Internal Customer Perspective - Peer Feedback Results</h2>
          <button class="modal-close" onclick="this.closest('.scorecard-modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
            <p style="margin: 0; color: #2d3748;">
              <strong>Period:</strong> ${safeYear}, ${safeQuarter} | 
              <strong>Total Reviews:</strong> ${safeCount} | 
              <strong>Average Score:</strong> <span style="color: #667eea; font-size: 1.2em; font-weight: bold;">${avgScore.toFixed(2)}</span> / 5.0
            </p>
          </div>
          
          <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; font-size: 0.95em; color: #78350f;">
              ℹ️ <strong>Privacy Notice:</strong> This feedback is aggregated from multiple peer reviewers to maintain anonymity. 
              Individual reviewer identities are protected.
            </p>
          </div>
          
          <h3 style="color: #667eea; margin-top: 25px;">Core Values Assessment</h3>
          <p style="color: #718096; margin-bottom: 15px;">
            Peer reviewers evaluated performance across 7 ROSE core values. Below are the aggregated results:
          </p>
          
          <div id="feedbackBreakdown">
            ${generateFeedbackBreakdown(data)}
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #f7fafc; border-radius: 8px; border: 2px solid #e2e8f0;">
            <h4 style="margin-top: 0; color: #2d3748;">📝 Summary</h4>
            <p style="color: #4a5568; line-height: 1.6;">
              Based on <strong>${safeCount}</strong> peer review${safeCount > 1 ? 's' : ''}, 
              this employee has demonstrated strong alignment with ROSE core values, achieving an 
              average score of <strong style="color: #667eea;">${avgScore.toFixed(2)}</strong> out of 5.0.
            </p>
            <p style="color: #718096; font-size: 0.9em; margin: 10px 0 0 0;">
              This score contributes 25% to the overall performance scorecard as part of the Internal Customer Perspective.
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button onclick="this.closest('.scorecard-modal').remove()" class="btn-close-modal">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}

function loadDashboard(wrapId) {
  if (!userProfile) return;
  
  wrapId = wrapId || 'dashboardWrap';
  const url = APPS_SCRIPT_URL + '?email=' + encodeURIComponent(userProfile.email) + '&callback=handleDashboardData';
  
  window.handleDashboardData = function(records) {
    renderDashboard(records, wrapId);
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}

function renderDashboard(records, wrapId) {
  wrapId = wrapId || 'dashboardWrap';
  
  // Use enhanced dashboard with charts if available
  if (typeof renderDashboardWithCharts === 'function') {
    renderDashboardWithCharts(records, wrapId);
    return;
  }
  
  // Fallback to original dashboard
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  
  if (!records || records.length === 0) {
    wrap.innerHTML = `<div class="empty-msg">No data yet.</div>`;
    return;
  }
  
  const dataByYear = {};
  const dataByQuarter = {};
  const dataByMonth = {};
  
  records.forEach(rec => {
    let scoresData = rec.Scores || rec.scores;
    if (!scoresData) return;
    
    try {
      let arr = typeof scoresData === 'string' ? JSON.parse(scoresData) : scoresData;
      
      if (Array.isArray(arr)) {
        let score = arr.reduce((sum, s) => sum + (parseFloat(s.weighted) || 0), 0);
        if (isNaN(score)) return;
        
        const year = rec.Year || rec.year || '2025';
        const month = rec.Month || rec.month || '1';
        const quarter = Math.ceil(parseInt(month) / 3);
        
        if (!dataByYear[year]) dataByYear[year] = [];
        dataByYear[year].push(score);
        
        const qKey = `${year}-Q${quarter}`;
        if (!dataByQuarter[qKey]) dataByQuarter[qKey] = [];
        dataByQuarter[qKey].push(score);
        
        const mKey = `${year}-${String(month).padStart(2, '0')}`;
        if (!dataByMonth[mKey]) dataByMonth[mKey] = [];
        dataByMonth[mKey].push(score);
      }
    } catch (e) {
      console.error("Error parsing scores:", e);
    }
  });
  
  const calculateAvg = (arr) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : '0.00';
  
  let html = `<div class="dashboard-container">`;
  
  const allScores = Object.values(dataByYear).flat();
  html += `<div class="dashboard-card overall-card">
    <h3>📊 Overall Performance</h3>
    <div class="metric-grid">
      <div class="metric-item">
        <span class="metric-label">Total Submissions</span>
        <span class="metric-value">${allScores.length}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Average Score</span>
        <span class="metric-value">${calculateAvg(allScores)}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Best Score</span>
        <span class="metric-value">${allScores.length > 0 ? Math.max(...allScores).toFixed(2) : '0.00'}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Lowest Score</span>
        <span class="metric-value">${allScores.length > 0 ? Math.min(...allScores).toFixed(2) : '0.00'}</span>
      </div>
    </div>
  </div>`;
  
  html += `<div class="dashboard-card">
    <h3>📅 Yearly Summary</h3>
    <table class="summary-table">
      <thead>
        <tr>
          <th>Year</th>
          <th>Submissions</th>
          <th>Average Score</th>
          <th>Best Score</th>
        </tr>
      </thead>
      <tbody>`;
  
  Object.keys(dataByYear).sort().reverse().forEach(year => {
    const scores = dataByYear[year];
    html += `<tr>
      <td><strong>${year}</strong></td>
      <td>${scores.length}</td>
      <td>${calculateAvg(scores)}</td>
      <td>${Math.max(...scores).toFixed(2)}</td>
    </tr>`;
  });
  
  html += `</tbody></table></div>`;
  
  html += `<div class="dashboard-card">
    <h3>📆 Quarterly Summary</h3>
    <table class="summary-table">
      <thead>
        <tr>
          <th>Quarter</th>
          <th>Submissions</th>
          <th>Average Score</th>
          <th>Best Score</th>
        </tr>
      </thead>
      <tbody>`;
  
  Object.keys(dataByQuarter).sort().reverse().forEach(quarter => {
    const scores = dataByQuarter[quarter];
    html += `<tr>
      <td><strong>${quarter}</strong></td>
      <td>${scores.length}</td>
      <td>${calculateAvg(scores)}</td>
      <td>${Math.max(...scores).toFixed(2)}</td>
    </tr>`;
  });
  
  html += `</tbody></table></div>`;
  
  html += `<div class="dashboard-card">
    <h3>📈 Monthly Summary</h3>
    <table class="summary-table">
      <thead>
        <tr>
          <th>Month</th>
          <th>Submissions</th>
          <th>Average Score</th>
          <th>Best Score</th>
        </tr>
      </thead>
      <tbody>`;
  
  Object.keys(dataByMonth).sort().reverse().forEach(month => {
    const scores = dataByMonth[month];
    const [year, monthNum] = month.split('-');
    const monthName = new Date(year, parseInt(monthNum) - 1).toLocaleString('default', { month: 'long' });
    
    html += `<tr>
      <td><strong>${monthName} ${year}</strong></td>
      <td>${scores.length}</td>
      <td>${calculateAvg(scores)}</td>
      <td>${Math.max(...scores).toFixed(2)}</td>
    </tr>`;
  });
  
  html += `</tbody></table></div>`;
  html += `</div>`;
  
  wrap.innerHTML = html;
}
  // ========== PEER FEEDBACK SYSTEM ==========

function loadPeerFeedbackTab() {
  loadPendingFeedbackRequests();
}

function loadPendingFeedbackRequests() {
  if (!userProfile) return;
  
  const url = APPS_SCRIPT_URL + '?action=getPendingFeedback&email=' + encodeURIComponent(userProfile.email) + '&callback=handlePendingFeedback';
  
  window.handlePendingFeedback = function(requests) {
    console.log('Pending feedback requests:', requests);
    renderPendingFeedback(requests);
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}

function renderPendingFeedback(requests) {
  const wrap = document.getElementById('peerFeedbackWrap');
  if (!wrap) return;
  
  if (!requests || requests.length === 0) {
    wrap.innerHTML = `<div class="empty-msg">✅ No pending peer feedback requests.<br><br>You're all caught up!</div>`;
    return;
  }
  
  let html = '<div style="display: grid; gap: 25px;">';
  
  requests.forEach(request => {
    const coreValues = [
      {
        id: 'christCentered',
        name: 'Christ-Centered',
        description: 'Seeks to alleviate spiritual suffering by embracing the way of Christ and discerning the will of God in everything. Works for God, with God, and to glorify God.'
      },
      {
        id: 'holisticInvestment',
        name: 'Holistic Investment in Women',
        description: 'Supports ROSE women as leaders in their emotional, spiritual, and physical well-being so they can serve with strength.'
      },
      {
        id: 'trustedRelationships',
        name: 'Cultivating Trusted Relationships',
        description: 'Builds trusted, lasting relationships with people served, donors, and partner community. Trust is the foundation of effective change.'
      },
      {
        id: 'humbleExcellence',
        name: 'Humble Excellence',
        description: 'Strives for excellence guided by data, driven by learning, and grounded in humility. Committed to continuous improvement.'
      },
      {
        id: 'locallyLed',
        name: 'Locally Led',
        description: 'Programs are locally led by people from the regions served. Maintains core methodology with contextualization.'
      },
      {
        id: 'unwaveringIntegrity',
        name: 'Unwavering Integrity',
        description: 'Zero tolerance for corruption, bribery, or discrimination. Upholds highest ethical standards of honesty, respect, compassion, and love.'
      },
      {
        id: 'sustainableEmpowerment',
        name: 'Sustainable Empowerment',
        description: 'Creates dignity, not dependence. Never provides handouts or gifts. Focuses on equipping individuals to thrive long-term.'
      }
    ];
    
    html += `
      <div class="team-card" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #667eea;">
        <h3 style="color: #667eea; margin-top: 0;">📝 Feedback Request for: ${request['Employee Name']}</h3>
        <p><strong>Period:</strong> ${request.Year} - ${request.Quarter}</p>
        <p style="margin-top: 15px; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #667eea;">
          <strong>Instructions:</strong> Please provide detailed, honest feedback on how <strong>${request['Employee Name'].split(' ')[0]}</strong> 
          demonstrates each of ROSE's core values. Write specific examples of behaviors you've observed (both positive and areas for growth). 
          Your feedback is <strong>anonymous</strong> to the employee but visible to their manager.
        </p>
        
        <form id="feedbackForm_${request.ID}" style="margin-top: 20px;">
    `;
    
    coreValues.forEach(value => {
      html += `
        <div style="margin-bottom: 25px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h4 style="color: #2d3748; margin: 0 0 8px 0;">${value.name}</h4>
          <p style="font-size: 0.9em; color: #718096; margin: 0 0 12px 0; font-style: italic;">${value.description}</p>
          <textarea id="${value.id}_${request.ID}" rows="4" required
            style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 0.95em; font-family: inherit;"
            placeholder="Describe specific examples of how ${request['Employee Name'].split(' ')[0]} demonstrates (or could improve on) this value. Be specific and constructive. Minimum 50 characters."></textarea>
          <div style="margin-top: 8px; font-size: 0.85em; color: #a0aec0;">
            <span id="${value.id}_count_${request.ID}">0</span> characters
          </div>
        </div>
      `;
    });
    
    html += `
          <div style="margin-top: 25px; padding: 20px; background: #fffbeb; border-radius: 8px; border: 1px solid #fbbf24;">
            <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #92400e;">
              📝 Overall Comments (Optional):
            </label>
            <textarea id="comments_${request.ID}" rows="3"
              style="width: 100%; padding: 12px; border: 2px solid #fbbf24; border-radius: 6px; font-size: 0.95em; font-family: inherit;"
              placeholder="Any additional comments or observations about working with ${request['Employee Name'].split(' ')[0]}..."></textarea>
          </div>
          
          <div style="text-align: center; margin-top: 25px;">
            <button type="button" onclick="submitPeerFeedbackForm('${request.ID}')" 
              style="background: #48bb78; font-size: 1.1em; padding: 14px 40px;">
              ✅ Submit Anonymous Feedback
            </button>
          </div>
        </form>
      </div>
    `;
    
    // Add character counters
    coreValues.forEach(value => {
      setTimeout(() => {
        const textarea = document.getElementById(`${value.id}_${request.ID}`);
        const counter = document.getElementById(`${value.id}_count_${request.ID}`);
        if (textarea && counter) {
          textarea.addEventListener('input', () => {
            counter.textContent = textarea.value.length;
            if (textarea.value.length < 50) {
              counter.style.color = '#e53e3e';
            } else {
              counter.style.color = '#48bb78';
            }
          });
        }
      }, 100);
    });
  });
  
  html += '</div>';
  wrap.innerHTML = html;
}

function submitPeerFeedbackForm(requestId) {
  const coreValueIds = ['christCentered', 'holisticInvestment', 'trustedRelationships', 'humbleExcellence', 'locallyLed', 'unwaveringIntegrity', 'sustainableEmpowerment'];
  
  const feedback = {};
  let isValid = true;
  let errorMsg = '';
  
  coreValueIds.forEach(id => {
    const textarea = document.getElementById(`${id}_${requestId}`);
    if (textarea) {
      const value = textarea.value.trim();
      if (value.length < 50) {
        isValid = false;
        errorMsg += `- ${id.replace(/([A-Z])/g, ' $1').trim()}: needs at least 50 characters (currently ${value.length})\n`;
      }
      feedback[id] = value;
    }
  });
  
  if (!isValid) {
    alert('Please provide more detailed feedback:\n\n' + errorMsg + '\nDetailed feedback helps provide meaningful insights for growth.');
    return;
  }
  
  const data = {
    requestId: requestId,
    feedback: feedback,
    comments: document.getElementById(`comments_${requestId}`)?.value || ""
  };
  
  console.log('Submitting peer feedback:', data);
  
  const jsonData = JSON.stringify(data);
  const chunkSize = 1500;
  const chunks = [];
  for (let i = 0; i < jsonData.length; i += chunkSize) {
    chunks.push(jsonData.substring(i, i + chunkSize));
  }
  
  let url = APPS_SCRIPT_URL + '?action=submitPeerFeedback&callback=handleSubmitFeedbackResponse';
  chunks.forEach((chunk, index) => {
    url += '&chunk' + index + '=' + encodeURIComponent(chunk);
  });
  
  window.handleSubmitFeedbackResponse = function(resp) {
    console.log('Submit feedback response:', resp);
    if (resp.result === 'success') {
      if (typeof showToast === 'function') {
        showToast('✅ Thank you! Your anonymous feedback has been submitted successfully.', 'success', 5000);
      } else {
        alert('✅ Thank you! Your anonymous feedback has been submitted successfully.\n\nAI Analysis Ratings:\n' + 
              '• Christ-Centered: ' + resp.ratings.christCentered + '/5\n' +
              '• Holistic Investment: ' + resp.ratings.holisticInvestment + '/5\n' +
              '• Trusted Relationships: ' + resp.ratings.trustedRelationships + '/5\n' +
              '• Humble Excellence: ' + resp.ratings.humbleExcellence + '/5\n' +
              '• Locally Led: ' + resp.ratings.locallyLed + '/5\n' +
              '• Unwavering Integrity: ' + resp.ratings.unwaveringIntegrity + '/5\n' +
              '• Sustainable Empowerment: ' + resp.ratings.sustainableEmpowerment + '/5');
      }
      loadPendingFeedbackRequests();
    } else {
      if (typeof showToast === 'function') {
        showToast('❌ Error submitting feedback: ' + (resp.message || 'Unknown error'), 'error');
      } else {
        alert('Error submitting feedback: ' + (resp.message || 'Unknown error'));
      }
    }
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}

function loadRequestPeerFeedbackTab() {
  populateTeamSelects();
  const select = document.getElementById('feedbackEmployeeSelect');
  if (select) {
    select.innerHTML = '<option value="">-- Select Team Member --</option>';
    teamMembers.forEach(member => {
      const option = document.createElement('option');
      option.value = member.email;
      option.textContent = `${member.name} (${member.title})`;
      option.dataset.name = member.name;
      select.appendChild(option);
    });
  }
  
  loadReviewerCheckboxes();
}

function loadReviewerCheckboxes() {
  const wrap = document.getElementById('reviewerCheckboxes');
  if (!wrap) return;
  
  if (teamMembers.length === 0) {
    wrap.innerHTML = '<p style="color: #718096;">No team members available.</p>';
    return;
  }
  
  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px;">';
  
  teamMembers.forEach(member => {
    html += `
      <label style="display: flex; align-items: center; padding: 12px; background: white; border: 2px solid #e2e8f0; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
        <input type="checkbox" value="${member.email}" class="reviewer-checkbox" style="margin-right: 10px; width: 18px; height: 18px; cursor: pointer;">
        <div>
          <div style="font-weight: 600; color: #2d3748;">${member.name}</div>
          <div style="font-size: 0.85em; color: #718096;">${member.title}</div>
        </div>
      </label>
    `;
  });
  
  html += '</div>';
  wrap.innerHTML = html;
  
  // Add hover effects
  setTimeout(() => {
    document.querySelectorAll('#reviewerCheckboxes label').forEach(label => {
      label.addEventListener('mouseenter', () => {
        label.style.borderColor = '#667eea';
        label.style.background = '#f0f9ff';
      });
      label.addEventListener('mouseleave', () => {
        if (!label.querySelector('input').checked) {
          label.style.borderColor = '#e2e8f0';
          label.style.background = 'white';
        }
      });
      label.querySelector('input').addEventListener('change', (e) => {
        if (e.target.checked) {
          label.style.borderColor = '#667eea';
          label.style.background = '#f0f9ff';
        } else {
          label.style.borderColor = '#e2e8f0';
          label.style.background = 'white';
        }
      });
    });
  }, 100);
}

function submitPeerFeedbackRequest() {
  const employeeSelect = document.getElementById('feedbackEmployeeSelect');
  const selectedEmployee = employeeSelect.value;
  const employeeName = employeeSelect.options[employeeSelect.selectedIndex]?.dataset.name;
  
  if (!selectedEmployee) {
    alert('Please select a team member.');
    return;
  }
  
  const year = document.getElementById('feedbackYear').value;
  const quarter = document.getElementById('feedbackQuarter').value;
  
  const checkboxes = document.querySelectorAll('.reviewer-checkbox:checked');
  const reviewers = Array.from(checkboxes).map(cb => cb.value);
  
  if (reviewers.length === 0) {
    alert('Please select at least one peer reviewer.');
    return;
  }
  
  if (reviewers.length < 2) {
    const confirm = window.confirm('For more reliable feedback, we recommend selecting at least 2 reviewers. Continue with 1 reviewer?');
    if (!confirm) return;
  }
  
  const filteredReviewers = reviewers.filter(email => email !== selectedEmployee);
  
  if (filteredReviewers.length === 0) {
    alert('Please select reviewers other than the employee being reviewed.');
    return;
  }
  
  const data = {
    managerEmail: userProfile.email,
    employeeEmail: selectedEmployee,
    employeeName: employeeName,
    year: year,
    quarter: quarter,
    reviewers: filteredReviewers
  };
  
  console.log('Requesting peer feedback:', data);
  
  const jsonData = JSON.stringify(data);
  const chunkSize = 1500;
  const chunks = [];
  for (let i = 0; i < jsonData.length; i += chunkSize) {
    chunks.push(jsonData.substring(i, i + chunkSize));
  }
  
  let url = APPS_SCRIPT_URL + '?action=requestPeerFeedback&callback=handleRequestFeedbackResponse';
  chunks.forEach((chunk, index) => {
    url += '&chunk' + index + '=' + encodeURIComponent(chunk);
  });
  
  window.handleRequestFeedbackResponse = function(resp) {
    console.log('Request feedback response:', resp);
    if (resp.result === 'success') {
      if (typeof showToast === 'function') {
        showToast(`✅ Peer feedback requests sent to ${filteredReviewers.length} reviewer${filteredReviewers.length > 1 ? 's' : ''} for ${employeeName}!`, 'success', 5000);
      } else {
        alert(`✅ Peer feedback requests sent successfully!\n\n${filteredReviewers.length} reviewer${filteredReviewers.length > 1 ? 's' : ''} will receive anonymous feedback requests for ${employeeName}.\n\nThey will evaluate based on 7 ROSE core values.`);
      }
      document.querySelectorAll('.reviewer-checkbox').forEach(cb => cb.checked = false);
      loadReviewerCheckboxes();
    } else {
      if (typeof showToast === 'function') {
        showToast('❌ Error sending requests: ' + (resp.message || 'Unknown error'), 'error');
      } else {
        alert('Error sending requests: ' + (resp.message || 'Unknown error'));
      }
    }
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}

// ===== REAL-TIME UPDATES (Polling for changes) =====
let pollingInterval = null;
let lastTargetsUpdate = null;
let lastFeedbackUpdate = null;

// Start polling for updates when user is signed in
function startRealtimeUpdates() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  
  // Poll every 30 seconds for updates
  pollingInterval = setInterval(() => {
    if (userProfile && userRole) {
      checkForUpdates();
    }
  }, CONFIG.POLLING_INTERVAL);
  
  console.log(`Real-time updates enabled (polling every ${CONFIG.POLLING_INTERVAL / 1000} seconds)`);
}

// Check for updates from the server
function checkForUpdates() {
  // For employees, check if targets have been updated
  if (userRole === 'Employee') {
    checkTargetsUpdate();
  }
  
  // For all users, check for new peer feedback requests
  checkFeedbackUpdate();
}

// Check if targets have been updated
function checkTargetsUpdate() {
  const year = document.getElementById("periodYear")?.value || new Date().getFullYear();
  const month = document.getElementById("periodMonth")?.value;
  
  if (!month) return;
  
  const quarter = "Q" + Math.ceil(parseInt(month) / 3);
  
  // Build URL safely with helper function
  const url = buildApiUrl(APPS_SCRIPT_URL, {
    action: 'getTargetsUpdateTime',
    email: userProfile.email,
    year: year,
    quarter: quarter,
    callback: 'handleTargetsUpdateCheck'
  });
  
  window.handleTargetsUpdateCheck = function(data) {
    if (data && data.updateTime) {
      const updateTime = new Date(data.updateTime).getTime();
      
      // If this is the first check or if there's a new update
      if (!lastTargetsUpdate || updateTime > lastTargetsUpdate) {
        const wasFirstCheck = !lastTargetsUpdate;
        lastTargetsUpdate = updateTime;
        
        // Show notification only if this isn't the first check
        if (!wasFirstCheck) {
          showUpdateNotification('Your manager has updated your targets!', () => {
            loadEmployeeTargets();
          });
        }
      }
    }
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}

// Check for new peer feedback requests
function checkFeedbackUpdate() {
  // Build URL safely with helper function
  const url = buildApiUrl(APPS_SCRIPT_URL, {
    action: 'getPendingFeedbackCount',
    email: userProfile.email,
    callback: 'handleFeedbackUpdateCheck'
  });
  
  window.handleFeedbackUpdateCheck = function(data) {
    if (data && data.count !== undefined) {
      // Update the badge on the peer feedback tab if needed
      updatePeerFeedbackBadge(data.count);
      
      // If count increased, show notification
      if (lastFeedbackUpdate !== null && data.count > lastFeedbackUpdate) {
        showUpdateNotification('You have new peer feedback requests!', () => {
          showTab('peerFeedbackTab', document.querySelector('[aria-controls="peerFeedbackTab"]'));
        });
      }
      
      lastFeedbackUpdate = data.count;
    }
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}

// Update badge on peer feedback tab
function updatePeerFeedbackBadge(count) {
  const peerFeedbackBtn = document.getElementById('peer-feedback-tab');
  if (peerFeedbackBtn) {
    // Remove existing badge
    const existingBadge = peerFeedbackBtn.querySelector('.notification-badge');
    if (existingBadge) {
      existingBadge.remove();
    }
    
    // Add new badge if count > 0
    if (count > 0) {
      const badge = document.createElement('span');
      badge.className = 'notification-badge';
      badge.textContent = count;
      badge.style.cssText = `
        background: #e53e3e;
        color: white;
        border-radius: 10px;
        padding: 2px 8px;
        font-size: 0.75em;
        font-weight: bold;
        margin-left: 8px;
        display: inline-block;
      `;
      peerFeedbackBtn.appendChild(badge);
    }
  }
}

// Show update notification
function showUpdateNotification(message, onClickCallback) {
  // Check if notifications are supported
  if (!("Notification" in window)) {
    // Fallback to in-app notification
    showInAppNotification(message, onClickCallback);
    return;
  }
  
  // Check notification permission
  if (Notification.permission === "granted") {
    const notification = new Notification("ROSE PMS Update", {
      body: message,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "rose-pms-update",
      requireInteraction: false
    });
    
    notification.onclick = () => {
      window.focus();
      if (onClickCallback) onClickCallback();
      notification.close();
    };
  } else if (Notification.permission !== "denied") {
    // Request permission
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        showUpdateNotification(message, onClickCallback);
      } else {
        showInAppNotification(message, onClickCallback);
      }
    });
  } else {
    // Permission denied, use in-app notification
    showInAppNotification(message, onClickCallback);
  }
}

// Show in-app notification banner
function showInAppNotification(message, onClickCallback) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'in-app-notification';
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 1.2em;">🔔</span>
      <span style="flex: 1;">${message}</span>
      <button onclick="this.closest('.in-app-notification').remove()" 
              style="background: rgba(255,255,255,0.3); border: none; color: white; 
                     padding: 4px 12px; border-radius: 4px; cursor: pointer;">
        Dismiss
      </button>
    </div>
  `;
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    max-width: 400px;
    cursor: pointer;
    animation: slideIn 0.3s ease-out;
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  notification.onclick = () => {
    if (onClickCallback) onClickCallback();
    notification.remove();
  };
  
  document.body.appendChild(notification);
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }
  }, 10000);
}

// Initialize real-time updates when user signs in
// This will be called from getUserRole after successful authentication
function initializeRealtimeFeatures() {
  startRealtimeUpdates();
  
  // Request notification permission on first sign-in
  if ("Notification" in window && Notification.permission === "default") {
    setTimeout(() => {
      if (confirm("Enable notifications to stay updated with changes in real-time?")) {
        Notification.requestPermission();
      }
    }, 2000); // Wait 2 seconds after sign-in to ask
  }
}

// ========== AI INSIGHTS TAB (MANAGER/ADMIN) ==========
function loadAIInsightsTab() {
  populateTeamSelects();
  
  // Populate AI insights employee selector
  const select = document.getElementById('aiInsightsEmployeeSelect');
  if (select) {
    select.innerHTML = '<option value="">-- Select Team Member --</option>';
    teamMembers.forEach(member => {
      const option = document.createElement('option');
      option.value = member.email;
      option.textContent = `${member.name} (${member.title})`;
      option.dataset.name = member.name;
      select.appendChild(option);
    });
    
    // Add change handler
    select.onchange = function() {
      const selectedEmail = this.value;
      const selectedName = this.options[this.selectedIndex]?.dataset.name;
      
      if (!selectedEmail) {
        document.getElementById('aiInsightsWrap').innerHTML = 
          '<div class="empty-msg">Select a team member to generate AI-powered insights and monthly performance reviews.</div>';
        return;
      }
      
      // Show AI insights interface
      document.getElementById('aiInsightsWrap').innerHTML = `
        <div style="max-width: 800px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
            <h3 style="margin: 0 0 15px 0; color: white; font-size: 1.8em;">
              🤖 AI-Powered Performance Analytics
            </h3>
            <p style="margin: 0; font-size: 1.1em; opacity: 0.95;">
              Generate comprehensive insights for ${selectedName}
            </p>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px;">
            <div class="ai-feature-card" style="padding: 25px; background: white; border-radius: 12px; 
                 box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 2px solid #e2e8f0; text-align: center;">
              <div style="font-size: 3em; margin-bottom: 15px;">📝</div>
              <h4 style="color: #2d3748; margin: 0 0 12px 0;">Monthly Performance Review</h4>
              <p style="color: #718096; margin: 0 0 20px 0; font-size: 0.95em;">
                Generate comprehensive AI-powered monthly review with strengths, improvements, and goals
              </p>
              <button onclick="showMonthlyReviewGenerator('${selectedEmail}', '${selectedName}')" 
                      class="ai-btn" style="width: 100%;">
                Generate Review
              </button>
            </div>
            
            <div class="ai-feature-card" style="padding: 25px; background: white; border-radius: 12px; 
                 box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 2px solid #e2e8f0; text-align: center;">
              <div style="font-size: 3em; margin-bottom: 15px;">💡</div>
              <h4 style="color: #2d3748; margin: 0 0 12px 0;">Goal Suggestions</h4>
              <p style="color: #718096; margin: 0 0 20px 0; font-size: 0.95em;">
                Get AI-generated goal suggestions based on performance data and best practices
              </p>
              <button onclick="showAIGoalDimensionSelector('${selectedEmail}', '${selectedName}')" 
                      class="ai-btn" style="width: 100%;">
                Generate Goals
              </button>
            </div>
            
            <div class="ai-feature-card" style="padding: 25px; background: white; border-radius: 12px; 
                 box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 2px solid #e2e8f0; text-align: center;">
              <div style="font-size: 3em; margin-bottom: 15px;">📊</div>
              <h4 style="color: #2d3748; margin: 0 0 12px 0;">Performance Dashboard</h4>
              <p style="color: #718096; margin: 0 0 20px 0; font-size: 0.95em;">
                View detailed performance metrics and trends for data-driven insights
              </p>
              <button onclick="loadTeamMemberDashboardFromAI('${selectedEmail}')" 
                      class="ai-btn" style="width: 100%;">
                View Dashboard
              </button>
            </div>
          </div>
          
          <div style="background: #fffbeb; padding: 20px; border-radius: 10px; border-left: 4px solid #f59e0b;">
            <h4 style="margin: 0 0 10px 0; color: #92400e;">💡 AI-Powered Features</h4>
            <p style="margin: 0; color: #78350f; line-height: 1.6;">
              Our AI analyzes performance data, peer feedback, and historical trends to provide actionable insights. 
              All suggestions are designed to help you write more effective reviews and set meaningful goals.
            </p>
          </div>
        </div>
      `;
    };
  }
}

// Helper function to show goal dimension selector
function showAIGoalDimensionSelector(employeeEmail, employeeName) {
  const modal = document.createElement('div');
  modal.className = 'scorecard-modal';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h2>🎯 Select Performance Dimension</h2>
        <button class="modal-close" onclick="this.closest('.scorecard-modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <p style="color: #718096; margin-bottom: 20px;">
          Select a performance dimension to generate AI-powered goal suggestions for ${employeeName}:
        </p>
        
        <div style="display: flex; flex-direction: column; gap: 15px;">
          <button onclick="generateAndShowGoals('${employeeEmail}', '${employeeName}', 'Financial')" 
                  class="ai-btn" style="width: 100%; justify-content: center; padding: 15px;">
            💰 Financial
          </button>
          <button onclick="generateAndShowGoals('${employeeEmail}', '${employeeName}', 'Customer')" 
                  class="ai-btn" style="width: 100%; justify-content: center; padding: 15px;">
            👥 Customer
          </button>
          <button onclick="generateAndShowGoals('${employeeEmail}', '${employeeName}', 'Internal Process')" 
                  class="ai-btn" style="width: 100%; justify-content: center; padding: 15px;">
            ⚙️ Internal Process
          </button>
          <button onclick="generateAndShowGoals('${employeeEmail}', '${employeeName}', 'Learning & Growth')" 
                  class="ai-btn" style="width: 100%; justify-content: center; padding: 15px;">
            📚 Learning & Growth
          </button>
        </div>
      </div>
      <div class="modal-footer">
        <button onclick="this.closest('.scorecard-modal').remove()" class="btn-close-modal">Cancel</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Helper function to generate and show goals
function generateAndShowGoals(employeeEmail, employeeName, dimension) {
  // Close dimension selector
  document.querySelector('.scorecard-modal')?.remove();
  
  // Get employee data
  const url = APPS_SCRIPT_URL + '?action=getEmployeeScores&employeeEmail=' + 
              encodeURIComponent(employeeEmail) + '&callback=handleGoalGenerationData';
  
  window.handleGoalGenerationData = function(records) {
    const employeeData = { averageScore: 0 };
    
    if (records && records.length > 0) {
      const recentRecords = records.slice(0, 5);
      let totalScore = 0;
      let count = 0;
      
      recentRecords.forEach(rec => {
        try {
          let scoresData = rec.Scores || rec.scores;
          let scoresArr = typeof scoresData === 'string' ? JSON.parse(scoresData) : scoresData;
          if (Array.isArray(scoresArr)) {
            scoresArr.forEach(s => {
              const rating = parseFloat(s.rating) || 0;
              if (rating > 0) {
                totalScore += rating;
                count++;
              }
            });
          }
        } catch (e) {
          console.error('Error parsing scores:', e);
        }
      });
      
      if (count > 0) {
        employeeData.averageScore = totalScore / count;
      }
    }
    
    // Generate goals using AI
    showAIGoalSuggestionModal(dimension, employeeData, function(selectedGoal) {
      // Copy to clipboard
      navigator.clipboard.writeText(selectedGoal).then(() => {
        if (typeof showToast === 'function') {
          showToast('✅ Goal copied to clipboard!', 'success');
        }
      });
    });
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}

// Helper function to load team member dashboard from AI insights
function loadTeamMemberDashboardFromAI(employeeEmail) {
  // Set the team dashboard selector and trigger load
  const teamDashboardSelect = document.getElementById('teamDashboardSelect');
  if (teamDashboardSelect) {
    teamDashboardSelect.value = employeeEmail;
    
    // Switch to team dashboard tab
    const teamDashboardBtn = document.getElementById('team-dashboard-tab');
    if (teamDashboardBtn) {
      showTab('teamDashboardTab', teamDashboardBtn);
      loadTeamMemberDashboard();
    }
  }
}

// ========== RECOGNITION TAB ==========
function loadRecognitionTab() {
  displayRecognitionAwards('recognitionWrap');
  
  // If manager/admin, add a button to calculate recognition
  if (userRole === 'Manager' || userRole === 'Admin') {
    const wrap = document.getElementById('recognitionWrap');
    if (wrap && wrap.querySelector) {
      const existingBtn = wrap.querySelector('.calculate-recognition-btn');
      if (!existingBtn) {
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'text-align: center; margin: 30px 0;';
        btnContainer.innerHTML = `
          <button onclick="calculateAndSaveRecognition()" class="ai-btn calculate-recognition-btn" 
                  style="font-size: 1.1em; padding: 15px 30px;">
            🏆 Calculate Recognition Awards
          </button>
          <p style="color: #718096; margin-top: 15px; font-size: 0.95em;">
            Generate Employee of the Month, Quarter, and Year awards based on performance data
          </p>
        `;
        wrap.insertBefore(btnContainer, wrap.firstChild);
      }
    }
  }
}

// Function to calculate and save recognition awards
function calculateAndSaveRecognition() {
  if (!userProfile || (userRole !== 'Manager' && userRole !== 'Admin')) {
    alert('This feature is only available to managers and administrators.');
    return;
  }
  
  if (typeof showToast === 'function') {
    showToast('🤖 Calculating recognition awards... This may take a moment.', 'info', 3000);
  }
  
  // Get all employee data
  const url = APPS_SCRIPT_URL + '?action=getAllEmployeeScores&callback=handleRecognitionCalculation';
  
  window.handleRecognitionCalculation = function(allData) {
    if (!allData || allData.length === 0) {
      alert('No employee data available to calculate recognition awards.');
      return;
    }
    
    // Process data by employee
    const employeeMap = {};
    
    allData.forEach(record => {
      const email = record['User Email'] || record.userEmail;
      const name = record.Name || record.name;
      const division = record.Division || record.division;
      
      if (!email) return;
      
      if (!employeeMap[email]) {
        employeeMap[email] = {
          email: email,
          name: name,
          division: division,
          scores: []
        };
      }
      
      try {
        let scoresData = record.Scores || record.scores;
        let scoresArr = typeof scoresData === 'string' ? JSON.parse(scoresData) : scoresData;
        if (Array.isArray(scoresArr)) {
          employeeMap[email].scores.push(...scoresArr);
        }
      } catch (e) {
        console.error('Error parsing scores:', e);
      }
    });
    
    const employees = Object.values(employeeMap);
    
    // Calculate recognition for current month
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear());
    const quarter = 'Q' + Math.ceil(parseInt(month) / 3);
    
    // Get unique departments
    const departments = [...new Set(employees.map(e => e.division).filter(Boolean))];
    
    const recognitions = [];
    
    // Employee of the Month - per department
    departments.forEach(dept => {
      const winner = window.AIAnalytics.selectEmployeeOfMonth(employees, dept, month, year);
      if (winner) recognitions.push(winner);
    });
    
    // Organization-wide Employee of the Month
    const orgMonthWinner = window.AIAnalytics.selectOrganizationWinner(employees, 'month', month, year);
    if (orgMonthWinner) recognitions.push(orgMonthWinner);
    
    // Employee of the Quarter - per department
    departments.forEach(dept => {
      const winner = window.AIAnalytics.selectEmployeeOfQuarter(employees, dept, quarter, year);
      if (winner) recognitions.push(winner);
    });
    
    // Organization-wide Employee of the Quarter
    const orgQuarterWinner = window.AIAnalytics.selectOrganizationWinner(employees, 'quarter', quarter, year);
    if (orgQuarterWinner) recognitions.push(orgQuarterWinner);
    
    // Employee of the Year - per department
    departments.forEach(dept => {
      const winner = window.AIAnalytics.selectEmployeeOfYear(employees, dept, year);
      if (winner) recognitions.push(winner);
    });
    
    // Organization-wide Employee of the Year
    const orgYearWinner = window.AIAnalytics.selectOrganizationWinner(employees, 'year', year, year);
    if (orgYearWinner) recognitions.push(orgYearWinner);
    
    // Save recognitions to localStorage
    try {
      localStorage.setItem('rose_pms_recognitions', JSON.stringify(recognitions));
      
      // Create notifications for winners
      recognitions.forEach(recognition => {
        const notification = window.AIAnalytics.createRecognitionNotification(recognition);
        window.AIAnalytics.storeNotification(notification);
      });
      
      if (typeof showToast === 'function') {
        showToast(`✅ Recognition awards calculated! ${recognitions.length} awards generated.`, 'success', 5000);
      } else {
        alert(`Recognition awards calculated successfully!\n\n${recognitions.length} awards have been generated and notifications sent to winners.`);
      }
      
      // Reload recognition display
      loadRecognitionTab();
      
      // Update notification badge
      if (typeof updateNotificationBadge === 'function') {
        updateNotificationBadge();
      }
    } catch (error) {
      console.error('Error saving recognitions:', error);
      alert('Error saving recognition awards: ' + error.message);
    }
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}
