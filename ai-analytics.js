// AI-Powered Analytics & Talent Management Features
// ROSE Performance Management System

// ===== AI SUGGESTION SERVICE =====

/**
 * Generate AI-powered goal suggestions based on employee performance data
 * @param {Object} employeeData - Employee performance metrics and history
 * @param {string} dimension - Performance dimension (Financial, Customer, etc.)
 * @returns {Array} Array of suggested goals
 */
function generateAIGoalSuggestions(employeeData, dimension) {
  const suggestions = {
    'Financial': [
      'Reduce departmental operating costs by 10% through process optimization',
      'Increase budget efficiency by identifying and eliminating redundant expenses',
      'Achieve 95% accuracy in budget forecasting and variance reporting',
      'Implement cost-saving initiatives that result in measurable ROI'
    ],
    'Customer': [
      'Improve internal stakeholder satisfaction scores by 15% through enhanced communication',
      'Achieve 90% positive feedback rating from external customers',
      'Reduce customer complaint resolution time by 25%',
      'Build stronger collaborative relationships with 3+ peer departments'
    ],
    'Internal Process': [
      'Streamline workflow to reduce process completion time by 20%',
      'Implement automation for repetitive tasks, saving 10 hours per week',
      'Achieve 98% quality compliance rate in deliverables',
      'Document and standardize 5 key processes for team efficiency'
    ],
    'Learning & Growth': [
      'Complete 40 hours of professional development training in relevant skills',
      'Mentor 2 junior team members in skill development',
      'Achieve certification in [relevant professional area]',
      'Share knowledge through 4 internal training sessions or workshops'
    ]
  };

  // Get base suggestions for the dimension
  let baseSuggestions = suggestions[dimension] || [];

  // Personalize based on employee performance history
  if (employeeData && employeeData.averageScore) {
    const avgScore = parseFloat(employeeData.averageScore);
    
    // Add performance-specific suggestions
    if (avgScore < 3.0) {
      baseSuggestions = baseSuggestions.map(s => 
        s.replace(/\d+%/, (match) => {
          const num = parseInt(match);
          return (Math.max(5, num - 5)) + '%';
        })
      );
    } else if (avgScore >= 4.0) {
      baseSuggestions = baseSuggestions.map(s => 
        s.replace(/\d+%/, (match) => {
          const num = parseInt(match);
          return (num + 5) + '%';
        })
      );
    }
  }

  return baseSuggestions;
}

/**
 * Generate AI-powered comment suggestions for performance reviews
 * @param {Object} scoreData - Score data for a specific metric
 * @param {Object} employeeData - Overall employee data
 * @returns {Array} Array of suggested comments
 */
function generateAICommentSuggestions(scoreData, employeeData) {
  const rating = parseFloat(scoreData.rating) || 0;
  const target = parseFloat(scoreData.target || scoreData.targetBudget) || 0;
  const actual = parseFloat(scoreData.actual || scoreData.actualSpent) || 0;
  const dimension = scoreData.dimension || '';
  const measure = scoreData.measure || '';

  let suggestions = [];

  if (rating >= 4.5) {
    // Exceptional performance
    suggestions = [
      `Exceptional performance on ${measure}. Consistently exceeds expectations and demonstrates outstanding commitment to excellence.`,
      `Outstanding achievement in ${measure}. Your dedication and results significantly contribute to team success.`,
      `Exemplary work on ${measure}. Continue maintaining this high standard and consider sharing best practices with the team.`
    ];
  } else if (rating >= 3.5) {
    // Strong performance
    suggestions = [
      `Strong performance on ${measure}. Consistently meets and often exceeds targets with quality work.`,
      `Solid achievement in ${measure}. Shows good understanding and execution of responsibilities.`,
      `Commendable work on ${measure}. Keep up the good momentum and look for opportunities to further excel.`
    ];
  } else if (rating >= 3.0) {
    // Meets expectations
    suggestions = [
      `Satisfactory performance on ${measure}. Meets core expectations and shows potential for growth.`,
      `Adequate performance in ${measure}. Focus on consistency and identifying areas for improvement.`,
      `Meets baseline requirements for ${measure}. Consider setting stretch goals to demonstrate higher capabilities.`
    ];
  } else {
    // Below expectations
    suggestions = [
      `${measure} requires improvement. Let's work together to identify obstacles and create an action plan for better results.`,
      `Performance on ${measure} is below target. Schedule a one-on-one to discuss challenges and support needed.`,
      `${measure} needs focused attention. Consider additional training or resources to strengthen this area.`
    ];
  }

  // Add context-specific suggestions based on dimension
  if (dimension === 'Financial' && actual > 0 && target > 0) {
    const variance = ((actual - target) / target * 100).toFixed(1);
    if (actual < target) {
      suggestions.push(`Excellent cost management with ${Math.abs(variance)}% savings. This demonstrates strong fiscal responsibility.`);
    } else if (actual > target) {
      suggestions.push(`Budget variance of ${variance}% needs attention. Let's review spending patterns and adjust accordingly.`);
    }
  }

  return suggestions;
}

