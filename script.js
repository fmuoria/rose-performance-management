// ===== SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, notify user
              if (confirm('A new version is available! Would you like to update?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// ===== SESSION PERSISTENCE =====
const SESSION_KEY = 'rose_pms_session';
const SESSION_EXPIRY_KEY = 'rose_pms_session_expiry';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Save session to localStorage
function saveSession(profile, role) {
  try {
    const sessionData = {
      profile: profile,
      role: role,
      timestamp: Date.now()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    localStorage.setItem(SESSION_EXPIRY_KEY, Date.now() + SESSION_DURATION);
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
  `;
  
  if (userRole === 'Manager' || userRole === 'Admin') {
    tabs += `
      <button class="tab-btn" onclick="showTab('myTeamTab', this)" role="tab" aria-selected="false" aria-controls="myTeamTab" id="team-tab">My Team</button>
      <button class="tab-btn" onclick="showTab('setTargetsTab', this)" role="tab" aria-selected="false" aria-controls="setTargetsTab" id="targets-tab">Set Targets</button>
      <button class="tab-btn" onclick="showTab('requestPeerFeedbackTab', this)" role="tab" aria-selected="false" aria-controls="requestPeerFeedbackTab" id="request-feedback-tab">Request Feedback</button>
      <button class="tab-btn" onclick="showTab('teamReportsTab', this)" role="tab" aria-selected="false" aria-controls="teamReportsTab" id="team-reports-tab">Team Reports</button>
      <button class="tab-btn" onclick="showTab('teamDashboardTab', this)" role="tab" aria-selected="false" aria-controls="teamDashboardTab" id="team-dashboard-tab">Team Dashboard</button>
    `;
  }
  
  tabsContainer.innerHTML = tabs;
}

function updateUserUI() {
  const userStatus = document.getElementById("userStatus");
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
  } else if (userProfile) {
    userStatus.innerHTML = `<span style="font-size:1.07rem;">Loading your profile...</span>`;
  } else {
    userStatus.innerHTML = `<span style="font-size:1.07rem;">Please sign in with your Google account to use the scorecard.</span>`;
    document.getElementById("g_id_signin").style.display = "";
    document.querySelectorAll('.tab-content, .tabs').forEach(el => el.style.display = "none");
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
  if (tabId === 'teamReportsTab') loadTeamReportsTab();
  if (tabId === 'teamDashboardTab') loadTeamDashboardTab();
  if (tabId === 'peerFeedbackTab') loadPeerFeedbackTab();
  if (tabId === 'requestPeerFeedbackTab') loadRequestPeerFeedbackTab();
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
      
      <h3>Set Performance Targets</h3>
      <div id="targetsList"></div>
      <div style="margin-top: 15px; display: flex; gap: 10px;">
        <button onclick="addTargetRow()" style="background: #667eea;">+ Add Target</button>
        <button onclick="saveTargets()" style="background: #48bb78;">💾 Save All Targets</button>
        <button onclick="validateWeights()" style="background: #ed8936;">🔍 Check Weights</button>
      </div>
    </div>
  `;
  
  addTargetRow();
}

let targetRowCount = 0;

function addTargetRow() {
  const targetsList = document.getElementById('targetsList');
  if (!targetsList) return;
  
  targetRowCount++;
  const rowId = `targetRow_${targetRowCount}`;
  
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
    <input type="number" class="target-value" placeholder="Target Value" style="flex: 1;">
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
    const targetValue = row.querySelector('.target-value').value;
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
      alert('✅ Targets saved successfully!\n\n• Internal Customer (25%) - Peer Review\n• Your custom targets - ' + (totalWeight - 25) + '%\n• Total: 100%');
      loadEmployeeCurrentTargets();
    } else {
      alert('Error saving targets: ' + (resp.message || 'Unknown error'));
    }
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
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
  alert("Peer feedback is anonymous. Your manager can view detailed feedback.\n\nYour score is based on the average of peer ratings across 7 ROSE core values.");
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

  const data = {
    userEmail: userProfile.email,
    name: document.getElementById("employeeName").value,
    job: document.getElementById("employeeJob").value,
    division: document.getElementById("division").value,
    level: document.getElementById("level").value,
    year: year,
    month: month,
    week: week,
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
      alert("Scorecard saved successfully!");
      resetScorecard();
      loadUserReports();
      loadDashboard();
    } else {
      alert("Error saving scorecard: " + (resp.message || "Unknown error"));
      console.error("Server error:", resp);
    }
  };
  
  const script = document.createElement('script');
  script.src = url;
  script.onerror = function() {
    alert("Error: Failed to save scorecard. The data might be too large.");
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
            ${scoresArr.map(score => `
              <tr>
                <td><strong>${score.dimension}</strong></td>
                <td>${score.measure}</td>
                <td>${score.target || score.targetBudget || ''}</td>
                <td>${score.actual || score.actualSpent || ''}</td>
                <td>${score.rating}</td>
                <td>${score.weight}%</td>
                <td><strong>${score.weighted}</strong></td>
                <td>${score.comment || '-'}</td>
                <td>${score.evidence ? `<a href="${score.evidence}" target="_blank" style="color: #667eea; text-decoration: underline;">View Evidence</a>` : '-'}</td>
              </tr>
            `).join('')}
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
      alert('✅ Thank you! Your anonymous feedback has been submitted successfully.\n\nAI Analysis Ratings:\n' + 
            '• Christ-Centered: ' + resp.ratings.christCentered + '/5\n' +
            '• Holistic Investment: ' + resp.ratings.holisticInvestment + '/5\n' +
            '• Trusted Relationships: ' + resp.ratings.trustedRelationships + '/5\n' +
            '• Humble Excellence: ' + resp.ratings.humbleExcellence + '/5\n' +
            '• Locally Led: ' + resp.ratings.locallyLed + '/5\n' +
            '• Unwavering Integrity: ' + resp.ratings.unwaveringIntegrity + '/5\n' +
            '• Sustainable Empowerment: ' + resp.ratings.sustainableEmpowerment + '/5');
      loadPendingFeedbackRequests();
    } else {
      alert('Error submitting feedback: ' + (resp.message || 'Unknown error'));
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
      alert(`✅ Peer feedback requests sent successfully!\n\n${filteredReviewers.length} reviewer${filteredReviewers.length > 1 ? 's' : ''} will receive anonymous feedback requests for ${employeeName}.\n\nThey will evaluate based on 7 ROSE core values.`);
      document.querySelectorAll('.reviewer-checkbox').forEach(cb => cb.checked = false);
      loadReviewerCheckboxes();
    } else {
      alert('Error sending requests: ' + (resp.message || 'Unknown error'));
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
  }, 30000); // 30 seconds
  
  console.log('Real-time updates enabled (polling every 30 seconds)');
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
  
  const url = APPS_SCRIPT_URL + '?action=getTargetsUpdateTime&email=' + 
              encodeURIComponent(userProfile.email) + '&year=' + year + 
              '&quarter=' + quarter + '&callback=handleTargetsUpdateCheck';
  
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
  const url = APPS_SCRIPT_URL + '?action=getPendingFeedbackCount&email=' + 
              encodeURIComponent(userProfile.email) + '&callback=handleFeedbackUpdateCheck';
  
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
