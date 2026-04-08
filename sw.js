const V = 'planify-v30';
const STATIC = [
  '/apple-touch-icon-180.png', '/apple-touch-icon.png',
  '/icon.svg', '/manifest.json'
];

self.addEventListener('install', e => {
  // Ne précache que les images/icônes — PAS les JS/CSS
  e.waitUntil(caches.open(V).then(c => c.addAll(STATIC).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Supprimer TOUS les anciens caches
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const ext = url.pathname.split('.').pop();

  // JS et CSS → toujours réseau en premier (mises à jour instantanées)
  if (ext === 'js' || ext === 'css') {
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(V).then(c => c.put(e.request, clone));
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Navigation → réseau en premier, fallback cache
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(V).then(c => c.put(e.request, clone));
        return r;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Autres (images…) → cache en premier
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(r2 => {
      const clone = r2.clone();
      caches.open(V).then(c => c.put(e.request, clone));
      return r2;
    }).catch(() => new Response('', { status: 408 })))
  );
});

// ── Push notification handler (Web Push API) ─────────
self.addEventListener('push', e => {
  let data = { title: 'Planify', body: '' };
  try { data = e.data ? e.data.json() : data; } catch {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'Planify', {
      body:    data.body  || '',
      icon:    './apple-touch-icon-180.png',
      badge:   './apple-touch-icon-180.png',
      vibrate: [200, 100, 200],
      tag:     data.tag   || 'planify',
      data:    { url: data.url || './' },
    })
  );
});

// ── Notification click → ouvrir l'app ────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      for (const c of cls) {
        if (c.url && c.focus) { c.focus(); return; }
      }
      return clients.openWindow(target);
    })
  );
});

// ── Message depuis l'app → showNotification local ───
// Utilisé pour les notifications planifiées (setTimeout) sur iOS
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = e.data;
    self.registration.showNotification(title || 'Planify', {
      body:    body  || '',
      icon:    './apple-touch-icon-180.png',
      badge:   './apple-touch-icon-180.png',
      vibrate: [200, 100, 200],
      tag:     tag   || 'planify',
    });
  }
});
