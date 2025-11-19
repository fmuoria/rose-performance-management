# Testing Guide - ROSE Performance Management System

## Automated Tests Completed ✅

### Syntax Validation
- ✅ **sw.js**: JavaScript syntax valid
- ✅ **script.js**: JavaScript syntax valid
- ✅ **manifest.json**: JSON format valid
- ✅ **vercel.json**: JSON format valid
- ✅ **netlify.toml**: TOML format valid

### File Serving
- ✅ **index.html**: Serves correctly (HTTP 200)
- ✅ **sw.js**: Serves correctly (HTTP 200)
- ✅ **script.js**: Serves correctly (HTTP 200)
- ✅ **style.css**: Serves correctly (HTTP 200)

---

## Manual Testing Checklist

### 1. Service Worker (Offline Functionality)

#### Test Steps:
1. **Open the application in a modern browser** (Chrome, Firefox, Edge)
   - Navigate to your deployed URL
   
2. **Verify Service Worker Registration**
   - Open DevTools (F12)
   - Go to **Application** tab → **Service Workers**
   - Should see: `sw.js` with status "activated and running"
   - Screenshot showing service worker active

3. **Test Offline Mode**
   - Load the application while online
   - Open DevTools → **Network** tab
   - Check "Offline" checkbox
   - Refresh the page (F5)
   - ✅ Application should still load
   - ✅ UI should be visible and functional
   - Screenshot of working offline mode

4. **Test Cache**
   - DevTools → **Application** → **Cache Storage**
   - Should see cache: `rose-pms-v1`
   - Expand to see cached files:
     - index.html
     - style.css
     - script.js

#### Expected Results:
- Service worker registers on first visit
- Application works offline after initial load
- All static assets cached correctly
- Graceful handling of API calls when offline

---

### 2. Session Persistence

#### Test Steps:
1. **Sign In**
   - Click Google Sign In
   - Complete authentication
   - Verify you're signed in (see your name/profile)

2. **Check localStorage**
   - Open DevTools → **Application** → **Local Storage**
   - Should see keys:
     - `rose_pms_session`
     - `rose_pms_session_expiry`
   - Click to view stored data (should have profile and role)

3. **Test Refresh**
   - Press F5 to refresh
   - ✅ Should remain signed in
   - ✅ No need to re-authenticate
   - ✅ All tabs and data still accessible

4. **Test Browser Close/Reopen**
   - Close browser completely
   - Reopen browser
   - Navigate to application
   - ✅ Should auto-sign in
   - ✅ Session restored automatically

5. **Test Sign Out**
   - Click "Sign Out" button
   - Verify localStorage cleared:
     - DevTools → Application → Local Storage
     - `rose_pms_session` keys should be deleted
   - ✅ Signed out completely
   - ✅ Must sign in again to access

6. **Test Session Expiry**
   - Sign in normally
   - Manually edit expiry in localStorage:
     - DevTools → Application → Local Storage
     - Set `rose_pms_session_expiry` to old timestamp (e.g., 1000000)
   - Refresh page
   - ✅ Should be signed out (expired session)

#### Expected Results:
- Session persists across refreshes
- Session persists across browser restarts
- Session clears on sign-out
- Session expires after 7 days
- No re-authentication needed within validity period

---

### 3. Real-Time Updates

#### Test Steps:

**Note**: These tests require the backend to support the polling endpoints:
- `getTargetsUpdateTime`
- `getPendingFeedbackCount`

1. **Verify Polling Started**
   - Sign in
   - Open browser console (F12 → Console)
   - Should see: "Real-time updates enabled (polling every 30 seconds)"

2. **Test Notification Permission**
   - On first sign-in after new deployment
   - Should see popup: "Enable notifications to stay updated..."
   - Click "Yes" to grant permission
   - ✅ Browser should request notification permission

3. **Test Target Updates** (Employee Role):
   - Have a manager set/update your targets
   - Wait up to 30 seconds
   - ✅ Should see notification: "Your manager has updated your targets!"
   - Click notification
   - ✅ Should navigate to targets view

