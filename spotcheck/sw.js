/* Spot-Check Inventory — offline app shell cache.
   Bump CACHE when any shell file changes so clients pick up the new version. */
var CACHE = "spotcheck-shell-v4-screens";
var SHELL = [
  "index.html",
  "manifest.webmanifest",
  "icon.svg",
  "icon-512.png",
  "apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) { return caches.delete(k); }
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") { return; }
  // Cache-first: the shell is static; entries live in localStorage, not the network.
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      if (hit) { return hit; }
      return fetch(e.request).then(function (res) {
        // opportunistically cache same-origin GETs
        var copy = res.clone();
        caches.open(CACHE).then(function (c) {
          try { c.put(e.request, copy); } catch (err) { /* ignore */ }
        });
        return res;
      }).catch(function () {
        // offline and not cached: fall back to the app shell for navigations
        if (e.request.mode === "navigate") { return caches.match("index.html"); }
      });
    })
  );
});
