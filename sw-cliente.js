// Service Worker — Fletar Cliente
const VERSION = 'fletar-cliente-v1';

const ARCHIVOS_ESTATICOS = [
  '/fletar-cliente.html',
  '/manifest-cliente.json',
  '/icon-cliente-192.png',
  '/icon-cliente-512.png',
];

const ARCHIVOS_CDN = [
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.development.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.development.js',
];

// ── INSTALL ───────────────────────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION).then(cache => {
      cache.addAll(ARCHIVOS_ESTATICOS).catch(() => {});
      ARCHIVOS_CDN.forEach(url => cache.add(url).catch(() => {}));
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Firebase y Nominatim — siempre red
  if (url.hostname.includes('firebasedatabase.app') ||
      url.hostname.includes('firebase.com') ||
      url.hostname.includes('nominatim.openstreetmap.org')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Todo lo demás — caché primero, red como fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      const red = fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          caches.open(VERSION).then(cache => cache.put(e.request, response.clone()));
        }
        return response;
      }).catch(() => null);
      return cached || red;
    })
  );
});