/**
 * Generate comprehensive monthly performance review for an employee
 * @param {Object} employeeData - Employee data including scores and history
 * @param {string} month - Month for the review
 * @param {string} year - Year for the review
 * @returns {Object} Generated review with sections
 */
function generateMonthlyReview(employeeData, month, year) {
  if (!employeeData || !employeeData.scores || employeeData.scores.length === 0) {
    return {
      summary: 'Insufficient data for AI-generated review.',
      strengths: [],
      improvements: [],
      goals: [],
      overall: ''
    };
  }

  const scores = employeeData.scores;
  const avgScore = scores.reduce((sum, s) => sum + (parseFloat(s.rating) || 0), 0) / scores.length;

  // Identify strengths (ratings >= 4.0)
  const strengths = scores
    .filter(s => parseFloat(s.rating) >= 4.0)
    .map(s => `${s.measure}: Consistently strong performance with rating of ${s.rating}`);

  // Identify improvement areas (ratings < 3.0)
  const improvements = scores
    .filter(s => parseFloat(s.rating) < 3.0)
    .map(s => `${s.measure}: Requires attention, current rating ${s.rating}`);

  // Generate recommended goals
  const dimensionsNeedingWork = scores
    .filter(s => parseFloat(s.rating) < 3.5)
    .map(s => s.dimension);
  
  const uniqueDimensions = [...new Set(dimensionsNeedingWork)];
  const goals = uniqueDimensions.slice(0, 3).map(dim => 
    generateAIGoalSuggestions({ averageScore: avgScore }, dim)[0]
  );

  // Overall assessment
  let overall = '';
  if (avgScore >= 4.5) {
    overall = `${employeeData.name} has demonstrated exceptional performance this month with an average score of ${avgScore.toFixed(2)}. Their consistent excellence across multiple dimensions makes them a valuable asset to the team.`;
  } else if (avgScore >= 3.5) {
    overall = `${employeeData.name} shows strong performance this month with an average score of ${avgScore.toFixed(2)}. They consistently meet expectations and demonstrate reliability in their responsibilities.`;
  } else if (avgScore >= 3.0) {
    overall = `${employeeData.name} meets baseline expectations with an average score of ${avgScore.toFixed(2)}. There are opportunities for growth and development in several areas.`;
  } else {
    overall = `${employeeData.name}'s performance this month (${avgScore.toFixed(2)}) indicates a need for focused improvement. Let's schedule a detailed discussion to address challenges and provide necessary support.`;
  }

  return {
    summary: overall,
    strengths: strengths.length > 0 ? strengths : ['No significant strengths identified this period'],
    improvements: improvements.length > 0 ? improvements : ['Continue maintaining current performance levels'],
    goals: goals.length > 0 ? goals : ['Set specific, measurable goals for next review period'],
    overall: overall,
    monthYear: `${getMonthName(month)} ${year}`,
    score: avgScore.toFixed(2)
  };
}

