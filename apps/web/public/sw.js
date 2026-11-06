const APP_VERSION = "blockcoin-20260101"
const CACHE_NAME = "blockcoin-v" + APP_VERSION

const PRECACHE = [
  "/icon-192.png",
  "/icon-512.png",
]

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE))
  )
})

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
})

self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting()
})

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url)

  if (e.request.method !== "GET" || url.origin !== location.origin) return
  if (url.pathname.startsWith("/api/")) return

  // Never cache HTML — always network
  if (e.request.mode === "navigate" || e.request.headers.get("accept")?.includes("text/html")) {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match(e.request).then(cached => {
          if (cached) return cached
          return new Response(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BlockCoin - Offline</title><style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#101820;color:#F4F7FA;text-align:center;padding:1rem}.c{max-width:320px}h1{font-size:1.5rem;margin-bottom:.5rem;color:#00C89B}p{color:#ffffff80;font-size:.875rem}button{margin-top:1rem;padding:.75rem 1.5rem;background:#00C89B;color:#101820;border:none;border-radius:.75rem;font-weight:700;cursor:pointer;font-size:.9rem}</style></head><body><div class="c"><h1>₮ BlockCoin</h1><p>You're offline. Check your connection and try again.</p><button onclick="location.reload()">Try Again</button></div></body></html>`, {
            status: 200,
            headers: { "Content-Type": "text/html" },
          })
        })
      )
    )
    return
  }

  // JS/CSS — stale while revalidate
  if (url.pathname.startsWith("/_next/")) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const network = fetch(e.request).then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone)).catch(() => {})
          }
          return res
        }).catch(() => cached || new Response("", { status: 503 }))
        return cached || network
      })
    )
    return
  }

  // Static assets — cache first
  if (url.pathname.match(/\.(png|svg|jpg|jpeg|webp|gif|ico|woff2?|ttf|css)$/)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached
        return fetch(e.request).then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone)).catch(() => {})
          }
          return res
        })
      })
    )
    return
  }
})
