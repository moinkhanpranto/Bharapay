import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BackLink } from '@/components/layout/back-link'
import { Logo } from '@/components/brand/logo'
import { Pill } from '@/components/ui/status-badge'
import { getReceipt } from '@/features/payments/queries'
import { requireOnboardedUser } from '@/lib/auth/session'
import { getLocale, getT } from '@/lib/i18n/server'
import { formatDate, formatMonth, formatTaka } from '@/lib/utils/format'
import { idSchema } from '@/lib/validation/schemas'
import { ReceiptActions } from './receipt-actions'

export const metadata: Metadata = { title: 'Receipt' }

export default async function ReceiptPage({ params }: PageProps<'/receipts/[id]'>) {
  await requireOnboardedUser()
  const { id } = await params
  if (!idSchema.safeParse({ id }).success) notFound()
  const [t, locale, r] = await Promise.all([getT(), getLocale(), getReceipt(id)])
  if (!r) notFound()

  const unit = r.tenants?.units
  const rows: [string, string][] = [
    [t.payments.receiptNo, r.receipt_no],
    [t.payments.tenant, r.tenants?.full_name ?? ''],
    [t.payments.property, `${unit?.properties?.name ?? ''} · ${unit?.label ?? ''}`],
    [t.payments.forMonth, r.bills ? formatMonth(r.bills.period, locale) : ''],
    [t.payments.paidOn, formatDate(r.paid_at, locale)],
    [t.payments.method, `${t.payments.methods[r.method]}${r.reference ? ` · ${r.reference}` : ''}`],
  ]

  return (
    <div className="mx-auto max-w-md">
      {r.bills && <BackLink href={`/bills/${r.bills.id}`} label={t.common.back} />}
      <article className="rounded-[var(--radius-card)] border border-line bg-surface p-6 print:border-0">
        <header className="border-b border-line pb-4">
          <Logo height={28} />
        </header>
        <p className="mt-5 text-center text-sm font-semibold tracking-widest text-ink-muted uppercase">{t.payments.receipt}</p>
        <p className={`mt-1 text-center text-4xl font-bold ${r.voided_at ? 'line-through opacity-60' : ''}`}>{formatTaka(r.amount, locale)}</p>
        <p className="mt-2 text-center">
          {r.voided_at ? (
            <Pill tone="danger">{t.payments.voided}</Pill>
          ) : r.verified ? (
            <Pill tone="success">{t.payments.verified}</Pill>
          ) : (
            <Pill tone="violet">{t.payments.manual}</Pill>
          )}
        </p>
        <dl className="mt-6 grid gap-2.5">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-line pb-2 text-sm last:border-0">
              <dt className="text-ink-muted">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        {!r.verified && <p className="mt-4 text-center text-xs text-ink-muted">{t.payments.manualNote}</p>}
      </article>
      <ReceiptActions receiptNo={r.receipt_no} />
    </div>
  )
}