/**
 * Generate AI-powered performance review for quarterly or yearly periods
 * @param {Object} employeeData - Employee performance data with scores
 * @param {string} periodType - 'quarterly' or 'yearly'
 * @param {string} year - Year
 * @param {string} quarter - Quarter (e.g., 'Q1') - only for quarterly reviews
 * @returns {Object} Review with summary, strengths, improvements, and goals
 */
function generatePeriodReview(employeeData, periodType, year, quarter) {
  if (!employeeData || !employeeData.scores || employeeData.scores.length === 0) {
    return {
      summary: 'Insufficient data for AI-generated review.',
      strengths: [],
      improvements: [],
      goals: [],
      overall: '',
      score: '0.00'
    };
  }

  const scores = employeeData.scores;
  const avgScore = scores.reduce((sum, s) => sum + (parseFloat(s.rating) || 0), 0) / scores.length;

  // Identify strengths (ratings >= 4.0)
  const strengths = scores
    .filter(s => parseFloat(s.rating) >= 4.0)
    .map(s => `${s.measure}: Consistently strong performance with rating of ${s.rating}`);

  // Identify improvement areas (ratings < 3.0)
  const improvements = scores
    .filter(s => parseFloat(s.rating) < 3.0)
    .map(s => `${s.measure}: Requires attention, current rating ${s.rating}`);

  // Generate recommended goals
  const dimensionsNeedingWork = scores
    .filter(s => parseFloat(s.rating) < 3.5)
    .map(s => s.dimension);
  
  const uniqueDimensions = [...new Set(dimensionsNeedingWork)];
  const goals = uniqueDimensions.slice(0, 3).map(dim => 
    generateAIGoalSuggestions({ averageScore: avgScore }, dim)[0]
  );

  // Overall assessment based on period type
  const periodLabel = periodType === 'yearly' ? `this year` : `this quarter`;
  let overall = '';
  if (avgScore >= 4.5) {
    overall = `${employeeData.name} has demonstrated exceptional performance ${periodLabel} with an average score of ${avgScore.toFixed(2)}. Their consistent excellence across multiple dimensions makes them a valuable asset to the team.`;
  } else if (avgScore >= 3.5) {
    overall = `${employeeData.name} shows strong performance ${periodLabel} with an average score of ${avgScore.toFixed(2)}. They consistently meet expectations and demonstrate reliability in their responsibilities.`;
  } else if (avgScore >= 3.0) {
    overall = `${employeeData.name} meets baseline expectations with an average score of ${avgScore.toFixed(2)}. There are opportunities for growth and development in several areas.`;
  } else {
    overall = `${employeeData.name}'s performance ${periodLabel} (${avgScore.toFixed(2)}) indicates a need for focused improvement. Let's schedule a detailed discussion to address challenges and provide necessary support.`;
  }

  return {
    summary: overall,
    strengths: strengths.length > 0 ? strengths : ['No significant strengths identified this period'],
    improvements: improvements.length > 0 ? improvements : ['Continue maintaining current performance levels'],
    goals: goals.length > 0 ? goals : ['Set specific, measurable goals for next review period'],
    overall: overall,
    score: avgScore.toFixed(2)
  };
}

// ===== EMPLOYEE RECOGNITION SYSTEM =====

/**
 * Calculate recognition scores for employees
 * @param {Array} employees - Array of employee data with performance scores
 * @param {string} period - 'month', 'quarter', or 'year'
 * @param {string} department - Optional department filter
 * @returns {Array} Sorted array of employees with recognition scores
 */
