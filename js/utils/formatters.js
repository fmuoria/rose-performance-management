/**
 * Data Formatting Utilities Module
 * Provides functions for formatting data for display
 * @module utils/formatters
 */

/**
 * Format number as currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'KES')
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currency = 'KES') {
  const num = parseFloat(amount);
  if (isNaN(num)) {
    return currency + ' 0.00';
  }
  return currency + ' ' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'iso')
 * @returns {string} Formatted date string
 */
function formatDate(date, format = 'short') {
  const d = new Date(date);
  if (isNaN(d)) {
    return 'Invalid Date';
  }
  
  if (format === 'iso') {
    return d.toISOString().split('T')[0];
  }
  
  if (format === 'long') {
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Default short format
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format percentage with symbol
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
function formatPercentage(value, decimals = 1) {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return '0%';
  }
  return num.toFixed(decimals) + '%';
}

/**
 * Format rating with color coding
 * @param {number} rating - Rating value (1-5)
 * @returns {string} HTML string with colored rating
 */
function formatRating(rating) {
  const num = parseFloat(rating);
  if (isNaN(num)) {
    return '<span style="color: #999;">N/A</span>';
  }
  
  let color = '#999';
  if (num >= 4.5) {
    color = '#10b981'; // Green
  } else if (num >= 3.5) {
    color = '#3b82f6'; // Blue
  } else if (num >= 2.5) {
    color = '#f59e0b'; // Orange
  } else {
    color = '#ef4444'; // Red
  }
  
  return `<span style="color: ${color}; font-weight: bold;">${num.toFixed(1)}</span>`;
}

/**
 * Truncate text to maximum length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
function formatFileSize(bytes) {
  const num = parseFloat(bytes);
  if (isNaN(num) || num === 0) {
    return '0 Bytes';
  }
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  
  return parseFloat((num / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format time duration in human-readable format
 * @param {number} milliseconds - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (typeof text !== 'string') {
    return '';
  }
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Format phone number (basic formatting)
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
function formatPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return '';
  }
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX for 10 digits
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
}

// Make formatting functions available globally
if (typeof window !== 'undefined') {
  window.formatCurrency = formatCurrency;
  window.formatDate = formatDate;
  window.formatPercentage = formatPercentage;
  window.formatRating = formatRating;
  window.truncateText = truncateText;
  window.formatFileSize = formatFileSize;
  window.formatDuration = formatDuration;
  window.escapeHtml = escapeHtml;
  window.formatPhoneNumber = formatPhoneNumber;
}
