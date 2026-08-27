// Service worker minimo: rende l'app installabile e apre l'ultima
// versione anche con rete instabile (network-first).
const CACHE = "od-v1";
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add("/index.html")));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => self.clients.claim());
self.addEventListener("fetch", (e) => {
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put("/index.html", copy));
          return r;
        })
        .catch(() => caches.match("/index.html"))
    );
  }
});
