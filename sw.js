/**
 * Service worker for Tableau CH.
 *
 * Strategy:
 *  - Pre-cache the static shell on install (HTML, CSS, JS, icons, background).
 *  - Network-first navigations so users see the latest HTML immediately,
 *    with cached shell fallback for offline use.
 *  - Stale-while-revalidate same-origin assets so the app loads instantly and
 *    new asset versions roll in on the next visit.
 *  - Bypass entirely for the Netlify function so live NHL data is never
 *    served from cache; the front-end's adaptive polling and ETag handling
 *    already manage freshness.
 *  - Bypass for cross-origin requests (NHL CDN, NHL API direct fallback);
 *    the browser HTTP cache and CDNs handle those better than we can.
 */

const CACHE_VERSION = "tableau-ch-v11";
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./app.js?v=nav-v11",
  "./styles.css?v=nav-v11",
  "./manifest.json",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/playoff-ice.webp",
  "./assets/player-placeholder.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/.netlify/")) return;

  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      if (request.mode === "navigate") {
        try {
          const response = await fetch(request);
          if (response && response.ok && response.type === "basic") {
            cache.put(request, response.clone()).catch(() => {});
          }
          return response;
        } catch {
          return (await cache.match(request)) || cache.match("./index.html");
        }
      }

      const cached = await cache.match(request);
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === "basic") {
            cache.put(request, response.clone()).catch(() => {});
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
