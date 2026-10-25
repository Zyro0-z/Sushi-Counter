// Guarda la app para que funcione sin conexión. Sube la versión al publicar cambios.
const CACHE = 'sushi-v5';
const CORE = [
  './', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icon-512.png', './css/app.css',
  './js/main.js', './js/store.js', './js/catalog.js', './js/icons.js', './js/art.js', './js/logic.js', './js/fx.js',
  './js/ui/common.js', './js/ui/hero.js', './js/ui/counter.js', './js/ui/retos.js', './js/ui/history.js', './js/ui/settings.js',
  './js/ui/play.js', './js/ui/share.js', './js/ui/scan.js', './js/ui/files.js', './js/ui/intro.js', './js/ui/hub.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// La mesa compartida (ntfy.sh) va siempre por red. El resto responde desde la caché y se actualiza en segundo plano.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.hostname === 'ntfy.sh') return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, {ignoreSearch: url.origin === location.origin});
    const net = fetch(e.request).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
