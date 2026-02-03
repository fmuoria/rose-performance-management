/**
 * UI Components Module
 * Reusable UI components for tabs, modals, and other interface elements
 * @module ui/components
 */

// Dependencies: Requires userRole from auth.js

/**
 * Render navigation tabs based on user role
 * Dynamically generates tabs with proper ARIA attributes
 */
function renderTabs() {
  const tabsContainer = document.getElementById('tabsContainer');
  if (!tabsContainer) {
    console.error('Tabs container not found');
    return;
  }
  
  let tabs = `
    <button class="tab-btn active" onclick="showTab('scorecardTab', this)" role="tab" aria-selected="true" aria-controls="scorecardTab" id="scorecard-tab">Scorecard</button>
    <button class="tab-btn" onclick="showTab('reportsTab', this)" role="tab" aria-selected="false" aria-controls="reportsTab" id="reports-tab">Reports</button>
    <button class="tab-btn" onclick="showTab('dashboardTab', this)" role="tab" aria-selected="false" aria-controls="dashboardTab" id="dashboard-tab">Dashboard</button>
    <button class="tab-btn" onclick="showTab('peerFeedbackTab', this)" role="tab" aria-selected="false" aria-controls="peerFeedbackTab" id="peer-feedback-tab">Peer Feedback</button>
    <button class="tab-btn" onclick="showTab('recognitionTab', this)" role="tab" aria-selected="false" aria-controls="recognitionTab" id="recognition-tab">🏆 Recognition</button>
  `;
  
  // Add manager/admin specific tabs
  if (window.userRole === 'Manager' || window.userRole === 'Admin') {
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
  
  // Add keyboard navigation for tabs
  addTabKeyboardNavigation();
}

/**
 * Add keyboard navigation support for tabs
 * Implements arrow key navigation as per ARIA best practices
 */
function addTabKeyboardNavigation() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach((tab, index) => {
    tab.addEventListener('keydown', (e) => {
      let newIndex = index;
      
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        newIndex = (index + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        newIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        newIndex = tabs.length - 1;
      }
      
      if (newIndex !== index) {
        tabs[newIndex].focus();
      }
    });
  });
}

/**
 * Show specific tab and hide others
 * @param {string} tabId - ID of the tab content to show
 * @param {HTMLElement} btn - Tab button element that was clicked
 */
function showTab(tabId, btn) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.remove('active');
    el.setAttribute('aria-hidden', 'true');
  });
  
  // Show selected tab
  const activeTab = document.getElementById(tabId);
  if (activeTab) {
    activeTab.classList.add('active');
    activeTab.setAttribute('aria-hidden', 'false');
  }
  
  // Update tab button states
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  if (btn) {
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
  }
  
  // Load tab-specific data
  loadTabData(tabId);
}

/**
 * Load data for specific tab
 * @param {string} tabId - ID of the tab to load data for
 */
function loadTabData(tabId) {
  const loaders = {
    'reportsTab': () => typeof loadUserReports === 'function' && loadUserReports(),
    'dashboardTab': () => typeof loadDashboard === 'function' && loadDashboard(),
    'myTeamTab': () => typeof displayTeamMembers === 'function' && displayTeamMembers(),
    'setTargetsTab': () => typeof loadSetTargetsTab === 'function' && loadSetTargetsTab(),
    'quarterlyReviewTab': () => typeof loadQuarterlyReviewTab === 'function' && loadQuarterlyReviewTab(),
    'teamReportsTab': () => typeof loadTeamReportsTab === 'function' && loadTeamReportsTab(),
    'teamDashboardTab': () => typeof loadTeamDashboardTab === 'function' && loadTeamDashboardTab(),
    'peerFeedbackTab': () => typeof loadPeerFeedbackTab === 'function' && loadPeerFeedbackTab(),
    'requestPeerFeedbackTab': () => typeof loadRequestPeerFeedbackTab === 'function' && loadRequestPeerFeedbackTab(),
    'aiInsightsTab': () => typeof loadAIInsightsTab === 'function' && loadAIInsightsTab(),
    'recognitionTab': () => typeof loadRecognitionTab === 'function' && loadRecognitionTab()
  };
  
  if (loaders[tabId]) {
    loaders[tabId]();
  }
}

/**
 * Create a modal dialog
 * @param {Object} options - Modal configuration options
 * @param {string} options.title - Modal title
 * @param {string} options.content - Modal HTML content
 * @param {Array} options.buttons - Array of button configurations
 * @param {Function} options.onClose - Callback when modal is closed
 * @returns {HTMLElement} Modal element
 */
function createModal(options) {
  const {
    title = 'Modal',
    content = '',
    buttons = [],
    onClose = null,
    width = '600px'
  } = options;
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'modal-title');
  modal.style.cssText = `
    background: white;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    max-width: ${width};
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  `;
  
  const titleEl = document.createElement('h2');
  titleEl.id = 'modal-title';
  titleEl.textContent = title;
  titleEl.style.marginTop = '0';
  
  const contentEl = document.createElement('div');
  contentEl.innerHTML = content;
  
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = 'display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;';
  
  buttons.forEach(btn => {
    const button = document.createElement('button');
    button.textContent = btn.text;
    button.className = btn.className || 'btn';
    button.onclick = () => {
      if (btn.onClick) {
        btn.onClick();
      }
      closeModal(overlay);
    };
    buttonsContainer.appendChild(button);
  });
  
  modal.appendChild(titleEl);
  modal.appendChild(contentEl);
  modal.appendChild(buttonsContainer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Focus trap
  trapFocus(modal);
  
  // Close on Escape
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal(overlay);
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal(overlay);
    }
  });
  
  function closeModal(overlayEl) {
    overlayEl.remove();
    if (onClose) {
      onClose();
    }
  }
  
  return modal;
}

/**
 * Trap focus within an element (for modals and dialogs)
 * @param {HTMLElement} element - Element to trap focus within
 */
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length === 0) {
    return;
  }
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  // Focus first element
  firstFocusable.focus();
  
  element.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') {
      return;
    }
    
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  });
}

/**
 * Debounce function to limit execution rate
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Make component functions available globally
if (typeof window !== 'undefined') {
  window.renderTabs = renderTabs;
  window.showTab = showTab;
  window.createModal = createModal;
  window.trapFocus = trapFocus;
  window.debounce = debounce;
  window.addTabKeyboardNavigation = addTabKeyboardNavigation;
  window.loadTabData = loadTabData;
}
