const CACHE_NAME = 'runningpacenote-v1';
const ASSETS = [
    './',
    './index.html',
    './main.css',
    './script.js',
    './icons8-exercise-96.png',
    './speedometer.png',
    './track.png',
    './treadmill.png',
    './stopwatch.png',
    './switch.png',
    './information.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
