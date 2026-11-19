import type { MetadataRoute } from 'next'

/** Web App Manifest → makes BharaPay installable (PWA). Served at /manifest.webmanifest */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BharaPay — ভাড়ার হিসাব',
    short_name: 'BharaPay',
    description: 'Rent records, receipts and bills for landlords and tenants.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F4F7FB',
    theme_color: '#068FFF',
    lang: 'bn',
    categories: ['finance', 'business', 'productivity'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Bills', short_name: 'বিল', url: '/bills' },
      { name: 'Tenants', short_name: 'ভাড়াটিয়া', url: '/tenants' },
    ],
  }
}
