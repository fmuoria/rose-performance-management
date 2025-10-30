# Performance Optimization Guide

This document provides server configuration recommendations to maximize the performance of the ROSE Performance Management website.

## Server Configuration

### 1. Browser Caching

Configure your web server to cache static resources for optimal performance.

#### Apache (.htaccess)

```apache
<IfModule mod_expires.c>
  ExpiresActive On
  
  # Cache HTML for 1 hour
  ExpiresByType text/html "access plus 1 hour"
  
  # Cache CSS and JavaScript for 1 year
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  
  # Cache images for 1 year
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Add Cache-Control headers
<IfModule mod_headers.c>
  <FilesMatch "\.(html)$">
    Header set Cache-Control "public, max-age=3600"
  </FilesMatch>
  
  <FilesMatch "\.(css|js|png|jpg|jpeg|webp|svg)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>
```

#### Nginx

```nginx
# Inside your server block
location / {
    # Cache HTML for 1 hour
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
    }
    
    # Cache static assets for 1 year
    location ~* \.(css|js|png|jpg|jpeg|webp|svg)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### 2. Compression (Gzip/Brotli)

Enable compression to reduce file sizes by 70-90%.

#### Apache

```apache
<IfModule mod_deflate.c>
  # Enable compression for text-based files
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
  AddOutputFilterByType DEFLATE application/javascript application/json
  AddOutputFilterByType DEFLATE application/xml application/rss+xml
  
  # Exclude files that are already compressed
  SetEnvIfNoCase Request_URI \.(?:gif|jpe?g|png|webp)$ no-gzip
</IfModule>
```

#### Nginx

```nginx
# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
gzip_types
    text/html
    text/css
    text/plain
    application/javascript
    application/json
    application/xml
    application/rss+xml
    image/svg+xml;

# Brotli compression (if available)
brotli on;
brotli_comp_level 6;
brotli_types
    text/html
    text/css
    text/plain
    application/javascript
    application/json
    application/xml
    application/rss+xml
    image/svg+xml;
```

### 3. Security Headers

Add security headers to protect against common vulnerabilities.

#### Apache

```apache
<IfModule mod_headers.c>
  # Prevent clickjacking
  Header always set X-Frame-Options "SAMEORIGIN"
  
  # Prevent MIME type sniffing
  Header always set X-Content-Type-Options "nosniff"
  
  # Enable XSS protection
  Header always set X-XSS-Protection "1; mode=block"
  
  # Referrer policy
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  
  # Content Security Policy (adjust as needed)
  Header always set Content-Security-Policy "default-src 'self' https://accounts.google.com https://script.google.com; script-src 'self' 'unsafe-inline' https://accounts.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:;"
</IfModule>
```

#### Nginx

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self' https://accounts.google.com https://script.google.com; script-src 'self' 'unsafe-inline' https://accounts.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:;" always;
```

## Performance Testing

### Recommended Tools

1. **Google Lighthouse** - Comprehensive performance audit
   ```bash
   lighthouse https://your-domain.com --view
   ```

2. **WebPageTest** - Detailed performance analysis
   - Visit: https://www.webpagetest.org/

3. **GTmetrix** - Performance monitoring
   - Visit: https://gtmetrix.com/

### Expected Metrics

With proper configuration, you should achieve:

- **Lighthouse Performance Score**: 90+
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.0s
- **Cumulative Layout Shift**: < 0.1
- **Total Blocking Time**: < 200ms

## CDN Configuration (Optional)

For global users, consider using a CDN:

### Cloudflare

1. Sign up at https://www.cloudflare.com/
2. Add your domain
3. Update nameservers
4. Enable:
   - Auto Minify (HTML, CSS, JS)
   - Brotli compression
   - HTTP/2
   - Rocket Loader (optional)

### AWS CloudFront

1. Create a CloudFront distribution
2. Set origin to your web server
3. Enable compression
4. Configure cache behaviors
5. Update DNS to point to CloudFront

## Monitoring

### Key Metrics to Monitor

- Page load time
- Time to First Byte (TTFB)
- Resource loading times
- Error rates
- User experience metrics (Core Web Vitals)

### Tools

- **Google Analytics** - User behavior
- **New Relic** - Application performance
- **Datadog** - Infrastructure monitoring
- **Sentry** - Error tracking

## Additional Optimizations

### Image Optimization

For future image additions, use modern formats:

```html
<picture>
  <source srcset="image.webp" type="image/webp">
  <source srcset="image.jpg" type="image/jpeg">
  <img src="image.jpg" alt="Description" loading="lazy" width="800" height="600">
</picture>
```

### Service Worker (Progressive Web App)

Consider implementing a service worker for offline support:

```javascript
// sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        // Add other assets
      ]);
    })
  );
});
```

## Support

For questions or issues, please open an issue in the GitHub repository.

## References

- [Web.dev Performance](https://web.dev/performance/)
- [MDN Web Performance](https://developer.mozilla.org/en-US/docs/Web/Performance)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest Documentation](https://docs.webpagetest.org/)
