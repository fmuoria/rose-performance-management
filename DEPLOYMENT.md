# Deployment Guide - ROSE Performance Management System

This guide covers deploying the ROSE Performance Management System to various free hosting platforms.

## Table of Contents

1. [GitHub Pages](#github-pages)
2. [Netlify](#netlify)
3. [Vercel](#vercel)
4. [Prerequisites](#prerequisites)
5. [Post-Deployment Configuration](#post-deployment-configuration)

---

## Prerequisites

Before deploying, ensure you have:

- A GitHub account with this repository
- Git installed locally (for manual deployments)
- Your Google OAuth Client ID configured for the production domain

---

## GitHub Pages

### Automatic Deployment (Recommended)

The repository includes a GitHub Actions workflow for automatic deployment.

#### Setup Steps:

1. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under "Build and deployment":
     - Source: Select **GitHub Actions**

2. **Push to Main Branch**:
   ```bash
   git push origin main
   ```
   
3. **Monitor Deployment**:
   - Go to **Actions** tab in your repository
   - Watch the "Deploy to GitHub Pages" workflow
   - Once complete, your site will be live at: `https://[username].github.io/[repository-name]/`

#### Custom Domain (Optional):

1. In **Settings** → **Pages**:
   - Add your custom domain
   - Enable "Enforce HTTPS"

2. Configure DNS with your domain provider:
   ```
   Type: CNAME
   Name: www (or @ for apex domain)
   Value: [username].github.io
   ```

3. Wait for DNS propagation (can take up to 24 hours)

### Manual Deployment

If you prefer manual deployment:

```bash
# Install GitHub Pages CLI (optional)
npm install -g gh-pages

# Deploy
gh-pages -d .
```

---

## Netlify

### Option 1: Connect GitHub Repository (Recommended)

1. **Sign Up/Login** to [Netlify](https://netlify.com)

2. **New Site from Git**:
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub"
   - Authorize Netlify to access your repositories
   - Select your repository

3. **Build Settings**:
   - **Branch to deploy**: `main`
   - **Build command**: Leave empty (static site)
   - **Publish directory**: `.` (root)

4. **Deploy Site**:
   - Click "Deploy site"
   - Netlify will assign a random subdomain like `random-name.netlify.app`

5. **Custom Domain** (Optional):
   - Go to **Site settings** → **Domain management**
   - Click "Add custom domain"
   - Follow DNS configuration instructions

### Option 2: Drag and Drop

1. Go to [Netlify Drop](https://app.netlify.com/drop)
2. Drag and drop your project folder
3. Site will be deployed instantly

### Option 3: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### Configuration

The repository includes `netlify.toml` with:
- ✅ Automatic compression (Gzip/Brotli)
- ✅ Security headers
- ✅ Cache control
- ✅ SPA routing support

---

## Vercel

### Option 1: Connect GitHub Repository (Recommended)

1. **Sign Up/Login** to [Vercel](https://vercel.com)

2. **Import Project**:
   - Click "Add New" → "Project"
   - Import from GitHub
   - Select your repository

3. **Configure Project**:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty

4. **Deploy**:
   - Click "Deploy"
   - Vercel will assign a domain like `project-name.vercel.app`

5. **Custom Domain** (Optional):
   - Go to project **Settings** → **Domains**
   - Add your custom domain
   - Configure DNS as instructed

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Configuration

The repository includes `vercel.json` with:
- ✅ Static file serving
- ✅ Security headers
- ✅ Cache control
- ✅ SPA routing support

---

## Post-Deployment Configuration

### 1. Update Google OAuth

After deployment, you must update your Google OAuth configuration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add your production domain to:
   - **Authorized JavaScript origins**: `https://your-domain.com`
   - **Authorized redirect URIs**: `https://your-domain.com`

### 2. Configure Apps Script Backend

Ensure your Apps Script deployment is properly configured to support the new workflows:

#### Required Apps Script Endpoints

The system now requires the following endpoints to support target management and quarterly reviews:

**Target Management:**
- `action=saveTargets` - Save targets (now supports `isYearlyDistribution` flag)
- `action=getTargets` - Retrieve targets for specific employee/year/quarter
- `action=getTargetsUpdateTime` - Get last update timestamp for real-time notifications

**Enhanced Scorecard Management:**
- `action=saveScorecard` - Now includes `progressFrequency` and `quarter` fields
- `action=getEmployeeScores` - Supports filtering by year and quarter

#### Google Sheets Structure

Ensure your Google Sheets has the following structure:

**Targets Sheet:**
- Columns: Manager Email, Employee Email, Year, Quarter, Dimension, Measure, Target Value, Weight, Frequency, Timestamp, Is Yearly Distribution

**Sheet1 (Progress Data):**
- Must include new columns: `Progress Frequency`, `Quarter`
- These fields are automatically populated during scorecard submission

#### Apps Script Configuration

Add the following to your Apps Script to support the new workflows:

```javascript
function doGet(e) {
  const action = e.parameter.action;
  
  // Existing actions...
  
  if (action === 'saveTargets') {
    return saveTargetsToSheet(e.parameter);
  }
  if (action === 'getTargets') {
    return getTargetsFromSheet(e.parameter);
  }
  if (action === 'getEmployeeScores') {
    return getEmployeeScoresFromSheet(e.parameter);
  }
  
  // ... other actions
}

function saveTargetsToSheet(params) {
  // Reconstruct JSON from chunks
  let jsonData = '';
  let i = 0;
  while (params['chunk' + i]) {
    jsonData += params['chunk' + i];
    i++;
  }
  
  const data = JSON.parse(jsonData);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Targets');
  
  // Save each target with metadata
  data.targets.forEach(target => {
    sheet.appendRow([
      data.managerEmail,
      data.employeeEmail,
      data.year,
      data.quarter,
      target.dimension,
      target.measure,
      target.targetValue,
      target.weight,
      target.frequency,
      new Date(),
      data.isYearlyDistribution || false
    ]);
  });
  
  return ContentService.createTextOutput(
    JSON.stringify({result: 'success'})
  ).setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function getEmployeeScoresFromSheet(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Filter by employee, year, and quarter if provided
  const filtered = data.slice(1).filter(row => {
    const emailMatch = !params.employeeEmail || row[headers.indexOf('User Email')] === params.employeeEmail;
    const yearMatch = !params.year || row[headers.indexOf('Year')] == params.year;
    const quarterMatch = !params.quarter || row[headers.indexOf('Quarter')] === params.quarter;
    return emailMatch && yearMatch && quarterMatch;
  });
  
  return ContentService.createTextOutput(
    JSON.stringify(filtered.map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    }))
  ).setMimeType(ContentService.MimeType.JAVASCRIPT);
}
```

### 3. Test Functionality

Verify the following features work:

**Authentication & Session:**
- ✅ Google Sign-In
- ✅ Session persistence after refresh
- ✅ Offline functionality (disconnect internet and reload)
- ✅ Real-time notifications (if backend supports polling endpoints)
- ✅ All tabs and features accessible

**New Target Management Features:**
- ✅ Manager can set quarterly targets
- ✅ Manager can set yearly targets (auto-distributes to 4 quarters)
- ✅ Weight validation works correctly (must total 100%)
- ✅ Targets sync to Google Sheets Targets sheet
- ✅ Employees see targets loaded in scorecard form

**New Progress Entry Features:**
- ✅ Frequency selector works (weekly/monthly/quarterly)
- ✅ Week field disables for monthly/quarterly entries
- ✅ Progress saves with frequency metadata
- ✅ Data syncs to Sheet1 with quarter field

**New Quarterly Review Features:**
- ✅ Quarterly Review tab appears for managers
- ✅ Employee selection and quarter filtering work
- ✅ Data aggregates correctly by quarter
- ✅ Summary statistics calculate properly
- ✅ Export and detailed history buttons work

### 3. Enable Service Worker

The service worker is automatically registered on page load. Verify it's working:

1. Open browser DevTools (F12)
2. Go to **Application** tab → **Service Workers**
3. You should see `sw.js` registered and active

### 4. Test PWA Installation

On mobile or desktop Chrome:

1. Look for the "Install" button in the address bar
2. Click to install as an app
3. The app should work offline after installation

---

## Performance Optimization

### Check Your Score

Test your deployed site with:

- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [GTmetrix](https://gtmetrix.com/)
- [WebPageTest](https://www.webpagetest.org/)

### Expected Metrics

With proper configuration:

- ⚡ **Lighthouse Performance**: 90+
- ⚡ **First Contentful Paint**: < 1.5s
- ⚡ **Largest Contentful Paint**: < 2.5s
- ⚡ **Time to Interactive**: < 3.0s
- ⚡ **Cumulative Layout Shift**: < 0.1

### Further Optimization

If you need better performance:

1. **Enable CDN** (built-in on Netlify/Vercel)
2. **Optimize images** (add WebP versions)
3. **Implement critical CSS** (inline above-fold styles)
4. **Add resource hints** (preconnect, prefetch)

---

## Troubleshooting

### Service Worker Not Updating

If changes aren't appearing:

1. Open DevTools → Application → Service Workers
2. Check "Update on reload"
3. Click "Unregister" then reload

### Google Sign-In Not Working

1. Verify domain is added to Google OAuth settings
2. Check browser console for errors
3. Ensure you're accessing via HTTPS (not HTTP)

### 404 Errors on Refresh

If you get 404s when refreshing on sub-routes:

- **GitHub Pages**: May require additional configuration
- **Netlify**: Should work with included `netlify.toml`
- **Vercel**: Should work with included `vercel.json`

### Cache Issues

If old files are being served:

1. **Clear Service Worker cache**: DevTools → Application → Clear storage
2. **Hard refresh**: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
3. **Update cache version**: Edit `CACHE_VERSION` in `sw.js`

---

## Monitoring

### Set Up Monitoring (Optional)

- **Uptime**: [UptimeRobot](https://uptimerobot.com/) (free)
- **Analytics**: [Google Analytics](https://analytics.google.com/)
- **Error Tracking**: [Sentry](https://sentry.io/) (free tier available)
- **Performance**: [New Relic](https://newrelic.com/) or [Datadog](https://www.datadoghq.com/)

---

## Support

For deployment issues:

1. Check the platform's status page
2. Review platform-specific documentation
3. Check repository issues on GitHub
4. Contact platform support

---

## Platform Comparison

| Feature | GitHub Pages | Netlify | Vercel |
|---------|-------------|---------|---------|
| **Free Tier** | ✅ Unlimited | ✅ 100GB/month | ✅ 100GB/month |
| **Custom Domain** | ✅ Free | ✅ Free | ✅ Free |
| **HTTPS** | ✅ Automatic | ✅ Automatic | ✅ Automatic |
| **CDN** | ✅ Global | ✅ Global | ✅ Global |
| **Build Time** | ~2-5 min | ~1-2 min | ~1-2 min |
| **Auto-deploy** | ✅ GitHub Actions | ✅ Git push | ✅ Git push |
| **Headers Config** | ❌ Limited | ✅ netlify.toml | ✅ vercel.json |
| **Edge Functions** | ❌ No | ✅ Yes | ✅ Yes |
| **Best For** | Simple hosting | Full features | Full features |

---

## Next Steps

After successful deployment:

1. ✅ Test all features thoroughly
2. ✅ Set up monitoring
3. ✅ Configure custom domain (optional)
4. ✅ Add to Google Search Console (optional)
5. ✅ Share with your team!

---

## Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Netlify Documentation](https://docs.netlify.com/)
- [Vercel Documentation](https://vercel.com/docs)
- [Service Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Progressive Web Apps](https://web.dev/progressive-web-apps/)
