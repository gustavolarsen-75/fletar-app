// Service Worker — Fletar Cliente
// El HTML se sirve siempre desde la red → los usuarios reciben actualizaciones automáticamente
const VERSION = 'fletar-cliente-v3';

// NO incluir HTML — se actualiza en tiempo real desde el servidor
const ARCHIVOS_ESTATICOS = [
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

// ── NOTIFICATION CLICK ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (clients.openWindow) return clients.openWindow('/fletar-cliente.html');
    })
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

  // HTML — red primero, caché como fallback offline
  // Así cada apertura de la app recibe la versión más nueva automáticamente
  if (e.request.destination === 'document' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          if (response && response.status === 200) {
            const copia = response.clone();
            caches.open(VERSION).then(cache => cache.put(e.request, copia));
          }
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Assets estáticos y CDN — caché primero, red como fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      const red = fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const copia = response.clone();
          caches.open(VERSION).then(cache => cache.put(e.request, copia));
        }
        return response;
      }).catch(() => null);
      return cached || red;
    })
  );
});
