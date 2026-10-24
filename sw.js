// Offline support: every file the games need is cached on first visit.
// Bump VERSION when files are added or removed.
const VERSION = 'defne-v3';
const FILES = [
  './', 'index.html', 'pizza.html', 'klas.html', 'voetbal.html', 'sommen.js', 'pwa.js', 'manifest.webmanifest',
  'fonts/fonts.css', 'fonts/fredoka-latin-1.woff2', 'fonts/fredoka-latin-ext-0.woff2',
  'fonts/nunito-latin-3.woff2', 'fonts/nunito-latin-ext-2.woff2',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Serve from the cache straight away, and refresh the cached copy in the background when online.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const cached = await cache.match(req, { ignoreSearch: true });
    const fresh = fetch(req).then(res => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => cached);
    return cached || fresh;
  }));
});
