// Minimal pass-through Service Worker to satisfy PWA installation criteria
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Just pass-through fetch to network
  event.respondWith(fetch(event.request));
});
