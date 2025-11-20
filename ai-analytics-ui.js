// AI Analytics UI Components
// ROSE Performance Management System

// ===== AI SUGGESTION UI =====

/**
 * Show AI goal suggestion modal
 */
function showAIGoalSuggestionModal(dimension, employeeData, targetCallback) {
  const modal = document.createElement('div');
  modal.className = 'scorecard-modal';
  
  const suggestions = window.AIAnalytics.generateAIGoalSuggestions(employeeData, dimension);
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 700px;">
      <div class="modal-header">
        <h2>🤖 AI Goal Suggestions for ${dimension}</h2>
        <button class="modal-close" onclick="this.closest('.scorecard-modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <p style="color: #718096; margin-bottom: 20px;">
          Based on performance data and best practices, here are AI-generated goal suggestions:
        </p>
        
        <div class="ai-suggestions-list">
          ${suggestions.map((suggestion, index) => `
            <div class="ai-suggestion-item" data-suggestion="${escapeHtml(suggestion)}">
              <div style="display: flex; align-items: start; gap: 12px;">
                <span style="font-size: 1.5em;">💡</span>
                <div style="flex: 1;">
                  <p style="margin: 0; color: #2d3748; line-height: 1.6;">${escapeHtml(suggestion)}</p>
                </div>
                <button onclick="selectAISuggestion(this)" class="btn-select-suggestion"
                        style="background: #667eea; color: white; border: none; padding: 8px 16px; 
                               border-radius: 6px; cursor: pointer; white-space: nowrap;">
                  Use This
                </button>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div style="margin-top: 25px; padding: 15px; background: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; font-size: 0.9em; color: #78350f;">
            💡 <strong>Tip:</strong> You can customize these suggestions to better fit the specific context and needs.
          </p>
        </div>
      </div>
      <div class="modal-footer">
        <button onclick="this.closest('.scorecard-modal').remove()" class="btn-close-modal">Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Store callback for use when suggestion is selected
  window.currentAISuggestionCallback = targetCallback;
}

/**
 * Select an AI suggestion
 */
function selectAISuggestion(button) {
  const suggestionItem = button.closest('.ai-suggestion-item');
  const suggestion = suggestionItem.dataset.suggestion;
  
  if (window.currentAISuggestionCallback) {
    window.currentAISuggestionCallback(suggestion);
  }
  
  // Close modal
  button.closest('.scorecard-modal').remove();
  
  if (typeof showToast === 'function') {
    showToast('✅ AI suggestion applied! You can now customize it further.', 'success');
  }
}

/**
 * Show AI comment suggestion modal
 */
function showAICommentSuggestionModal(scoreData, employeeData, commentCallback) {
  const modal = document.createElement('div');
  modal.className = 'scorecard-modal';
  
  const suggestions = window.AIAnalytics.generateAICommentSuggestions(scoreData, employeeData);
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 700px;">
      <div class="modal-header">
        <h2>🤖 AI Comment Suggestions</h2>
        <button class="modal-close" onclick="this.closest('.scorecard-modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
          <p style="margin: 0;"><strong>Metric:</strong> ${escapeHtml(scoreData.measure)}</p>
          <p style="margin: 8px 0 0 0;"><strong>Rating:</strong> ${scoreData.rating} / 5.0</p>
        </div>
        
        <p style="color: #718096; margin-bottom: 20px;">
          Based on the performance rating and context, here are AI-generated comment suggestions:
        </p>
        
        <div class="ai-suggestions-list">
          ${suggestions.map((suggestion, index) => `
            <div class="ai-suggestion-item" data-suggestion="${escapeHtml(suggestion)}">
              <div style="display: flex; align-items: start; gap: 12px;">
                <span style="font-size: 1.5em;">💬</span>
                <div style="flex: 1;">
                  <p style="margin: 0; color: #2d3748; line-height: 1.6;">${escapeHtml(suggestion)}</p>
                </div>
                <button onclick="selectAISuggestion(this)" class="btn-select-suggestion"
                        style="background: #667eea; color: white; border: none; padding: 8px 16px; 
                               border-radius: 6px; cursor: pointer; white-space: nowrap;">
                  Use This
                </button>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div style="margin-top: 25px; padding: 15px; background: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; font-size: 0.9em; color: #78350f;">
            💡 <strong>Tip:</strong> Personalize these comments with specific examples and observations for more meaningful feedback.
          </p>
        </div>
      </div>
      <div class="modal-footer">
        <button onclick="this.closest('.scorecard-modal').remove()" class="btn-close-modal">Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Store callback for use when suggestion is selected
  window.currentAISuggestionCallback = commentCallback;
}

/**
 * Show monthly review generator for managers
 */
function showMonthlyReviewGenerator(employeeEmail, employeeName) {
  if (!userProfile || (userRole !== 'Manager' && userRole !== 'Admin')) {
    alert('This feature is only available to managers.');
    return;
  }
  
  // Show period selector modal first
  const selectorModal = document.createElement('div');
  selectorModal.className = 'scorecard-modal';
  selectorModal.id = 'periodSelectorModal';
  
  const currentYear = new Date().getFullYear();
  const currentQuarter = 'Q' + Math.ceil((new Date().getMonth() + 1) / 3);
  
  selectorModal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h2>📅 Select Review Period</h2>
        <button class="modal-close" onclick="this.closest('.scorecard-modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <p style="color: #718096; margin-bottom: 20px;">
          Choose the period for the performance review. Reviews can be generated quarterly or yearly.
        </p>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3748;">Period Type:</label>
          <select id="aiReviewPeriodType" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 1em;">
            <option value="quarterly">Quarterly Review</option>
            <option value="yearly">Yearly Review</option>
          </select>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3748;">Year:</label>
          <select id="aiReviewYear" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 1em;">
            <option value="${currentYear}">${currentYear}</option>
            <option value="${currentYear - 1}">${currentYear - 1}</option>
            <option value="${currentYear + 1}">${currentYear + 1}</option>
          </select>
        </div>
        
        <div id="quarterSelectorDiv" style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3748;">Quarter:</label>
          <select id="aiReviewQuarter" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 1em;">
            <option value="Q1" ${currentQuarter === 'Q1' ? 'selected' : ''}>Q1 (Jan-Mar)</option>
            <option value="Q2" ${currentQuarter === 'Q2' ? 'selected' : ''}>Q2 (Apr-Jun)</option>
            <option value="Q3" ${currentQuarter === 'Q3' ? 'selected' : ''}>Q3 (Jul-Sep)</option>
            <option value="Q4" ${currentQuarter === 'Q4' ? 'selected' : ''}>Q4 (Oct-Dec)</option>
          </select>
        </div>
        
        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; margin-top: 20px;">
          <p style="margin: 0; font-size: 0.9em; color: #2d3748;">
            💡 <strong>Tip:</strong> Quarterly reviews provide more detailed insights for recent performance, 
            while yearly reviews give a comprehensive overview of the entire year.
          </p>
        </div>
      </div>
      <div class="modal-footer">
        <button onclick="this.closest('.scorecard-modal').remove()" class="btn-close-modal">Cancel</button>
        <button onclick="generateReviewWithPeriod('${employeeEmail}', '${escapeHtml(employeeName)}')" 
                style="background: #667eea; color: white; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-weight: 600;">
          Generate Review
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(selectorModal);
  
  // Add event listener to show/hide quarter selector
  document.getElementById('aiReviewPeriodType').addEventListener('change', function() {
    const quarterDiv = document.getElementById('quarterSelectorDiv');
    if (this.value === 'yearly') {
      quarterDiv.style.display = 'none';
    } else {
      quarterDiv.style.display = 'block';
    }
  });
}

function generateReviewWithPeriod(employeeEmail, employeeName) {
  // Get selected period
  const periodType = document.getElementById('aiReviewPeriodType').value;
  const year = document.getElementById('aiReviewYear').value;
  const quarter = document.getElementById('aiReviewQuarter')?.value;
  
  // Close period selector
  document.getElementById('periodSelectorModal')?.remove();
  
  // Show loading modal
  const loadingModal = document.createElement('div');
  loadingModal.className = 'scorecard-modal';
  loadingModal.id = 'reviewLoadingModal';
  loadingModal.innerHTML = `
    <div class="modal-content" style="max-width: 600px; text-align: center;">
      <div class="modal-body">
        <div class="rose-flower" style="margin: 30px auto;">
          <div class="rose-petal"></div>
          <div class="rose-petal"></div>
          <div class="rose-petal"></div>
          <div class="rose-petal"></div>
          <div class="rose-petal"></div>
          <div class="rose-petal"></div>
          <div class="rose-center"></div>
        </div>
        <h3>🤖 Generating AI-Powered Review...</h3>
        <p style="color: #718096;">Analyzing performance data and generating ${periodType} insights for ${escapeHtml(employeeName)}</p>
      </div>
    </div>
  `;
  document.body.appendChild(loadingModal);
  
  // Get employee performance data with period filter
  let url = APPS_SCRIPT_URL + '?action=getEmployeeScores&employeeEmail=' + 
              encodeURIComponent(employeeEmail);
  
  if (periodType === 'quarterly' && quarter) {
    url += '&year=' + year + '&quarter=' + quarter;
  } else if (periodType === 'yearly') {
    url += '&year=' + year;
  }
  
  url += '&callback=handlePeriodReviewData';
  
  window.handlePeriodReviewData = function(records) {
    // Remove loading modal
    const loading = document.getElementById('reviewLoadingModal');
    if (loading) loading.remove();
    
    if (!records || records.length === 0) {
      alert('No performance data available for this employee in the selected period.');
      return;
    }
    
    // Prepare employee data
    const employeeData = {
      name: employeeName,
      email: employeeEmail,
      scores: []
    };
    
    // Aggregate scores based on period type
    const filteredRecords = filterRecordsByPeriod(records, periodType, year, quarter);
    
    filteredRecords.forEach(rec => {
      try {
        let scoresData = rec.Scores || rec.scores;
        let scoresArr = typeof scoresData === 'string' ? JSON.parse(scoresData) : scoresData;
        if (Array.isArray(scoresArr)) {
          employeeData.scores.push(...scoresArr);
        }
      } catch (e) {
        console.error('Error parsing scores:', e);
      }
    });
    
    // Generate review with period info
    const review = window.AIAnalytics.generatePeriodReview(employeeData, periodType, year, quarter);
    
    // Display review modal
    displayPeriodReview(review, employeeEmail, employeeName, periodType, year, quarter);
  };
  
  const script = document.createElement('script');
  script.src = url;
  document.body.appendChild(script);
}

function filterRecordsByPeriod(records, periodType, year, quarter) {
  if (periodType === 'yearly') {
    return records.filter(rec => {
      const recYear = String(rec.Year || rec.year);
      return recYear === String(year);
    });
  } else if (periodType === 'quarterly') {
    const quarterMonths = {
      'Q1': ['01', '02', '03'],
      'Q2': ['04', '05', '06'],
      'Q3': ['07', '08', '09'],
      'Q4': ['10', '11', '12']
    };
    
    return records.filter(rec => {
      const recYear = String(rec.Year || rec.year);
      const recMonth = String(rec.Month || rec.month).padStart(2, '0');
      return recYear === String(year) && quarterMonths[quarter].includes(recMonth);
    });
  }
  return records;
}

/**
 * Display generated period review (quarterly or yearly)
 */
function displayPeriodReview(review, employeeEmail, employeeName, periodType, year, quarter) {
  const modal = document.createElement('div');
  modal.className = 'scorecard-modal';
  
  const periodLabel = periodType === 'yearly' ? `${year} Annual Review` : `${year} ${quarter} Review`;
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 900px;">
      <div class="modal-header">
        <h2>🤖 AI-Generated Performance Review</h2>
        <button class="modal-close" onclick="this.closest('.scorecard-modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; 
                    padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="margin: 0 0 10px 0; color: white;">Performance Review: ${escapeHtml(employeeName)}</h3>
          <p style="margin: 0; opacity: 0.9;">Period: ${periodLabel}</p>
          <p style="margin: 5px 0 0 0; font-size: 1.3em; font-weight: bold;">
            Overall Score: ${review.score} / 5.0
          </p>
        </div>
        
        <div class="review-section">
          <h3 style="color: #667eea; margin-top: 0;">📝 Executive Summary</h3>
          <p style="line-height: 1.8; color: #2d3748;">${escapeHtml(review.summary)}</p>
        </div>
        
        <div class="review-section" style="margin-top: 25px;">
          <h3 style="color: #48bb78;">💪 Key Strengths</h3>
          <ul style="line-height: 1.8; color: #2d3748;">
            ${review.strengths.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
          </ul>
        </div>
        
        <div class="review-section" style="margin-top: 25px;">
          <h3 style="color: #ed8936;">🎯 Areas for Development</h3>
          <ul style="line-height: 1.8; color: #2d3748;">
            ${review.improvements.map(i => `<li>${escapeHtml(i)}</li>`).join('')}
          </ul>
        </div>
        
        <div class="review-section" style="margin-top: 25px;">
          <h3 style="color: #667eea;">🚀 Recommended Goals for Next Period</h3>
          <ul style="line-height: 1.8; color: #2d3748;">
            ${review.goals.map(g => `<li>${escapeHtml(g)}</li>`).join('')}
          </ul>
        </div>
        
        <div style="margin-top: 30px; padding: 20px; background: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; font-size: 0.95em; color: #78350f;">
            ℹ️ <strong>Note:</strong> This review is AI-generated based on performance data. 
            Please review, customize, and add your personal observations before sharing with the employee.
          </p>
        </div>
      </div>
      <div class="modal-footer">
        <button onclick="copyReviewToClipboard()" style="background: #667eea; margin-right: 10px;">
          📋 Copy to Clipboard
        </button>
        <button onclick="saveReviewAsDraft('${employeeEmail}')" style="background: #48bb78; margin-right: 10px;">
          💾 Save as Draft
        </button>
        <button onclick="this.closest('.scorecard-modal').remove()" class="btn-close-modal">Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Store review data for copy/save functions
  window.currentGeneratedReview = review;
}

/**
 * Copy review to clipboard
 */
function copyReviewToClipboard() {
  if (!window.currentGeneratedReview) return;
  
  const review = window.currentGeneratedReview;
  const text = `
Performance Review: ${review.monthYear}
Overall Score: ${review.score} / 5.0

EXECUTIVE SUMMARY:
${review.summary}

KEY STRENGTHS:
${review.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

AREAS FOR DEVELOPMENT:
${review.improvements.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

RECOMMENDED GOALS:
${review.goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}
  `.trim();
  
  navigator.clipboard.writeText(text).then(() => {
    if (typeof showToast === 'function') {
      showToast('✅ Review copied to clipboard!', 'success');
    } else {
      alert('Review copied to clipboard!');
    }
  }).catch(err => {
    console.error('Could not copy text: ', err);
    alert('Could not copy to clipboard. Please select and copy manually.');
  });
}

/**
 * Save review as draft
 */
function saveReviewAsDraft(employeeEmail) {
  if (!window.currentGeneratedReview) return;
  
  try {
    const drafts = JSON.parse(localStorage.getItem('rose_pms_review_drafts') || '[]');
    
    drafts.push({
      employeeEmail: employeeEmail,
      review: window.currentGeneratedReview,
      savedAt: new Date().toISOString(),
      managerEmail: userProfile.email
    });
    
    localStorage.setItem('rose_pms_review_drafts', JSON.stringify(drafts));
    
    if (typeof showToast === 'function') {
      showToast('✅ Review saved as draft!', 'success');
    } else {
      alert('Review saved as draft!');
    }
  } catch (error) {
    console.error('Error saving draft:', error);
    alert('Could not save draft: ' + error.message);
  }
}

// ===== RECOGNITION DISPLAY =====

/**
 * Display recognition awards on dashboard
 */
function displayRecognitionAwards(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Get stored recognitions
  const recognitions = JSON.parse(localStorage.getItem('rose_pms_recognitions') || '[]');
  
  if (recognitions.length === 0) {
    container.innerHTML = `
      <div class="empty-msg" style="text-align: center; padding: 40px;">
        <span style="font-size: 3em;">🏆</span>
        <h3>No Recognition Awards Yet</h3>
        <p style="color: #718096;">Recognition awards will appear here when calculated.</p>
      </div>
    `;
    return;
  }
  
  let html = '<div class="recognition-grid">';
  
  recognitions.forEach(recognition => {
    const isUserRecipient = userProfile && recognition.employee.email === userProfile.email;
    const borderColor = isUserRecipient ? '#fbbf24' : '#667eea';
    
    html += `
      <div class="recognition-card" style="border: 3px solid ${borderColor}; ${isUserRecipient ? 'background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);' : ''}">
        <div style="text-align: center; margin-bottom: 15px;">
          <span style="font-size: 4em;">${getAwardEmoji(recognition.award)}</span>
        </div>
        <h3 style="text-align: center; color: #c12040; margin: 10px 0;">
          ${recognition.award}
        </h3>
        <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; margin: 15px 0;">
          <h4 style="margin: 0 0 8px 0; color: #2d3748; font-size: 1.2em;">
            ${escapeHtml(recognition.employee.name || recognition.employee.email)}
          </h4>
          <p style="margin: 0; color: #718096; font-size: 0.9em;">
            ${escapeHtml(recognition.department)}
          </p>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
          <div style="text-align: center; padding: 10px; background: rgba(102, 126, 234, 0.1); border-radius: 6px;">
            <div style="font-size: 0.8em; color: #667eea; font-weight: 600;">PERIOD</div>
            <div style="font-size: 0.9em; color: #2d3748; margin-top: 5px;">${recognition.period}</div>
          </div>
          <div style="text-align: center; padding: 10px; background: rgba(72, 187, 120, 0.1); border-radius: 6px;">
            <div style="font-size: 0.8em; color: #48bb78; font-weight: 600;">SCORE</div>
            <div style="font-size: 0.9em; color: #2d3748; margin-top: 5px;">${recognition.score}</div>
          </div>
        </div>
        ${isUserRecipient ? '<div style="text-align: center; margin-top: 15px; padding: 10px; background: rgba(251, 191, 36, 0.2); border-radius: 6px; font-weight: 600; color: #92400e;">🎉 Congratulations!</div>' : ''}
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

function getAwardEmoji(awardType) {
  if (awardType.includes('Month')) return '🌟';
  if (awardType.includes('Quarter')) return '🏅';
  if (awardType.includes('Year')) return '🏆';
  return '⭐';
}

// ===== NOTIFICATION CENTER =====

/**
 * Display notification center
 */
function showNotificationCenter() {
  if (!userProfile) {
    alert('Please sign in to view notifications.');
    return;
  }
  
  const notifications = window.AIAnalytics.getStoredNotifications()
    .filter(n => n.recipientEmail === userProfile.email)
    .slice(0, 20); // Show last 20 notifications
  
  const modal = document.createElement('div');
  modal.className = 'scorecard-modal';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 800px;">
      <div class="modal-header">
        <h2>🔔 Notification Center</h2>
        <button class="modal-close" onclick="this.closest('.scorecard-modal').remove()">&times;</button>
      </div>
      <div class="modal-body" style="max-height: 600px; overflow-y: auto;">
        ${notifications.length === 0 ? `
          <div style="text-align: center; padding: 60px 20px; color: #718096;">
            <span style="font-size: 4em;">📭</span>
            <h3>No Notifications</h3>
            <p>You're all caught up!</p>
          </div>
        ` : `
          <div class="notifications-list">
            ${notifications.map(notif => `
              <div class="notification-item ${notif.read ? 'read' : 'unread'}" 
                   data-notification-id="${notif.id}"
                   onclick="handleNotificationClick('${notif.id}', '${notif.actionUrl || ''}')">
                <div style="display: flex; gap: 15px; align-items: start;">
                  <div style="font-size: 2em; flex-shrink: 0;">
                    ${getNotificationIcon(notif.type)}
                  </div>
                  <div style="flex: 1;">
                    <h4 style="margin: 0 0 8px 0; color: #2d3748;">
                      ${escapeHtml(notif.title)}
                      ${!notif.read ? '<span style="display: inline-block; width: 8px; height: 8px; background: #ef4444; border-radius: 50%; margin-left: 8px;"></span>' : ''}
                    </h4>
                    <p style="margin: 0 0 8px 0; color: #4a5568; line-height: 1.6;">
                      ${escapeHtml(notif.message)}
                    </p>
                    <div style="font-size: 0.85em; color: #a0aec0;">
                      ${formatNotificationTime(notif.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
      <div class="modal-footer">
        <button onclick="markAllNotificationsRead()" style="background: #667eea; margin-right: 10px;">
          ✅ Mark All as Read
        </button>
        <button onclick="this.closest('.scorecard-modal').remove()" class="btn-close-modal">Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function getNotificationIcon(type) {
  const icons = {
    'ai_suggestion': '🤖',
    'recognition': '🏆',
    'insight': '💡',
    'target_update': '🎯',
    'feedback_request': '📝'
  };
  return icons[type] || '🔔';
}

function handleNotificationClick(notificationId, actionUrl) {
  // Mark as read
  window.AIAnalytics.markNotificationAsRead(notificationId);
  
  // Navigate if action URL exists
  if (actionUrl && actionUrl !== 'null' && actionUrl !== '') {
    // Close modal
    document.querySelector('.scorecard-modal')?.remove();
    
    // Navigate
    if (actionUrl.startsWith('#')) {
      const tabId = actionUrl.substring(1);
      const tabButton = document.querySelector(`[aria-controls="${tabId}"]`);
      if (tabButton) {
        showTab(tabId, tabButton);
      }
    }
  }
  
  // Update notification badge
  updateNotificationBadge();
}

function markAllNotificationsRead() {
  const notifications = window.AIAnalytics.getStoredNotifications();
  notifications.forEach(n => {
    if (n.recipientEmail === userProfile.email) {
      n.read = true;
    }
  });
  
  try {
    localStorage.setItem('rose_pms_notifications', JSON.stringify(notifications));
    if (typeof showToast === 'function') {
      showToast('✅ All notifications marked as read', 'success');
    }
    
    // Refresh notification center
    document.querySelector('.scorecard-modal')?.remove();
    showNotificationCenter();
    
    // Update badge
    updateNotificationBadge();
  } catch (error) {
    console.error('Error marking all as read:', error);
  }
}

function formatNotificationTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

/**
 * Update notification badge in UI
 */
function updateNotificationBadge() {
  if (!userProfile) return;
  
  const count = window.AIAnalytics.getUnreadNotificationCount(userProfile.email);
  const badge = document.getElementById('notification-badge');
  
  if (badge) {
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }
}

// ===== HELPER FUNCTIONS =====

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== INITIALIZE ON LOAD =====
if (typeof window !== 'undefined') {
  window.showAIGoalSuggestionModal = showAIGoalSuggestionModal;
  window.showAICommentSuggestionModal = showAICommentSuggestionModal;
  window.showMonthlyReviewGenerator = showMonthlyReviewGenerator;
  window.selectAISuggestion = selectAISuggestion;
  window.copyReviewToClipboard = copyReviewToClipboard;
  window.saveReviewAsDraft = saveReviewAsDraft;
  window.displayRecognitionAwards = displayRecognitionAwards;
  window.showNotificationCenter = showNotificationCenter;
  window.handleNotificationClick = handleNotificationClick;
  window.markAllNotificationsRead = markAllNotificationsRead;
  window.updateNotificationBadge = updateNotificationBadge;
}
