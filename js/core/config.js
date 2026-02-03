/**
 * Core Configuration Module
 * Centralizes all application configuration constants
 * @module core/config
 */

/**
 * Application configuration object
 */
const CONFIG = {
  // Session management
  SESSION_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  SESSION_KEY: 'rose_pms_session',
  SESSION_EXPIRY_KEY: 'rose_pms_session_expiry',
  
  // Polling intervals
  POLLING_INTERVAL: 120000, // 2 minutes for real-time updates (changed from 30s)
  
  // Service Worker
  SERVICE_WORKER_PATH: '/sw.js',
  SERVICE_WORKER_UPDATE_INTERVAL: 60000, // Check for updates every minute
  
  // API Configuration
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzF9u325VOjHzVuZKU3xR8EMtKzq4jdIxVJqxzFSFOUnhgyvldSAaCTP-e-34krIaEu_Q/exec",
  GOOGLE_CLIENT_ID: "851703142133-3186bsmuthhrklaa1eaddqa9c0tkb46d.apps.googleusercontent.com",
  
  // Feature flags
  ENABLE_AI_ANALYTICS: true,
  ENABLE_REAL_TIME_UPDATES: true,
  LAZY_LOAD_CHARTS: true,
  
  // Validation constants
  MAX_TARGET_VALUE: 1000000,
  MIN_TARGET_VALUE: 0,
  MAX_STRING_LENGTH: 500,
  
  // UI Constants
  TOAST_DURATION: 3000, // milliseconds
  DEBOUNCE_DELAY: 300 // milliseconds for search/filter inputs
};

/**
 * Default scorecard dimensions configuration
 */
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

// Make configuration available globally
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
  window.SCORECARD_DIMENSIONS = SCORECARD_DIMENSIONS;
}
