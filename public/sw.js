/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const CACHE_NAME = "greenlens-platform-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
];

// Install Event: Cache essential skeleton
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate Event: Clear stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper to determine if a request deserves to be cached on dynamic navigation
const shouldCacheRequest = (url) => {
  if (url.protocol.startsWith("chrome-extension") || url.hostname.includes("chrome-extension")) return false;
  if (url.pathname.includes("sockjs") || url.pathname.includes("vite") || url.pathname.includes("hot-update")) return false;
  return true;
};

// Fetch Event: Robust caching strategy
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || !shouldCacheRequest(url)) {
    return;
  }

  // 1. API Caching Strategy: Network-First falling back to Cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const cacheCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cacheCopy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((fallback) => {
            if (fallback) return fallback;
            // Build custom fallback response for API when totally disconnected
            return new Response(
              JSON.stringify({ error: "No internet connection detected. Viewing offline cached reports." }),
              { headers: { "Content-Type": "application/json" } }
            );
          });
        })
    );
    return;
  }

  // 2. Static Assets (JS, CSS, Images, Fonts): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, cacheCopy);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Gracefully let fetch fail offline
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
