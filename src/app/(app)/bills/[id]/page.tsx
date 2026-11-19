import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BackLink } from '@/components/layout/back-link'
import { Card, CardTitle, PageHeader } from '@/components/ui/card'
import { Pill, StatusBadge } from '@/components/ui/status-badge'
import { deleteBillItem } from '@/features/bills/actions'
import { getBill } from '@/features/bills/queries'
import { requireOnboardedUser } from '@/lib/auth/session'
import { format } from '@/lib/i18n/config'
import { getLocale, getT } from '@/lib/i18n/server'
import { displayStatus } from '@/lib/utils/bill-status'
import { formatDate, formatMonth, formatTaka, todayISO } from '@/lib/utils/format'
import { idSchema } from '@/lib/validation/schemas'
import { AddChargeForm, PayOnlineForm, RecordPaymentForm, VoidPaymentForm } from './bill-forms'

export const metadata: Metadata = { title: 'Bill' }

export default async function BillPage({ params }: PageProps<'/bills/[id]'>) {
  const user = await requireOnboardedUser()
  const { id } = await params
  if (!idSchema.safeParse({ id }).success) notFound()
  const [t, locale, bill] = await Promise.all([getT(), getLocale(), getBill(id)])
  if (!bill) notFound()

  const isLandlord = user.profile.role === 'landlord'
  const left = Math.max(0, Number(bill.amount_due) - Number(bill.amount_paid))
  const unit = bill.tenants?.units

  return (
    <>
      <PageHeader
        title={`${bill.tenants?.full_name ?? ''} · ${formatMonth(bill.period, locale)}`}
        subtitle={`${unit?.properties?.name ?? ''} · ${unit?.label ?? ''} · ${format(t.bills.due, { date: formatDate(bill.due_date, locale) })}`}
        back={<BackLink href={`/bills?month=${bill.period}`} label={t.bills.title} />}
        action={<StatusBadge status={displayStatus(bill)} t={t} />}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-5">
          <Card>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                [t.bills.total, formatTaka(bill.amount_due, locale), ''],
                [t.bills.paid, formatTaka(bill.amount_paid, locale), 'text-success'],
                [t.bills.left, formatTaka(left, locale), left > 0 ? 'text-warning' : ''],
              ].map(([label, value, tone]) => (
                <div key={label}>
                  <p className="text-sm text-ink-muted">{label}</p>
                  <p className={`text-xl font-bold ${tone}`}>{value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle>{t.bills.items}</CardTitle>
            <ul className="divide-y divide-line">
              {bill.bill_items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span>
                    <span className="font-medium">{t.bills.chargeKind[item.kind]}</span>
                    {item.label !== 'Rent' && item.label !== 'Service charge' && <span className="text-ink-muted"> · {item.label}</span>}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-semibold">{formatTaka(item.amount, locale)}</span>
                    {isLandlord && bill.status !== 'paid' && (
                      <form action={deleteBillItem}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="bill_id" value={bill.id} />
                        <button className="text-sm text-danger hover:underline" aria-label={`${t.common.delete} ${item.label}`}>
                          {t.common.delete}
                        </button>
                      </form>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            {isLandlord && <AddChargeForm billId={bill.id} />}
          </Card>

          <Card>
            <CardTitle>{t.bills.payments}</CardTitle>
            {bill.payments.length === 0 ? (
              <p className="text-ink-muted">{t.bills.noPayments}</p>
            ) : (
              <ul className="divide-y divide-line">
                {bill.payments.map((p) => (
                  <li key={p.id} className="flex flex-col gap-2 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/receipts/${p.id}`} className={`font-semibold hover:underline ${p.voided_at ? 'line-through opacity-60' : ''}`}>
                        {formatTaka(p.amount, locale)} · {t.payments.methods[p.method]}
                      </Link>
                      {p.voided_at ? (
                        <Pill tone="danger">{t.payments.voided}</Pill>
                      ) : p.verified ? (
                        <Pill tone="success">{t.payments.verified}</Pill>
                      ) : (
                        <Pill tone="violet">{t.payments.manual}</Pill>
                      )}
                    </div>
                    <p className="text-sm text-ink-muted">
                      {formatDate(p.paid_at, locale)} · {t.payments.receiptNo} {p.receipt_no}
                      {p.reference ? ` · ${p.reference}` : ''}
                      {p.void_reason ? ` · ${p.void_reason}` : ''}
                    </p>
                    {isLandlord && !p.voided_at && p.source === 'manual' && <VoidPaymentForm paymentId={p.id} />}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside>
          {left > 0 ? (
            <Card className="lg:sticky lg:top-8">
              {isLandlord ? (
                <>
                  <CardTitle>{t.payments.record}</CardTitle>
                  <RecordPaymentForm billId={bill.id} left={left} today={todayISO()} />
                </>
              ) : (
                <PayOnlineForm billId={bill.id} label={format(t.bills.payOnline, { amount: formatTaka(left, locale) })} />
              )}
            </Card>
          ) : (
            <Card>
              <p className="text-success">{t.bills.nothingDue}</p>
            </Card>
          )}
        </aside>
      </div>
    </>
  )
}
