// Guarda la app para que funcione sin conexión. Sube la versión al publicar cambios.
const CACHE = 'sushi-v8';
const CORE = [
  './', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icon-512.png', './css/app.css',
  './js/main.js', './js/store.js', './js/catalog.js', './js/icons.js', './js/art.js', './js/menu.js', './js/logic.js', './js/fx.js',
  './js/ui/common.js', './js/ui/hero.js', './js/ui/counter.js', './js/ui/retos.js', './js/ui/history.js', './js/ui/settings.js',
  './js/ui/play.js', './js/ui/share.js', './js/ui/scan.js', './js/ui/files.js', './js/ui/intro.js', './js/ui/hub.js', './js/ui/carta.js', './js/ui/lector.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Solo se guardan la app, las fuentes y las librerías. La mesa compartida, el buscador de restaurantes y
// la lectura de cartas van siempre por red. Lo guardado responde al momento y se actualiza en segundo plano.
const STATIC = /^(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)$/;
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.includes('/api/') || (url.origin !== location.origin && !STATIC.test(url.hostname))) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, {ignoreSearch: url.origin === location.origin});
    const net = fetch(e.request).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
