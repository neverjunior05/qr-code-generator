const CACHE = "qrforge-studio-v1";
const CORE = ["/create", "/manifest.json", "/favicon.svg", "/samples/bulk.csv"];
self.addEventListener("install", (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (event) => {
  const request = event.request; const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/q/")) return;
  if (request.destination === "document") {
    event.respondWith(fetch(request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(request, copy)); return response; }).catch(() => caches.match(request).then((cached) => cached || caches.match("/create"))));
  } else {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => { if (response.ok && ["script", "style", "font", "image"].includes(request.destination)) caches.open(CACHE).then((cache) => cache.put(request, response.clone())); return response; })));
  }
});
