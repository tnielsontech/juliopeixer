const CACHE_NAME = 'peixer-pinturas-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json'
];

// Instalar Service Worker e salvar assets estáticos no cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativar e limpar caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptar requisições com estratégia Stale-While-Revalidate (mais atualizado)
self.addEventListener('fetch', (e) => {
  // Ignorar requisições que não são GET ou que são externas de APIs
  if (
    e.request.method !== 'GET' || 
    e.request.url.includes('script.google.com') || 
    e.request.url.includes('supabase.co') || 
    e.request.url.includes('googleapis.com')
  ) {
    return;
  }

  e.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(e.request).then((cachedResponse) => {
        const fetchedResponse = fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200 && e.request.url.startsWith(self.location.origin)) {
            cache.put(e.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Falha de rede silenciosa
        });

        return cachedResponse || fetchedResponse;
      });
    })
  );
});
