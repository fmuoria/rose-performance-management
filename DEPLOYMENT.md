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
