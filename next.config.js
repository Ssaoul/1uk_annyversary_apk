/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'supabase.co'],
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    loader: 'default',
    minimumCacheTTL: 60,
    path: '/_next/image',
    unoptimized: false,
  },
  experimental: {
    optimizeCss: true,
    optimizeFonts: true,
  },
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
    sw: 'service-worker.js',
    disable: process.env.NODE_ENV === 'development',
    manifest: {
      name: '기념일 앱',
      short_name: '기념일',
      description: '기념일 관리 앱',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    }
  },
  webpack: (config) => {
    config.output.publicPath = '/_next/';
    return config;
  }
}

module.exports = nextConfig
