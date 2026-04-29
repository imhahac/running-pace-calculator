const CACHE_NAME = 'runningpacenote-v5';
const ASSETS = [
    './',
    './index.html',
    './diagnostics.html',
    './training-report.html',
    './main.css',
    './main.js',
    './icons8-exercise-96.png',
    './speedometer.png',
    './track.png',
    './treadmill.png',
    './stopwatch.png',
    './switch.png',
    './information.png'
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(
            keys
                .filter((key) => key !== CACHE_NAME)
                .map((key) => caches.delete(key))
        );
        await self.clients.claim();
    })());
});

self.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') {
        return;
    }

    const requestURL = new URL(e.request.url);
    const isSameOrigin = requestURL.origin === self.location.origin;
    const isNavigation = e.request.mode === 'navigate';

    if (!isSameOrigin) {
        return;
    }

    if (isNavigation) {
        e.respondWith((async () => {
            try {
                const networkResponse = await fetch(e.request);
                const cache = await caches.open(CACHE_NAME);
                cache.put(e.request, networkResponse.clone());
                return networkResponse;
            } catch (error) {
                const cachedResponse = await caches.match(e.request);
                return cachedResponse || caches.match('./index.html');
            }
        })());
        return;
    }

    e.respondWith((async () => {
        try {
            const networkResponse = await fetch(e.request);
            const cache = await caches.open(CACHE_NAME);
            cache.put(e.request, networkResponse.clone());
            return networkResponse;
        } catch (error) {
            const cachedResponse = await caches.match(e.request);
            return cachedResponse || Response.error();
        }
    })());
});
