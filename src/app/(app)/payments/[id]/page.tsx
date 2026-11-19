import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LinkButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getIntent } from '@/features/payments/queries'
import { requireOnboardedUser } from '@/lib/auth/session'
import { getLocale, getT } from '@/lib/i18n/server'
import { formatTaka } from '@/lib/utils/format'
import { idSchema } from '@/lib/validation/schemas'
import { AutoRefresh } from './auto-refresh'

export const metadata: Metadata = { title: 'Payment' }

/**
 * Where the gateway sends the payer back. The status shown here is read from
 * the database (set by the verified webhook) — never from URL parameters.
 */
export default async function PaymentStatusPage({ params }: PageProps<'/payments/[id]'>) {
  await requireOnboardedUser()
  const { id } = await params
  if (!idSchema.safeParse({ id }).success) notFound()
  const [t, locale, intent] = await Promise.all([getT(), getLocale(), getIntent(id)])
  if (!intent) notFound()

  const view = {
    created: { title: t.payments.processing, tone: 'text-ink' },
    pending: { title: t.payments.processing, tone: 'text-ink' },
    succeeded: { title: t.payments.success, tone: 'text-success' },
    failed: { title: t.payments.failed, tone: 'text-danger' },
    cancelled: { title: t.payments.cancelled, tone: 'text-ink-muted' },
    expired: { title: t.payments.cancelled, tone: 'text-ink-muted' },
  }[intent.status]
  const waiting = intent.status === 'created' || intent.status === 'pending'
  const paymentId = intent.payments?.id

  return (
    <div className="mx-auto max-w-md">
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-sm text-ink-muted">{t.payments.returnTitle}</p>
        <h1 className={`text-2xl font-bold ${view.tone}`}>{view.title}</h1>
        <p className="text-3xl font-bold">{formatTaka(intent.amount, locale)}</p>
        {waiting && <AutoRefresh />}
        <div className="mt-4 flex w-full flex-col gap-2">
          {paymentId && <LinkButton href={`/receipts/${paymentId}`} variant="tenant">{t.payments.receipt}</LinkButton>}
          <LinkButton href={`/bills/${intent.bill_id}`} variant="ghost">
            {t.payments.backToBill}
          </LinkButton>
        </div>
      </Card>
    </div>
  )
}
