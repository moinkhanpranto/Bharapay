import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { paymentEnv } from '@/lib/env.server'
import { getLocale, getT } from '@/lib/i18n/server'
import type { MockCheckoutToken } from '@/lib/payments/providers/mock'
import { verifyToken } from '@/lib/payments/signature'
import { formatTaka } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'Test checkout', robots: { index: false } }

/**
 * FAKE hosted checkout page (stands in for bKash/Nagad/SSLCOMMERZ).
 * Only reachable when MOCK_GATEWAY_ENABLED=true. The signed token stops
 * anyone from changing the amount or intent in the URL.
 */
export default async function MockCheckoutPage({ searchParams }: PageProps<'/mock-gateway/checkout'>) {
  const env = paymentEnv()
  if (env.MOCK_GATEWAY_ENABLED !== 'true') notFound()

  const { token } = await searchParams
  const data = typeof token === 'string' ? verifyToken<MockCheckoutToken>(env.PAYMENT_WEBHOOK_SECRET, token) : null
  if (!data || typeof token !== 'string') notFound()
  const [t, locale] = await Promise.all([getT(), getLocale()])

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#e2136e] px-5 py-10">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl">
        <p className="text-sm font-semibold tracking-widest text-[#e2136e] uppercase">{t.mock.title}</p>
        <p className="mt-4 text-4xl font-bold">{formatTaka(data.amount, locale)}</p>
        <p className="mt-1 text-sm text-ink-muted">Ref: {data.providerRef.slice(0, 18)}…</p>
        <p className="mt-4 rounded-2xl bg-warning-soft px-4 py-3 text-sm text-warning">{t.mock.warning}</p>
        <form action="/api/mock-gateway/complete" method="post" className="mt-6 flex flex-col gap-2">
          <input type="hidden" name="token" value={token} />
          <button
            name="outcome"
            value="succeeded"
            className="h-14 rounded-2xl bg-[#e2136e] px-6 text-lg font-semibold text-white hover:bg-[#c10f5d]"
          >
            {t.mock.payNow}
          </button>
          <Button name="outcome" value="failed" variant="danger">
            {t.mock.fail}
          </Button>
          <Button name="outcome" value="cancelled" variant="ghost">
            {t.mock.cancel}
          </Button>
        </form>
      </div>
    </main>
  )
}
