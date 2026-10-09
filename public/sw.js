/* Camino 3D service worker: app shell + cache em tempo de execução + rotas baixadas para offline. */
const SHELL = 'camino-shell-v1';
const RUNTIME = 'camino-runtime-v1';
const OFFLINE = 'camino-offline-v1';
const SHELL_URLS = ['/', '/inicio', '/seguranca', '/tradutor', '/manifest.webmanifest', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => Promise.allSettled(SHELL_URLS.map((u) => c.add(u)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => ![SHELL, RUNTIME, OFFLINE].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

async function fromAnyCache(request) {
  for (const name of [OFFLINE, RUNTIME, SHELL]) {
    const hit = await (await caches.open(name)).match(request, { ignoreVary: true });
    if (hit) return hit;
  }
  return undefined;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // tiles e APIs de terceiros não são cacheados aqui

  // Arquivos estáticos versionados: cache primeiro
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      fromAnyCache(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(RUNTIME).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Páginas e /api: rede primeiro, cache como reserva (dados podem estar desatualizados)
  if (req.mode === 'navigate' || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(async () => (await fromAnyCache(req)) || (req.mode === 'navigate' ? (await fromAnyCache('/inicio')) : undefined) || new Response(JSON.stringify({ error: { code: 'offline', message: 'Sem conexão' } }), { status: 503, headers: { 'Content-Type': 'application/json' } })),
    );
  }
});
