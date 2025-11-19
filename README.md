# ROSE Performance Management System

A comprehensive performance management system for tracking quarterly scorecards, setting targets, and managing team performance with peer feedback integration.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [User Roles](#user-roles)
- [Workflows](#workflows)
  - [Manager Workflow](#manager-workflow)
  - [Employee Workflow](#employee-workflow)
- [Google Sheets Integration](#google-sheets-integration)
- [Apps Script Endpoints](#apps-script-endpoints)
- [Getting Started](#getting-started)
- [Deployment](#deployment)

## 🌟 Overview

The ROSE Performance Management System is a web-based application that integrates with Google Sheets via Apps Script to provide a complete performance management solution. It supports:

- **Quarterly Performance Tracking**: Track performance metrics across Financial, Customer, Internal Process, and Learning & Growth dimensions
- **Flexible Progress Entry**: Employees can enter progress weekly, monthly, or quarterly
- **Automated Target Distribution**: Managers can set yearly targets that are automatically divided quarterly
- **Peer Feedback System**: Anonymous peer reviews based on 7 core values
- **Quarterly Reviews**: Aggregated performance reviews with historical comparison
- **Real-time Updates**: Automatic notifications for target changes and feedback requests
- **Offline Support**: Service worker enables offline functionality

## ✨ Features

### For All Users
- **Performance Scorecard**: Enter weekly/monthly/quarterly performance data
- **Dashboard**: View personal performance trends and statistics
- **Reports**: Access historical submission records
- **Peer Feedback**: Provide anonymous feedback on colleagues
- **Recognition**: View employee of the month/quarter/year awards
- **Offline Mode**: Continue working without internet connection

### For Managers/Admins
- **Target Setting**: Set yearly or quarterly targets with automatic distribution
- **Quarterly Reviews**: Review aggregated employee performance by quarter
- **Team Management**: View and manage team members
- **Peer Feedback Requests**: Request anonymous peer feedback for team members
- **AI Insights**: Generate AI-powered performance reviews and suggestions
- **Team Reports**: View detailed reports for each team member
- **Team Dashboard**: Monitor team performance metrics

## 👥 User Roles

### Employee
- Submit performance scorecards (weekly/monthly/quarterly)
- View personal reports and dashboard
- Provide peer feedback
- View recognition awards

### Manager
- All employee capabilities, plus:
- Set targets for team members
- Review quarterly performance
- Request peer feedback
- View team reports and dashboards
- Access AI insights

### Admin
- All manager capabilities, plus:
- Full system access
- Calculate recognition awards

## 📊 Workflows

### Manager Workflow: Setting Yearly Targets

1. **Navigate to "Set Targets" Tab**
   - Select a team member from the dropdown
   - Choose the target year

2. **Select Target Entry Mode**
   - **Quarterly Mode**: Set targets for a specific quarter (Q1-Q4)
   - **Yearly Mode**: Set yearly targets that auto-divide by 4 for each quarter

3. **Add Performance Targets**
   - Click "+ Add Target" to add rows
   - Select dimension (Financial, Customer, Internal Process, Learning & Growth)
   - Enter measure description (e.g., "Budget Savings", "Customer Satisfaction")
   - Enter target value:
     - In **Quarterly Mode**: Enter the quarterly target
     - In **Yearly Mode**: Enter the yearly target (automatically divided by 4)
   - Set weight percentage (must total 100% including Internal Customer at 25%)
   - Select tracking frequency (Weekly, Monthly, or Quarterly)

4. **Validate and Save**
   - Click "🔍 Check Weights" to validate weight allocation
   - Ensure total equals 100% (25% Internal Customer + 75% custom targets)
   - Click "💾 Save All Targets" to sync to Google Sheets
   - In **Yearly Mode**, targets are automatically saved to all 4 quarters

5. **Weight Allocation Rules**
   - **Internal Customer**: 25% (automatic, from peer feedback)
   - **External Customer**: Maximum 5%
   - **Financial**: Maximum 15%
   - **Internal Process**: Maximum 50%
   - **Learning & Growth**: Maximum 10%
   - **Total**: Must equal 100%

### Employee Workflow: Entering Progress

1. **Navigate to "Scorecard" Tab**
   - Form auto-fills with your name, job title, division, and level

2. **Select Reporting Period**
   - Choose year and month
   - Select progress entry frequency:
     - **Weekly**: Select specific week (1-5) within the month
     - **Monthly**: Progress recorded for entire month
     - **Quarterly**: Progress recorded for entire quarter

3. **Enter Performance Data**
   - Table displays targets set by your manager
   - Enter actual performance values for each measure
   - Rating is automatically calculated based on actual vs. target
   - Add manager comments if applicable
   - Attach evidence links (Google Drive, etc.)

4. **Review and Submit**
   - Check the score summary at the bottom
   - Verify all required fields are filled
   - Click "Save" to submit to Google Sheets
   - Data syncs to Sheet1 with frequency metadata

5. **Flexible Entry Frequency**
   - **Weekly**: Best for detailed tracking, enter every week
   - **Monthly**: Aggregate monthly progress, enter once per month
   - **Quarterly**: Big picture review, enter once per quarter
   - System tracks frequency metadata for proper aggregation

### Manager Workflow: Quarterly Reviews

1. **Navigate to "📊 Quarterly Review" Tab**

2. **Select Review Parameters**
   - Choose team member from dropdown
   - Select year (2024, 2025, 2026)
   - Select quarter (Q1, Q2, Q3, Q4)

3. **View Aggregated Performance**
   - **Summary Statistics**: Total entries, frequency breakdown
   - **Performance by Dimension**: Average ratings, total actuals, weighted scores
   - **Total Weighted Score**: Overall quarterly performance score

4. **Actions Available**
   - **📄 Export to PDF**: Print or save review as PDF
   - **📜 View Detailed History**: Switch to detailed submission history

5. **Data Aggregation Logic**
   - System aggregates all entries (weekly/monthly/quarterly) for the selected quarter
   - Calculates average ratings across all entries
   - Sums total actuals for cumulative measures
   - Displays entry count per frequency type
   - Computes weighted score based on target weights

## 🔗 Google Sheets Integration

### Sheet Structure

The system integrates with Google Sheets using the following structure:

#### 1. **Targets Sheet**
Stores performance targets set by managers.

**Columns:**
- `Manager Email`: Email of the manager who set the target
- `Employee Email`: Email of the employee
- `Year`: Target year (e.g., 2025)
- `Quarter`: Quarter (Q1, Q2, Q3, Q4)
- `Dimension`: Performance dimension
- `Measure`: Specific performance measure
- `Target Value`: Numerical target value (quarterly)
- `Weight`: Percentage weight (must total 100%)
- `Frequency`: Tracking frequency (Weekly, Monthly, Quarterly)
- `Timestamp`: When target was set
- `Is Yearly Distribution`: Flag indicating if auto-divided from yearly

#### 2. **Sheet1 (Progress Data)**
Stores employee performance submissions.

**Columns:**
- `Timestamp`: Submission date/time
- `User Email`: Employee email
- `Name`: Employee name
- `Job`: Job title
- `Division`: Division name
- `Level`: Employee level
- `Year`: Submission year
- `Month`: Submission month (01-12)
- `Week`: Week number (1-5)
- `Progress Frequency`: Entry frequency (weekly, monthly, quarterly)
- `Quarter`: Computed quarter (Q1-Q4)
- `Scores`: JSON array of performance scores
- Additional columns for individual scores...

#### 3. **Peer Feedback Sheets**
- `Peer Feedback Requests`: Feedback request records
- `Peer Feedback Responses`: Anonymous feedback submissions

## 🔌 Apps Script Endpoints

The system requires the following Apps Script endpoints:

### Required Endpoints

#### Target Management
- `action=saveTargets` - Save targets to Targets sheet
  - Parameters: `employeeEmail`, `year`, `quarter`, `targets` (JSON array), `isYearlyDistribution`
  - Returns: `{result: 'success'}` or error message

- `action=getTargets` - Retrieve targets for employee
  - Parameters: `email`, `year`, `quarter`
  - Returns: Array of target objects

- `action=getTargetsUpdateTime` - Get last update timestamp
  - Parameters: `email`, `year`, `quarter`
  - Returns: `{updateTime: ISO date string}`

#### Scorecard Management
- `action=saveScorecard` - Save scorecard to Sheet1
  - Expects: All scorecard data including `progressFrequency` and `quarter`
  - Returns: `{result: 'success'}`

- `action=getEmployeeScores` - Retrieve employee submissions
  - Parameters: `employeeEmail`, optional: `year`, `quarter`
  - Returns: Array of scorecard records

- `action=getWeeklyHistory` - Get historical weekly entries
  - Parameters: `email`, `year`, `month`
  - Returns: Array of previous submissions

#### User Management
- `action=getUserRole` - Get user role
  - Parameters: `email`
  - Returns: `{role: 'Admin'|'Manager'|'Employee'}`

- `action=lookupUser` - Get user details
  - Parameters: `email`
  - Returns: User profile data

- `action=getTeamMembers` - Get team members for manager
  - Parameters: `email`
  - Returns: Array of team member objects

#### Peer Feedback
- `action=getPendingFeedback` - Get pending feedback requests
  - Parameters: `email`
  - Returns: Array of feedback request objects

- `action=submitPeerFeedback` - Submit peer feedback
  - Expects: Feedback data with ratings
  - Returns: `{result: 'success'}`

- `action=getAggregatedPeerFeedback` - Get aggregated feedback
  - Parameters: `employeeEmail`, `year`, `quarter`
  - Returns: `{averageScore, count}`

### Data Flow

1. **Manager Sets Targets**:
   ```
   Frontend → Apps Script (saveTargets) → Google Sheets (Targets)
   ```

2. **Employee Submits Progress**:
   ```
   Frontend → Apps Script (saveScorecard) → Google Sheets (Sheet1)
   ```

3. **Manager Reviews Quarterly**:
   ```
   Frontend → Apps Script (getEmployeeScores) → Google Sheets (Sheet1) → Aggregate → Display
   ```

## 🚀 Getting Started

### Prerequisites

1. **Google Account**: Required for authentication
2. **Apps Script Deployment**: Backend scripts must be deployed
3. **Google Sheets**: Properly structured sheets with correct permissions

### Configuration

1. **Update Apps Script URL**:
   ```javascript
   // In script.js, line ~173
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";
   ```

2. **Update Google Client ID**:
   ```javascript
   // In script.js, line ~174
   const GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID.apps.googleusercontent.com";
   ```

3. **Configure OAuth**:
   - Add authorized JavaScript origins
   - Add authorized redirect URIs
   - Enable Google Sign-In API

### Local Development

1. Clone the repository
2. Open `index.html` in a web browser
3. Sign in with your Google account
4. Ensure Apps Script backend is accessible

### Testing

- Test target setting in both quarterly and yearly modes
- Verify target auto-distribution for yearly mode
- Test progress entry with different frequencies
- Verify quarterly review aggregation
- Test all user roles (Employee, Manager, Admin)

## 📦 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions to:
- GitHub Pages
- Netlify
- Vercel

### Quick Deploy

**GitHub Pages:**
```bash
git push origin main
# Automatic deployment via GitHub Actions
```

**Netlify:**
```bash
netlify deploy --prod
```

**Vercel:**
```bash
vercel --prod
```

## 📖 Additional Documentation

- [FEATURES.md](FEATURES.md) - Detailed feature descriptions
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guides for different platforms
- [TESTING.md](TESTING.md) - Testing procedures and checklists
- [SUMMARY.md](SUMMARY.md) - Implementation summary and architecture

## 🔒 Security

- HTTPS required for production
- Google OAuth for authentication
- Anonymous peer feedback with privacy protections
- No sensitive data stored in localStorage
- Content Security Policy headers configured
- Regular security audits recommended

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

Copyright © 2025 ROSE Organization. All rights reserved.

## 🆘 Support

For issues or questions:
1. Check existing documentation
2. Review GitHub issues
3. Contact system administrator

---

**Built with ❤️ by the ROSE Performance Management Team**

Last Updated: January 2025  
Version: 3.0.0
