/**
 * MapaLister Service Worker - Fixed Version
 * Provides offline functionality and caching without Response cloning errors
 */

const CACHE_NAME = 'mapalister-v1.0.1';
const CACHE_URLS = [
  '/',
  '/index.html',
  '/css/map.css',
  '/css/multi-select-dropdown.css',
  '/utils/lucide-utils.js',
  '/config/distance-utils.js',
  '/managers/reference-marker.js',
  '/utils/popup-utils.js',
  '/config/data-config.js',
  '/scripts/dynamic-data-config.js',
  '/managers/style-manager.js',
  '/managers/keyboard-manager.js',
  '/managers/welcome-overlay-manager.js',
  '/managers/settings-manager.js',
  '/managers/unified-map-manager.js',
  '/managers/data-manager.js',
  '/managers/sidebar-manager.js',
  '/managers/file-upload-manager.js',
  '/managers/user-display-manager.js',
  '/scripts/notification-system.js',
  '/scripts/main-integration.js',
  '/data/counties-coloured.geojson',
  '/data/dioceses-coloured.geojson'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('🔧 MapaLister Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching MapaLister resources...');
        // Use addAll but handle errors gracefully
        return Promise.allSettled(
          CACHE_URLS.map(url => 
            cache.add(url).catch(error => {
              console.warn(`⚠️ Failed to cache ${url}:`, error.message);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('✅ MapaLister Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.warn('⚠️ Service Worker installation had issues:', error);
        return self.skipWaiting(); // Continue anyway
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 MapaLister Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName.startsWith('mapalister-')) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ MapaLister Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - simplified and fixed
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip external requests and APIs that need fresh data
  if (!event.request.url.startsWith(self.location.origin) || 
      event.request.url.includes('api.mapbox.com') ||
      event.request.url.includes('tiles.mapbox.com') ||
      event.request.url.includes('fonts.googleapis.com') ||
      event.request.url.includes('unpkg.com')) {
    return;
  }
  
  event.respondWith(handleRequest(event.request));
});

// Fixed request handler - no more cloning errors
async function handleRequest(request) {
  try {
    // Check cache first
    const cachedResponse = await caches.match(request);
    
    // For HTML files, try network first for updates
    if (request.headers.get('accept')?.includes('text/html')) {
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          // Cache the new response (clone BEFORE reading)
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        }
      } catch (error) {
        // Network failed, return cached version if available
        if (cachedResponse) {
          console.log('📱 Serving cached HTML due to network error:', request.url);
          return cachedResponse;
        }
      }
    }
    
    // For other resources, return cached version if available
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Try network for non-cached resources
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        // Cache successful responses (clone BEFORE reading)
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });
        return networkResponse;
      }
      return networkResponse;
    } catch (error) {
      console.warn('⚠️ Network request failed:', request.url);
      
      // Return offline fallback for HTML requests
      if (request.headers.get('accept')?.includes('text/html')) {
        const fallback = await caches.match('/index.html');
        return fallback || new Response('Offline', { 
          status: 503, 
          statusText: 'Service Unavailable' 
        });
      }
      
      // For other resources, return error response
      return new Response('Offline', { 
        status: 503, 
        statusText: 'Service Unavailable' 
      });
    }
  } catch (error) {
    console.error('Service Worker request handling error:', error);
    return new Response('Error', { 
      status: 500, 
      statusText: 'Internal Server Error' 
    });
  }
}

// Handle service worker updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('✅ MapaLister Service Worker v1.0.1 loaded and ready');