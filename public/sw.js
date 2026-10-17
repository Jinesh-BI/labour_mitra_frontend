// Minimal service worker: makes the app installable and lets the shell open without a connection.
// API calls are never cached (bookings and call status must always be live).
const CACHE = "labourmitra-shell-v1";
const SHELL = ["/", "/manifest.webmanifest", "/icon-192.png", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Pages: network first, fall back to the cached shell when offline.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/")));
    return;
  }

  // Built assets are content-hashed: cache first, fill the cache as they are used.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