4. **Test Peer Feedback Badge**
   - Have a manager assign you peer feedback
   - Wait up to 30 seconds
   - ✅ Red badge should appear on "Peer Feedback" tab
   - Badge should show count of pending requests

5. **Test In-App Notifications**
   - If browser notifications denied/unavailable
   - Should see banner in top-right corner
   - Banner auto-dismisses after 10 seconds
   - Can click to dismiss or navigate

#### Expected Results:
- Polling starts automatically on sign-in
- Notifications appear for new updates
- Badge updates automatically
- Both browser and in-app notifications work
- Minimal network traffic (only checking for updates)

---

### 4. Performance Optimizations

#### Test Steps:

1. **Run Lighthouse Audit**
   - Open DevTools (F12)
   - Go to **Lighthouse** tab
   - Select "Performance" category
   - Click "Analyze page load"
   - ✅ Score should be 90+

2. **Check Cache Headers**
   ```bash
   curl -I https://your-domain.com/style.css
   ```
   - Should see: `Cache-Control: public, max-age=31536000, immutable`

3. **Check Compression**
   ```bash
   curl -I -H "Accept-Encoding: gzip" https://your-domain.com/script.js
   ```
   - Should see: `Content-Encoding: gzip` or `br` (brotli)

4. **Test Lazy Loading**
   - Inspect profile image element
   - Should have: `loading="lazy"` attribute
   - Images load only when scrolling into view

5. **Run WebPageTest**
   - Visit: https://www.webpagetest.org/
   - Enter your URL
   - Run test
   - Check results:
     - First Contentful Paint < 1.5s
     - Largest Contentful Paint < 2.5s
     - Total Blocking Time < 200ms

#### Expected Results:
- Lighthouse Performance: 90+
- Static assets cached for 1 year
- Text files compressed (70-90% reduction)
- Images lazy-load properly
- Fast load times across all metrics

---

### 5. Hosting Configuration

#### GitHub Pages:
1. **Check Deployment**
   - Go to repository → Actions tab
   - Verify "Deploy to GitHub Pages" workflow ran
   - Should show green checkmark
   
2. **Access Site**
   - Visit: `https://[username].github.io/[repo-name]/`
   - ✅ Site should load correctly
   - ✅ All features should work

#### Netlify:
1. **Check Build**
   - Go to Netlify dashboard
   - Check "Production deploys"
   - Should show "Published"
   
2. **Verify Headers**
   - Check browser DevTools → Network
   - Click any resource
   - Verify security headers present

#### Vercel:
1. **Check Deployment**
   - Go to Vercel dashboard
   - Check deployment status
   - Should show "Ready"
   
2. **Test Edge Functions**
   - Visit your domain
   - Check for fast response times globally

---

### 6. Progressive Web App (PWA)

#### Test Steps:

1. **Desktop Installation**
   - Visit site in Chrome/Edge
   - Look for install icon in address bar (➕ or ⬇️)
   - Click to install
   - ✅ App should install
   - ✅ Opens in standalone window
   - ✅ Has app icon

2. **Mobile Installation** (Android/iOS):
   - Visit site in mobile browser
   - Tap browser menu (⋮)
   - Select "Add to Home Screen"
   - ✅ Icon added to home screen
   - ✅ Opens in standalone mode
   - ✅ Looks like native app

3. **Verify Manifest**
   - DevTools → Application → Manifest
   - Check all fields populated:
     - Name
     - Short name
     - Theme color
     - Icons
     - Start URL

4. **Test Offline Functionality**
   - Install app
   - Enable airplane mode
   - Open app
   - ✅ Should work offline
   - ✅ Shows cached content

#### Expected Results:
- App can be installed on desktop and mobile
- Runs in standalone mode (no browser UI)
- Works offline after installation
- Updates automatically in background

---

### 7. Cross-Browser Testing

Test in multiple browsers:

