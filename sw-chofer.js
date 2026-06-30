// Service Worker — Fletar Chofer
// Cambiar versión cada vez que se actualiza la app para limpiar caché viejo
const VERSION = 'fletar-chofer-v4';

const ARCHIVOS_ESTATICOS = [
  '/fletar-chofer.html',
  '/manifest-chofer.json',
  '/icon-chofer-192.png',
  '/icon-chofer-512.png',
];

const ARCHIVOS_CDN = [
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js',
];

// ── INSTALL: cachear todos los archivos clave ─────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION).then(cache => {
      // Cachear archivos propios (críticos)
      cache.addAll(ARCHIVOS_ESTATICOS).catch(() => {});
      // Cachear CDN (no crítico — si falla no rompe la instalación)
      ARCHIVOS_CDN.forEach(url => cache.add(url).catch(() => {}));
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: limpiar cachés de versiones anteriores ─────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== VERSION).map(k => caches.delete(k))
      )
    ).then(() => clients.claim())
  );
});

// ── FETCH: estrategia según tipo de recurso ───────────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Firebase Realtime Database — siempre red (datos en tiempo real)
  if (url.hostname.includes('firebasedatabase.app') ||
      url.hostname.includes('firebase.com') ||
      url.hostname.includes('firestore.googleapis.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Archivos propios y CDN — caché primero, red como fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      const red = fetch(e.request).then(response => {
        // Si la respuesta es válida, actualizar caché en background
        if (response && response.status === 200 && response.type !== 'opaque') {
          caches.open(VERSION).then(cache => cache.put(e.request, response.clone()));
        }
        return response;
      }).catch(() => null);

      // Devolver caché inmediatamente si existe; actualizar en background
      return cached || red;
    })
  );
});
