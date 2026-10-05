// KOMOTE Service Worker for Offline PWA Support and APK Packaging
const CACHE_NAME = 'komote-cache-v2';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './manifest.webmanifest',
  './icon.svg',
  './apple-touch-icon.png',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './pwa-maskable-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((url) => cache.add(url).catch((e) => console.log('SW cache skip:', url, e)))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // CRITICAL: NEVER intercept or cache local Kindle requests (port 8080 or local IPs)
  if (url.includes(':8080') || url.includes('/koreader/') || url.includes('192.168.') || url.includes('172.') || url.includes('10.')) {
    return;
  }

  // Handle standard HTTP requests for offline support
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached asset, fetch fresh version in background
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Fallback to cached index.html if offline
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html') || caches.match('index.html') || caches.match('./') || caches.match('/index.html');
          }
        });
      })
    );
  }
});
