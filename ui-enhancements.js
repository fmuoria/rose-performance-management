// UI Enhancements for ROSE Performance Management System

// ===== LOADING ANIMATION =====
function hideLoader() {
  const loader = document.getElementById('roseLoader');
  if (loader) {
    loader.classList.add('hide');
    setTimeout(() => {
      loader.style.display = 'none';
    }, 500);
  }
}

function showLoader(message = 'Fetching data... Please wait while your insights bloom', submessage = 'Loading ROSE Performance Management System') {
  const loader = document.getElementById('roseLoader');
  if (loader) {
    loader.style.display = 'flex';
    loader.classList.remove('hide');
    
    const messageEl = loader.querySelector('.loader-message');
    const submessageEl = loader.querySelector('.loader-submessage');
    
    if (messageEl) {
      messageEl.innerHTML = message + '<span class="loading-dots"></span>';
    }
    if (submessageEl) {
      submessageEl.textContent = submessage;
    }
  }
}

// Hide loader when page is fully loaded
window.addEventListener('load', function() {
  // Show loader for at least 1 second for better UX
  setTimeout(hideLoader, 1000);
});

// ===== TOAST NOTIFICATIONS =====
let toastContainer = null;

function initToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function showToast(message, type = 'info', duration = 4000) {
  const container = initToastContainer();
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  container.appendChild(toast);
  
  // Auto-remove after duration
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'toastSlideOut 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }
  }, duration);
}

// Add toast slide out animation
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

// ===== TOOLTIP HELPER =====
function addTooltip(element, text) {
  if (!element) return;
  
  const wrapper = document.createElement('span');
  wrapper.className = 'tooltip';
  
  const tooltipText = document.createElement('span');
  tooltipText.className = 'tooltiptext';
  tooltipText.textContent = text;
  
  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);
  wrapper.appendChild(tooltipText);
}

// ===== DATA UPDATE ANIMATION =====
function animateDataUpdate(element) {
  if (!element) return;
  
  element.classList.add('data-updated');
  setTimeout(() => {
    element.classList.remove('data-updated');
  }, 1000);
}

// ===== ENHANCED BUTTON CLICK FEEDBACK =====
document.addEventListener('DOMContentLoaded', function() {
  // Add ripple effect to all buttons
  document.addEventListener('click', function(e) {
    if (e.target.tagName === 'BUTTON' && !e.target.disabled) {
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        width: 100px;
        height: 100px;
        margin-left: -50px;
        margin-top: -50px;
        animation: ripple 0.6s;
        pointer-events: none;
      `;
      
      const rect = e.target.getBoundingClientRect();
      ripple.style.left = (e.clientX - rect.left) + 'px';
      ripple.style.top = (e.clientY - rect.top) + 'px';
      
      e.target.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    }
  });
});

// Add ripple animation
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  @keyframes ripple {
    from {
      transform: scale(0);
      opacity: 1;
    }
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  button {
    position: relative;
    overflow: hidden;
  }
`;
document.head.appendChild(rippleStyle);

// ===== SMOOTH SCROLL =====
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

// ===== FORM VALIDATION FEEDBACK =====
function validateFormField(field, isValid, message) {
  if (!field) return;
  
  // Remove existing feedback
  const existingFeedback = field.parentElement.querySelector('.validation-feedback');
  if (existingFeedback) {
    existingFeedback.remove();
  }
  
  if (!isValid) {
    field.style.borderColor = '#ef4444';
    const feedback = document.createElement('div');
    feedback.className = 'validation-feedback';
    feedback.style.cssText = `
      color: #ef4444;
      font-size: 0.85rem;
      margin-top: 5px;
      animation: fadeIn 0.3s ease;
    `;
    feedback.textContent = message;
    field.parentElement.appendChild(feedback);
  } else {
    field.style.borderColor = '#22c55e';
    setTimeout(() => {
      field.style.borderColor = '';
    }, 2000);
  }
}

// ===== LOADING STATES FOR ASYNC OPERATIONS =====
function setButtonLoading(button, isLoading, originalText = '') {
  if (!button) return;
  
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.disabled = true;
    button.innerHTML = `
      <span style="display: inline-flex; align-items: center; gap: 8px;">
        <span class="spinner"></span>
        <span>Loading...</span>
      </span>
    `;
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || originalText;
    delete button.dataset.originalText;
  }
}

// Add spinner style
const spinnerStyle = document.createElement('style');
spinnerStyle.textContent = `
  .spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
document.head.appendChild(spinnerStyle);

// ===== ICONS FOR SECTIONS =====
const sectionIcons = {
  'Financial': '💰',
  'Customer': '👥',
  'Internal Process': '⚙️',
  'Learning & Growth': '📚',
  'Reports': '📊',
  'Targets': '🎯',
  'Performance': '📈',
  'Dashboard': '📊',
  'Team': '👥',
  'Feedback': '💬'
};

function addSectionIcons() {
  // Add icons to scorecard section headers
  document.querySelectorAll('.scorecard-section-header').forEach(header => {
    const text = header.textContent.trim();
    if (sectionIcons[text] && !header.querySelector('.section-icon')) {
      header.innerHTML = `<span class="section-icon" style="margin-right: 10px;">${sectionIcons[text]}</span>${text}`;
    }
  });
  
  // Add icons to tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const text = btn.textContent.trim();
    Object.keys(sectionIcons).forEach(key => {
      if (text.toLowerCase().includes(key.toLowerCase()) && !btn.querySelector('.section-icon')) {
        btn.innerHTML = `<span class="section-icon" style="margin-right: 6px;">${sectionIcons[key]}</span>${text}`;
      }
    });
  });
  
  // Add icons to dashboard cards
  document.querySelectorAll('.dashboard-card h3').forEach(heading => {
    const text = heading.textContent.trim();
    // Icons are already in the heading text from Chart.js rendering
    // This just ensures consistency
  });
}

// Apply icons when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addSectionIcons);
} else {
  addSectionIcons();
}

// Re-apply icons when scorecard is rendered
const originalRenderScorecardRows = window.renderScorecardRows;
if (originalRenderScorecardRows) {
  window.renderScorecardRows = function() {
    originalRenderScorecardRows.apply(this, arguments);
    // Use requestAnimationFrame for better timing
    requestAnimationFrame(() => {
      addSectionIcons();
    });
  };
}

// ===== EXPORT FUNCTIONS TO GLOBAL SCOPE =====
window.hideLoader = hideLoader;
window.showLoader = showLoader;
window.showToast = showToast;
window.addTooltip = addTooltip;
window.animateDataUpdate = animateDataUpdate;
window.validateFormField = validateFormField;
window.setButtonLoading = setButtonLoading;
window.addSectionIcons = addSectionIcons;

console.log('✨ ROSE Performance Management - UI Enhancements loaded successfully!');
