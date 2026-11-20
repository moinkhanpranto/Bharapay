import type { Metadata, Viewport } from 'next'
import { Hind_Siliguri, Onest } from 'next/font/google'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'
import { I18nProvider } from '@/lib/i18n/client'
import { getLocale } from '@/lib/i18n/server'
import './globals.css'

const onest = Onest({ subsets: ['latin'], variable: '--font-onest', display: 'swap' })
const hind = Hind_Siliguri({ subsets: ['bengali', 'latin'], weight: ['400', '500', '600', '700'], variable: '--font-hind', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'BharaPay — ভাড়ার হিসাব সহজ', template: '%s · BharaPay' },
  description: 'Rent records, receipts and bills for Bangladeshi landlords and tenants.',
  applicationName: 'BharaPay',
  appleWebApp: { capable: true, title: 'BharaPay', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/brand/bharapay-icon.svg', type: 'image/svg+xml' },
      { url: '/icons/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#068FFF',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <html lang={locale} className={`${onest.variable} ${hind.variable}`}>
      <body className="antialiased">
        <I18nProvider locale={locale}>{children}</I18nProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