#### Chrome/Edge (Chromium):
- ✅ Service Workers
- ✅ PWA Installation
- ✅ Notifications
- ✅ localStorage
- ✅ All features

#### Firefox:
- ✅ Service Workers
- ⚠️ PWA Installation (limited)
- ✅ Notifications
- ✅ localStorage
- ✅ All features

#### Safari:
- ✅ Service Workers (iOS 11.3+)
- ⚠️ PWA Installation (limited)
- ✅ Notifications (macOS only)
- ✅ localStorage
- ✅ All features

---

### 8. Security Testing

#### Test Steps:

1. **Check HTTPS**
   - Verify site loads with `https://`
   - No mixed content warnings
   - Valid SSL certificate

2. **Verify Security Headers**
   ```bash
   curl -I https://your-domain.com/
   ```
   - Should see:
     - `X-Frame-Options: SAMEORIGIN`
     - `X-Content-Type-Options: nosniff`
     - `X-XSS-Protection: 1; mode=block`
     - `Content-Security-Policy: ...`

3. **Test XSS Protection**
   - Try injecting script in form fields
   - Should be sanitized/blocked

4. **Verify Session Security**
   - No tokens stored in localStorage
   - Session expires after 7 days
   - Sign-out clears all data

---

## Known Issues and Limitations

### Real-Time Updates
- ⚠️ Requires backend support for polling endpoints
- ⚠️ 30-second delay between updates (not instant)
- ⚠️ Updates stop if page closed

### Offline Mode
- ⚠️ Read-only when offline
- ⚠️ Cannot save new data without connection
- ⚠️ API calls fail gracefully

### PWA Installation
- ⚠️ Limited on iOS Safari
- ⚠️ Requires HTTPS (not localhost without cert)
- ⚠️ Icon files need to be added

### Session Persistence
- ⚠️ Browser-specific (doesn't sync across devices)
- ⚠️ Cleared if user clears browser data
- ⚠️ 7-day expiration for security

---

## Reporting Issues

If you find bugs:

1. **Collect Information**:
   - Browser and version
   - Operating system
   - Steps to reproduce
   - Console errors (F12 → Console)
   - Network errors (F12 → Network)

2. **Screenshot**:
   - Capture error messages
   - Capture DevTools output

3. **Report**:
   - Open GitHub issue
   - Include all collected information
   - Tag with appropriate labels

---

## Test Results Template

```markdown
## Test Results

**Date**: YYYY-MM-DD
**Tester**: Your Name
**Browser**: Chrome 120 / Firefox 121 / Safari 17
**Platform**: Windows 11 / macOS 14 / Android 13

### Service Worker
- [ ] Registers correctly
- [ ] Works offline
- [ ] Caches assets
- [ ] Updates properly

### Session Persistence
- [ ] Persists across refresh
- [ ] Persists across browser restart
- [ ] Clears on sign-out
- [ ] Expires after 7 days

### Real-Time Updates
- [ ] Polling starts
- [ ] Notifications appear
- [ ] Badge updates
- [ ] Click to navigate works

### Performance
- [ ] Lighthouse: XX/100
- [ ] FCP: X.Xs
- [ ] LCP: X.Xs
- [ ] TBT: XXms

### PWA
- [ ] Can install
- [ ] Works offline
- [ ] Looks native

### Notes
[Any additional observations or issues]
```

---

## Automated Testing (Future)

For continuous integration:

```javascript
// Example: Service Worker test
describe('Service Worker', () => {
  it('should register successfully', async () => {
    const registration = await navigator.serviceWorker.register('/sw.js');
    expect(registration.active).toBeTruthy();
  });
});

// Example: Session persistence test
describe('Session Persistence', () => {
  it('should save and load session', () => {
    const mockSession = { profile: {}, role: 'Employee' };
    saveSession(mockSession.profile, mockSession.role);
    const loaded = loadSession();
    expect(loaded).toEqual(expect.objectContaining(mockSession));
  });
});
```

---

**Last Updated**: October 2025
