/* Service Worker — Sistema Abasto v2 */
const CACHE_NAME = 'abasto-cache-v2';
const ASSETS = [
    './',
    './index.html',
    './sw.js'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return Promise.all(
                ASSETS.map(url => 
                    cache.add(url).catch(err => console.log('Fallo:', url, err))
                )
            );
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) {
                fetch(event.request).then(resp => {
                    if (resp && resp.status === 200) {
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resp));
                    }
                }).catch(() => {});
                return cached;
            }
            
            return fetch(event.request).then(resp => {
                if (!resp || resp.status !== 200 || resp.type !== 'basic') {
                    return resp;
                }
                const respClone = resp.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
                return resp;
            }).catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                return new Response('Sin conexion', { status: 503, statusText: 'Offline' });
            });
        })
    );
});