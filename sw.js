/**
 * Service worker for Tableau CH.
 *
 * Strategy:
 *  - Pre-cache the static shell on install (HTML, CSS, JS, icons, background).
 *  - Stale-while-revalidate same-origin GETs so the app loads instantly and
 *    new versions roll in on the next visit.
 *  - Bypass entirely for the Netlify function so live NHL data is never
 *    served from cache; the front-end's adaptive polling and ETag handling
 *    already manage freshness.
 *  - Bypass for cross-origin requests (NHL CDN, NHL API direct fallback);
 *    the browser HTTP cache and CDNs handle those better than we can.
 */

const CACHE_VERSION = "tableau-ch-v2";
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./styles.css",
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
