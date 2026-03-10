const V = 'planify-v2';
const SHELL = ['/', '/index.html', '/manifest.json', '/icon.svg',
  '/css/main.css', '/js/data.js', '/js/app.js',
  '/js/views/dashboard.js', '/js/views/notes.js', '/js/views/calendar.js',
  '/js/views/wellness.js', '/js/views/tasks.js', '/js/views/settings.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k\!==V).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method \!== 'GET') return;
  if (e.request.mode === 'navigate') {
    e.respondWith(caches.match('/index.html').then(r => r || fetch(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(r2 => {
    const c = r2.clone();
    caches.open(V).then(ca => ca.put(e.request, c));
    return r2;
  }).catch(() => new Response('offline'))));
});
