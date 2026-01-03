// ✅ Service Worker for Stars & Naughty PWA
// Handles offline support + auto-updates

const CACHE_PREFIX = "stars-cache-";
const CACHE_NAME = CACHE_PREFIX + Date.now();

// Core assets (app shell)
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png"
];

// 📥 INSTALL
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting(); // activate immediately
});

// 🧹 ACTIVATE
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();

  // 🔄 Tell all clients to reload
  self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      client.postMessage({ action: "reload" });
    }
  });
});

// 🌍 FETCH
self.addEventListener("fetch", (event) => {
  const requestUrl = event.request.url;

  // Always live-fetch Google Sheets
  if (requestUrl.includes("docs.google.com/spreadsheets")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
      );
    })
  );
});
