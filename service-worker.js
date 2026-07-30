// Service Worker for Savanna Explorer PWA
const CACHE_NAME = 'savanna-explorer-v1';
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Core CSS
  '/css/tokens.css',
  '/css/styles.css',
  '/css/print-checklist.css',
  '/css/reveal.css',
  '/css/redesign.css',
  '/css/scroll-ux.css',
  '/css/nav-journey.css',
  '/css/seo.css',
  '/css/ai-planner.css',
  '/css/travel-essentials.css',
  '/css/share.css',
  '/css/lead-magnet.css',
  '/css/search.css',
  '/css/dark-mode.css',
  // Core JS
  '/js/app.js',
  '/js/config.js',
  // Libs
  '/js/lib/router.js',
  '/js/lib/nav-structure.js',
  '/js/lib/country-meta.js',
  '/js/lib/country-resources.js',
  '/js/lib/visa-passport.js',
  '/js/lib/planner-format.js',
  '/js/lib/itinerary-budget.js',
  '/js/lib/itinerary-maps.js',
  '/js/lib/modal-focus.js',
  '/js/lib/planner-expense-sync.js',
  '/js/lib/supabase.js',
  '/js/lib/budget-expense-compare.js',
  '/js/lib/content-meta.js',
  '/js/lib/tourism-charts.js',
  '/js/lib/planner-analytics.js',
  // Modules (core functionality)
  '/js/modules/nav.js',
  '/js/modules/scroll-ux.js',
  '/js/modules/reveal.js',
  '/js/modules/share.js',
  '/js/modules/search.js',
  '/js/modules/dark-mode.js',
  '/js/modules/trip-planner.js',
  // Data files (essential for offline use)
  '/data/countries.json',
  '/data/parks.json',
  '/data/borders.json',
  '/data/itineraries.json',
  '/data/stays-operators.json',
  '/data/marketplace.json',
  '/data/planning-guides.json',
  '/data/discover.json',
  '/data/guides.json',
  '/data/faqs.json',
  '/data/practical.json',
  '/data/packing.json',
  '/data/visa-passport.json',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching core assets');
        // Add all the precache URLs to the cache
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting on install');
        return self.skipWaiting(); // Forces the waiting service worker to become active
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Return true if you want to remove this cache,
            // but remember that caches are shared across the whole origin
            return cacheName !== CACHE_NAME;
          })
          .map((cacheName) => {
            console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
      );
    })
    // Tell the waiting service worker to become the active service worker
    .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests (like to Google Analytics, etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle navigation requests (HTML) - if offline, show offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.open(CACHE_NAME).then((cache) => {
          return cache.match(OFFLINE_URL);
        });
      })
    );
    return;
  }

  // For all other requests, try the network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If we got a valid response from the network, update the cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try to get it from the cache
        return caches.match(event.request);
      })
  );
});

// Optional: Handle push notifications (if you want to add them later)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'No payload',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png'
  };

  event.waitUntil(
    self.registration.showNotification('Savanna Explorer', options)
  );
});