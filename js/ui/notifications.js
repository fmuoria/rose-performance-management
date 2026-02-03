/**
 * Notifications Module
 * Handles toast notifications and user feedback
 * @module ui/notifications
 */

// Dependencies: Requires CONFIG from core/config.js

let toastContainer = null;

/**
 * Initialize toast container if not exists
 * @returns {HTMLElement} Toast container element
 */
function initToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    toastContainer.setAttribute('aria-atomic', 'true');
    toastContainer.setAttribute('role', 'status');
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast ('success', 'error', 'warning', 'info')
 * @param {number} duration - Duration in milliseconds (default from CONFIG)
 */
function showToast(message, type = 'info', duration = null) {
  const container = initToastContainer();
  
  // Use configured duration if not specified
  if (duration === null && typeof CONFIG !== 'undefined') {
    duration = CONFIG.TOAST_DURATION || 4000;
  } else if (duration === null) {
    duration = 4000;
  }
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  
  // Fallback for escapeHtml if not available
  const safeMessage = typeof escapeHtml === 'function' ? escapeHtml(message) : message.replace(/[<>&"']/g, '');
  
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icons[type] || icons.info}</span>
    <span class="toast-message">${safeMessage}</span>
    <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Close notification">×</button>
  `;
  
  container.appendChild(toast);
  
  // Auto-remove after duration
  const timeoutId = setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'toastSlideOut 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }
  }, duration);
  
  // Store timeout ID for potential cancellation
  toast._timeoutId = timeoutId;
}

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback on confirmation
 * @param {Function} onCancel - Callback on cancellation (optional)
 * @returns {void}
 */
function showConfirmDialog(message, onConfirm, onCancel = null) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
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
  
  const dialog = document.createElement('div');
  dialog.className = 'confirm-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'confirm-dialog-title');
  dialog.style.cssText = `
    background: white;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    max-width: 400px;
    width: 90%;
  `;
  
  dialog.innerHTML = `
    <h3 id="confirm-dialog-title" style="margin: 0 0 16px 0;">Confirm Action</h3>
    <p style="margin: 0 0 24px 0;">${typeof escapeHtml === 'function' ? escapeHtml(message) : message.replace(/[<>&"']/g, '')}</p>
    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <button class="cancel-btn" style="padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;">Cancel</button>
      <button class="confirm-btn" style="padding: 8px 16px; border: none; background: #667eea; color: white; border-radius: 4px; cursor: pointer; font-weight: bold;">Confirm</button>
    </div>
  `;
  
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  
  // Focus trap - focus confirm button
  const confirmBtn = dialog.querySelector('.confirm-btn');
  const cancelBtn = dialog.querySelector('.cancel-btn');
  confirmBtn.focus();
  
  const cleanup = () => {
    overlay.remove();
  };
  
  confirmBtn.addEventListener('click', () => {
    cleanup();
    if (onConfirm) {
      onConfirm();
    }
  });
  
  cancelBtn.addEventListener('click', () => {
    cleanup();
    if (onCancel) {
      onCancel();
    }
  });
  
  // Close on Escape key
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      cleanup();
      if (onCancel) {
        onCancel();
      }
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      cleanup();
      if (onCancel) {
        onCancel();
      }
    }
  });
}

/**
 * Hide loader animation
 */
function hideLoader() {
  const loader = document.getElementById('roseLoader');
  if (loader) {
    loader.classList.add('hide');
    setTimeout(() => {
      loader.style.display = 'none';
    }, 500);
  }
}

/**
 * Show loader animation
 * @param {string} message - Main loading message
 * @param {string} submessage - Sub message
 */
function showLoader(message = 'Fetching data... Please wait while your insights bloom', submessage = 'Loading ROSE Performance Management System') {
  const loader = document.getElementById('roseLoader');
  if (loader) {
    loader.style.display = 'flex';
    loader.classList.remove('hide');
    
    const messageEl = loader.querySelector('.loader-message');
    const submessageEl = loader.querySelector('.loader-submessage');
    
    if (messageEl) {
      const safeMessage = typeof escapeHtml === 'function' ? escapeHtml(message) : message.replace(/[<>&"']/g, '');
      messageEl.innerHTML = safeMessage + '<span class="loading-dots"></span>';
    }
    if (submessageEl) {
      submessageEl.textContent = submessage;
    }
  }
}

// Add toast slide out animation
if (typeof document !== 'undefined') {
  const toastStyle = document.createElement('style');
  toastStyle.textContent = `
    @keyframes toastSlideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(toastStyle);
}

// Hide loader when page is fully loaded
if (typeof window !== 'undefined') {
  window.addEventListener('load', function() {
    setTimeout(hideLoader, 1000);
  });
}

// Make notification functions available globally
if (typeof window !== 'undefined') {
  window.showToast = showToast;
  window.showConfirmDialog = showConfirmDialog;
  window.hideLoader = hideLoader;
  window.showLoader = showLoader;
  window.initToastContainer = initToastContainer;
}
