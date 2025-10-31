// Service Worker for ROSE Performance Management
// Provides offline functionality and asset caching

const CACHE_VERSION = 'rose-pms-v1';
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  // Google Sign-In library will be loaded from CDN
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => {
        console.log('[Service Worker] Caching assets');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old caches
              return cacheName.startsWith('rose-pms-') && cacheName !== CACHE_VERSION;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - serve from cache when offline, network first for API calls
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip caching for external APIs (Google, Apps Script)
  // Use exact origin checking for better security
  if (url.origin === 'https://accounts.google.com' || 
      url.origin === 'https://www.googleapis.com') {
    // Network only for authentication and external services
    event.respondWith(fetch(request));
    return;
  }
  
  // For Apps Script API calls, use network-first strategy
  if (url.origin === 'https://script.google.com') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // If offline, return a custom offline response
          return new Response(
            JSON.stringify({ 
              error: 'offline', 
              message: 'You are currently offline. Please check your internet connection.' 
            }),
            { 
              headers: { 'Content-Type': 'application/json' },
              status: 503 
            }
          );
        })
    );
    return;
  }
  
  // For static assets, use cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Clone the response
            const responseToCache = networkResponse.clone();
            
            // Cache the new response for future use
            if (networkResponse.ok && request.method === 'GET') {
              caches.open(CACHE_VERSION)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }
            
            return networkResponse;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);
            
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // For other requests, throw error
            throw error;
          });
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});
