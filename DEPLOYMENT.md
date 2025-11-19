# Deployment Guide

This document provides step-by-step instructions for deploying the optimized ROSE Performance Management System.

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [x] Completed all optimizations (CSS/JS extraction, SEO enhancements)
- [x] Validated HTML, CSS, and JavaScript syntax
- [x] Reviewed security analysis in CHANGELOG.md
- [x] Configured server settings (see PERFORMANCE.md)
- [x] Tested the application locally

## Deployment Options

### Option 1: GitHub Pages (Recommended for Static Hosting)

#### Steps:
1. Push all files to your GitHub repository
2. Go to repository Settings → Pages
3. Select branch (e.g., `main`) and root directory
4. Click Save
5. Your site will be available at `https://username.github.io/repository-name/`

#### Configuration:
```yaml
# .github/workflows/deploy.yml (optional - for custom build steps)
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

### Option 2: Netlify

#### Steps:
1. Sign up at https://www.netlify.com/
2. Click "New site from Git"
3. Connect your GitHub repository
4. Configure build settings:
   - Build command: (leave empty)
   - Publish directory: `.` (root)
5. Click "Deploy site"

#### netlify.toml (optional):
```toml
[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    
[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "public, max-age=3600"
```

### Option 3: Vercel

#### Steps:
1. Sign up at https://vercel.com/
2. Import your GitHub repository
3. Configure project:
   - Framework Preset: Other
   - Root Directory: `./`
4. Click "Deploy"

#### vercel.json (optional):
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    },
    {
      "source": "/(.*).css",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*).js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Option 4: Traditional Web Server (Apache/Nginx)

#### Apache Configuration

Create `.htaccess` in your web root:

```apache
# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 1 hour"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-Content-Type-Options "nosniff"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Force HTTPS
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

#### Nginx Configuration

Add to your server block:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    root /var/www/rose-performance-management;
    index index.html;
    
    # SSL configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/css application/javascript application/json text/html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Cache static assets
    location ~* \.(css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location ~* \.(html)$ {
        expires 1h;
        add_header Cache-Control "public";
    }
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Post-Deployment Steps

### 1. Verify Deployment

Test these URLs (replace with your domain):
- `https://yourdomain.com/` - Main page loads
- `https://yourdomain.com/styles.css` - CSS file accessible
- `https://yourdomain.com/app.js` - JavaScript file accessible

### 2. Performance Testing

Run these tools to verify performance:

#### Google Lighthouse
```bash
lighthouse https://yourdomain.com --view
```

Expected scores:
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

#### WebPageTest
1. Visit https://www.webpagetest.org/
2. Enter your URL
3. Run test
4. Review results

Target metrics:
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.0s
- Cumulative Layout Shift: < 0.1

### 3. SEO Verification

#### Google Search Console
1. Add your site to Google Search Console
2. Submit sitemap (if applicable)
3. Request indexing

#### Schema.org Validation
1. Visit https://validator.schema.org/
2. Enter your URL
3. Verify structured data is valid

#### Open Graph Testing
1. Visit https://developers.facebook.com/tools/debug/
2. Enter your URL
3. Verify Open Graph tags

#### Twitter Card Validator
1. Visit https://cards-dev.twitter.com/validator
2. Enter your URL
3. Verify Twitter Card rendering

### 4. Security Verification

#### SSL/TLS
```bash
# Test SSL configuration
ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```

Target: A+ rating

#### Security Headers
```bash
# Test security headers
securityheaders.com/?q=yourdomain.com
```

Required headers:
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ X-XSS-Protection
- ✅ Referrer-Policy
- ✅ Content-Security-Policy (optional but recommended)

### 5. Accessibility Testing

#### WAVE Tool
1. Visit https://wave.webaim.org/
2. Enter your URL
3. Fix any errors

#### Screen Reader Testing
Test with:
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)

### 6. Cross-Browser Testing

Test on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Monitoring Setup

### Google Analytics

Add to `index.html` before `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Error Tracking (Sentry)

Add to `app.js` at the top:

```javascript
// Sentry error tracking
if (typeof Sentry !== 'undefined') {
  Sentry.init({
    dsn: 'YOUR_SENTRY_DSN',
    environment: 'production',
    beforeSend(event) {
      // Filter out non-critical errors
      if (event.level === 'info') return null;
      return event;
    }
  });
}
```

### Uptime Monitoring

Services to consider:
- **UptimeRobot** - Free monitoring, 5-minute checks
- **Pingdom** - Advanced monitoring with alerts
- **StatusCake** - Comprehensive uptime tracking

## Rollback Plan

If issues occur after deployment:

### GitHub Pages
```bash
git revert HEAD
git push origin main
```

### Netlify/Vercel
Use the web dashboard to rollback to previous deployment.

### Traditional Server
```bash
# Restore from backup
cp -r /backup/rose-performance-management/* /var/www/rose-performance-management/
```

## Maintenance

### Regular Tasks

#### Weekly
- Check error logs
- Monitor performance metrics
- Review user feedback

#### Monthly
- Update dependencies (if any)
- Review security advisories
- Test on latest browsers
- Check broken links

#### Quarterly
- Performance audit
- Accessibility review
- SEO audit
- Security scan

## Troubleshooting

### Common Issues

#### CSS/JS Not Loading
**Problem**: Styles or scripts not applied  
**Solution**: 
1. Check browser console for 404 errors
2. Verify file paths are correct
3. Clear browser cache
4. Check server configuration

#### Performance Issues
**Problem**: Slow page load  
**Solution**:
1. Enable compression (Gzip/Brotli)
2. Set proper cache headers
3. Enable CDN
4. Optimize images

#### Authentication Problems
**Problem**: Google Sign-In not working  
**Solution**:
1. Verify HTTPS is enabled
2. Check Google Cloud Console settings
3. Verify authorized domains
4. Check browser console for errors
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

### 2. Test Functionality

Verify the following features work:

- ✅ Google Sign-In
- ✅ Session persistence after refresh
- ✅ Offline functionality (disconnect internet and reload)
- ✅ Real-time notifications (if backend supports polling endpoints)
- ✅ All tabs and features accessible

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
1. Check GitHub repository issues
2. Review CHANGELOG.md for known issues
3. Consult PERFORMANCE.md for server configuration
4. Contact repository maintainers

## Additional Resources

- [Web.dev Performance Guide](https://web.dev/performance/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Google Search Console Help](https://support.google.com/webmasters/)
- [Schema.org Documentation](https://schema.org/)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated**: October 30, 2025  
**Version**: 1.1.0

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
