import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate } from 'workbox-strategies'

clientsClaim()

// Pre-cache assets
precacheAndRoute(self.__WB_MANIFEST)

// Cache API responses
registerRoute(
  ({ url }) => url.pathname.startsWith('/api'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      {
        cacheWillUpdate: async ({ request, response }) => {
          if (!response.ok) return null
          return response
        },
      },
    ],
  })
)

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'image-cache',
    plugins: [
      {
        cacheWillUpdate: async ({ request, response }) => {
          if (!response.ok) return null
          return response
        },
      },
    ],
  })
)

// Cache offline pages
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate({
    cacheName: 'offline-cache',
    plugins: [
      {
        cacheWillUpdate: async ({ request, response }) => {
          if (!response.ok) return null
          return response
        },
      },
    ],
  })
)
