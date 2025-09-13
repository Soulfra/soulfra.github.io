// PWA Service Worker

const CACHE_NAME = 'soulfra-remote-v1';
const urlsToCache = [
    '/remote/',
    '/remote/index.html',
    '/remote/mobile-remote.css',
    '/remote/mobile-remote.js',
    '/remote/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});