/* ==========================================
   EMERGENCY SERVICE WORKER RESET
   This replaces the old broken SW to fix fetch errors.
   ========================================== */

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation immediately
  console.log('🧹 Emergency SW Installed: Taking over...');
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // DELETE ALL OLD CACHES
      return Promise.all(
        cacheNames.map((cache) => {
          console.log('🧹 Deleting old cache:', cache);
          return caches.delete(cache);
        })
      );
    }).then(() => {
      console.log('🧹 All caches cleared. Unregistering self...');
      // Tell all clients to reload and stop using SW
      return self.clients.claim(); 
    })
  );
  
  // Optional: Self-destruct logic (unregister) usually handled in main.js, 
  // but claiming clients ensures we take control to bypass the broken one.
});

// PASS-THROUGH FETCH (Do not block/cache anything)
self.addEventListener('fetch', (event) => {
  // Just return the network request directly. No caching.
  event.respondWith(fetch(event.request));
});