function calculateRecognitionScores(employees, period, department = null) {
  if (!employees || employees.length === 0) return [];

  // Filter by department if specified
  let filteredEmployees = department 
    ? employees.filter(e => e.division === department)
    : employees;

  // Calculate recognition score for each employee
  const scoredEmployees = filteredEmployees.map(emp => {
    let recognitionScore = 0;
    let dataPoints = 0;

    if (emp.scores && Array.isArray(emp.scores)) {
      emp.scores.forEach(score => {
        const rating = parseFloat(score.rating) || 0;
        const weight = parseFloat(score.weight) || 0;
        recognitionScore += (rating * weight / 100);
        dataPoints++;
      });
    }

    // Peer feedback bonus (if available)
    const peerScore = emp.peerFeedbackScore || 0;
    if (peerScore > 0) {
      recognitionScore += (peerScore * 0.25); // 25% weight for peer feedback
    }

    // Consistency bonus (less variance = better)
    if (emp.scores && emp.scores.length > 1) {
      const ratings = emp.scores.map(s => parseFloat(s.rating) || 0);
      const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const variance = ratings.reduce((sum, r) => sum + Math.pow(r - avgRating, 2), 0) / ratings.length;
      const consistencyBonus = Math.max(0, 1 - (variance / 2)); // Lower variance = higher bonus
      recognitionScore += consistencyBonus;
    }

    return {
      ...emp,
      recognitionScore: recognitionScore,
      dataPoints: dataPoints
    };
  });

  // Sort by recognition score (descending)
  return scoredEmployees
    .filter(e => e.dataPoints > 0) // Only include employees with data
    .sort((a, b) => b.recognitionScore - a.recognitionScore);
}

/**
 * Select Employee of the Month for a department
 * @param {Array} employees - Employee data
 * @param {string} department - Department name
 * @param {string} month - Month
 * @param {string} year - Year
 * @returns {Object} Selected employee or null
 */
function selectEmployeeOfMonth(employees, department, month, year) {
  const rankedEmployees = calculateRecognitionScores(employees, 'month', department);
  
  if (rankedEmployees.length === 0) return null;

  const winner = rankedEmployees[0];
  return {
    employee: winner,
    award: 'Employee of the Month',
    department: department,
    period: `${getMonthName(month)} ${year}`,
    score: winner.recognitionScore.toFixed(2),
    rank: 1,
    totalCandidates: rankedEmployees.length
  };
}

/**
 * Select Employee of the Quarter for a department
 * @param {Array} employees - Employee data
 * @param {string} department - Department name
 * @param {string} quarter - Quarter (Q1, Q2, Q3, Q4)
 * @param {string} year - Year
 * @returns {Object} Selected employee or null
 */
function selectEmployeeOfQuarter(employees, department, quarter, year) {
  const rankedEmployees = calculateRecognitionScores(employees, 'quarter', department);
  
  if (rankedEmployees.length === 0) return null;

  const winner = rankedEmployees[0];
  return {
    employee: winner,
    award: 'Employee of the Quarter',
    department: department,
    period: `${quarter} ${year}`,
    score: winner.recognitionScore.toFixed(2),
    rank: 1,
    totalCandidates: rankedEmployees.length
  };
}

/**
 * Select Employee of the Year for a department
 * @param {Array} employees - Employee data
 * @param {string} department - Department name
 * @param {string} year - Year
 * @returns {Object} Selected employee or null
 */
function selectEmployeeOfYear(employees, department, year) {
  const rankedEmployees = calculateRecognitionScores(employees, 'year', department);
  
  if (rankedEmployees.length === 0) return null;

  const winner = rankedEmployees[0];
  return {
    employee: winner,
    award: 'Employee of the Year',
    department: department,
    period: year,
    score: winner.recognitionScore.toFixed(2),
    rank: 1,
    totalCandidates: rankedEmployees.length
  };
}

/**
 * Get organization-wide recognition winners
 * @param {Array} employees - All employee data
 * @param {string} period - 'month', 'quarter', or 'year'
 * @param {string} periodValue - Specific period value
 * @param {string} year - Year
 * @returns {Object} Organization-wide winner
 */
