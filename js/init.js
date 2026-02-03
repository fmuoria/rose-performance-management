/**
 * Application Initialization Script
 * Sets up global error handlers and initializes the application
 * @module init
 */

/**
 * Global error handler for unhandled promise rejections
 * Logs errors and shows user-friendly messages
 */
window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Show user-friendly error message
  if (typeof showToast === 'function') {
    const errorMessage = event.reason && event.reason.message 
      ? event.reason.message 
      : 'An unexpected error occurred. Please try again.';
    
    showToast(errorMessage, 'error', 5000);
  }
  
  // Prevent default browser behavior
  event.preventDefault();
});

/**
 * Global error handler for uncaught exceptions
 */
window.addEventListener('error', function(event) {
  console.error('Uncaught error:', event.error);
  
  // Show user-friendly error message
  if (typeof showToast === 'function') {
    showToast('An unexpected error occurred. Please refresh the page.', 'error', 5000);
  }
});

/**
 * Initialize keyboard shortcuts
 */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
    // Ctrl+S / Cmd+S - Save scorecard
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      const saveBtn = document.querySelector('#scorecardTab .save-btn, #scorecardTab button[onclick*="saveScorecard"]');
      if (saveBtn && !saveBtn.disabled) {
        saveBtn.click();
        if (typeof showToast === 'function') {
          showToast('Saving scorecard...', 'info');
        }
      }
    }
    
    // Escape - Close modals/dialogs
    if (e.key === 'Escape') {
      const modals = document.querySelectorAll('.modal-overlay, .confirm-overlay');
      if (modals.length > 0) {
        const lastModal = modals[modals.length - 1];
        lastModal.remove();
      }
    }
  });
  
  console.log('Keyboard shortcuts initialized (Ctrl+S to save, Esc to close modals)');
}

/**
 * Initialize lazy loading for Chart.js
 * Only load when dashboard is viewed
 */
function initLazyLoadCharts() {
  // Check if we should lazy load charts
  if (typeof CONFIG !== 'undefined' && CONFIG.LAZY_LOAD_CHARTS) {
    console.log('Lazy loading enabled for Chart.js');
    
    // Store original loadDashboard functions
    const originalLoadDashboard = window.loadDashboard;
    const originalLoadTeamDashboardTab = window.loadTeamDashboardTab;
    
    // Check if Chart.js is already loaded
    let chartJsLoaded = typeof Chart !== 'undefined';
    
    // Wrapper function to load Chart.js before dashboard
    async function ensureChartJsLoaded() {
      if (chartJsLoaded) {
        return Promise.resolve();
      }
      
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
          chartJsLoaded = true;
          console.log('Chart.js loaded lazily');
          resolve();
        };
        script.onerror = () => {
          console.error('Failed to load Chart.js');
          reject(new Error('Failed to load Chart.js'));
        };
        document.head.appendChild(script);
      });
    }
    
    // Override loadDashboard with lazy loading
    if (originalLoadDashboard) {
      window.loadDashboard = async function(...args) {
        await ensureChartJsLoaded();
        return originalLoadDashboard.apply(this, args);
      };
    }
    
    // Override loadTeamDashboardTab with lazy loading
    if (originalLoadTeamDashboardTab) {
      window.loadTeamDashboardTab = async function(...args) {
        await ensureChartJsLoaded();
        return originalLoadTeamDashboardTab.apply(this, args);
      };
    }
  }
}

/**
 * Initialize service worker with update notification
 */
function initServiceWorker() {
  if ('serviceWorker' in navigator && typeof CONFIG !== 'undefined') {
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
}

/**
 * Show notification for service worker update
 * @param {ServiceWorker} newWorker - New service worker instance
 */
function showUpdateAvailableNotification(newWorker) {
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px; padding: 16px 20px;">
      <span style="font-size: 1.5em;" aria-hidden="true">🔄</span>
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
  
  // Add animation style if not exists
  if (!document.getElementById('sw-update-animation')) {
    const style = document.createElement('style');
    style.id = 'sw-update-animation';
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
  }
  
  document.body.appendChild(notification);
  
  // Store reference to new worker for update function
  window.pendingServiceWorker = newWorker;
}

/**
 * Activate new service worker
 */
window.updateServiceWorker = function() {
  if (window.pendingServiceWorker) {
    window.pendingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
};

/**
 * Initialize all application features
 */
function initializeApp() {
  console.log('🌹 Initializing ROSE Performance Management System...');
  
  // Initialize global error handlers
  console.log('✓ Global error handlers registered');
  
  // Initialize keyboard shortcuts
  initKeyboardShortcuts();
  
  // Initialize lazy loading for charts
  initLazyLoadCharts();
  
  // Initialize service worker
  initServiceWorker();
  
  // Initialize authentication (restore session if exists)
  if (typeof initAuth === 'function') {
    initAuth();
  }
  
  console.log('✅ ROSE PMS initialized successfully');
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Make init functions available globally
if (typeof window !== 'undefined') {
  window.initializeApp = initializeApp;
  window.initKeyboardShortcuts = initKeyboardShortcuts;
  window.initLazyLoadCharts = initLazyLoadCharts;
  window.initServiceWorker = initServiceWorker;
  window.showUpdateAvailableNotification = showUpdateAvailableNotification;
}
