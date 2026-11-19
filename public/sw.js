/*
 * BharaPay service worker
 * - Precaches the offline page and icons.
 * - Static assets (/_next/static, icons, fonts): cache-first.
 * - Pages: network-first; when offline, show /offline.
 * - NEVER caches API calls, auth, payment routes or Supabase responses,
 *   so private money data is never stored on the device by the SW.
 */
const VERSION = 'bp-v1'
const STATIC_CACHE = `${VERSION}-static`
const PRECACHE = ['/offline', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return

  const isStatic = url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')
  if (isStatic) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone()
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy))
            return res
          }),
      ),
    )
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline')))
  }
})
