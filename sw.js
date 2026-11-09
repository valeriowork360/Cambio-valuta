// Network-first with cache fallback: always fresh when online, works offline.
const CACHE = "cambio-v1";
const SHELL = ["./", "index.html", "rates.json", "manifest.webmanifest", "icons/icon-192.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const key = sameOrigin && url.pathname.endsWith("rates.json") ? new Request(url.origin + url.pathname) : req;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok && (sameOrigin || url.hostname.endsWith("gstatic.com") || url.hostname.endsWith("googleapis.com"))) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(key, copy));
      }
      return res;
    }).catch(() => caches.match(key).then(r => r || caches.match("index.html")))
  );
});