function selectOrganizationWinner(employees, period, periodValue, year) {
  const rankedEmployees = calculateRecognitionScores(employees, period, null);
  
  if (rankedEmployees.length === 0) return null;

  const winner = rankedEmployees[0];
  let periodLabel = '';
  
  if (period === 'month') {
    periodLabel = `${getMonthName(periodValue)} ${year}`;
  } else if (period === 'quarter') {
    periodLabel = `${periodValue} ${year}`;
  } else {
    periodLabel = year;
  }

  return {
    employee: winner,
    award: `Organization ${period === 'month' ? 'Employee of the Month' : period === 'quarter' ? 'Employee of the Quarter' : 'Employee of the Year'}`,
    department: winner.division || 'Organization-Wide',
    period: periodLabel,
    score: winner.recognitionScore.toFixed(2),
    rank: 1,
    totalCandidates: rankedEmployees.length
  };
}

// ===== NOTIFICATION SYSTEM =====

/**
 * Create notification for AI reports
 * @param {string} recipientEmail - Email of recipient
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 * @returns {Object} Notification object
 */
function createAIReportNotification(recipientEmail, type, data) {
  return {
    id: generateNotificationId(),
    recipientEmail: recipientEmail,
    type: type, // 'ai_suggestion', 'recognition', 'insight'
    title: data.title,
    message: data.message,
    actionUrl: data.actionUrl || null,
    data: data,
    timestamp: new Date().toISOString(),
    read: false,
    priority: data.priority || 'normal' // 'high', 'normal', 'low'
  };
}

/**
 * Create notification for employee recognition
 * @param {Object} recognition - Recognition data
 * @returns {Object} Notification object
 */
function createRecognitionNotification(recognition) {
  return {
    id: generateNotificationId(),
    recipientEmail: recognition.employee.email,
    type: 'recognition',
    title: `🏆 Congratulations! You're ${recognition.award}!`,
    message: `You've been selected as ${recognition.award} for ${recognition.period} with a recognition score of ${recognition.score}!`,
    actionUrl: '#recognitions',
    data: recognition,
    timestamp: new Date().toISOString(),
    read: false,
    priority: 'high'
  };
}

/**
 * Generate unique notification ID
 */
function generateNotificationId() {
  return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Store notification in localStorage
 */
function storeNotification(notification) {
  try {
    const notifications = getStoredNotifications();
    notifications.unshift(notification);
    
    // Keep only last 50 notifications
    const trimmed = notifications.slice(0, 50);
    localStorage.setItem('rose_pms_notifications', JSON.stringify(trimmed));
    
    return true;
  } catch (error) {
    console.error('Error storing notification:', error);
    return false;
  }
}

/**
 * Get stored notifications from localStorage
 */
function getStoredNotifications() {
  try {
    const stored = localStorage.getItem('rose_pms_notifications');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error retrieving notifications:', error);
    return [];
  }
}

/**
 * Get unread notification count for user
 */
function getUnreadNotificationCount(userEmail) {
  const notifications = getStoredNotifications();
  return notifications.filter(n => n.recipientEmail === userEmail && !n.read).length;
}

/**
 * Mark notification as read
 */
function markNotificationAsRead(notificationId) {
  try {
    const notifications = getStoredNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      localStorage.setItem('rose_pms_notifications', JSON.stringify(notifications));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

// ===== HELPER FUNCTIONS =====

function getMonthName(monthNum) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const num = parseInt(monthNum);
  return months[num - 1] || monthNum;
}

// ===== EXPORT FOR USE IN MAIN APPLICATION =====
if (typeof window !== 'undefined') {
  window.AIAnalytics = {
    generateAIGoalSuggestions,
    generateAICommentSuggestions,
    generateMonthlyReview,
    generatePeriodReview,
    calculateRecognitionScores,
    selectEmployeeOfMonth,
    selectEmployeeOfQuarter,
    selectEmployeeOfYear,
    selectOrganizationWinner,
    createAIReportNotification,
    createRecognitionNotification,
    storeNotification,
    getStoredNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead
  };
}
