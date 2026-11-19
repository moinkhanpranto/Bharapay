import type { Metadata } from 'next'
import Link from 'next/link'
import { BillRow } from '@/components/bills/bill-row'
import { GenerateBillsForm } from '@/components/bills/generate-bills-form'
import { Card, PageHeader } from '@/components/ui/card'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons'
import { listBills, listMyBills } from '@/features/bills/queries'
import { requireOnboardedUser } from '@/lib/auth/session'
import { getLocale, getT } from '@/lib/i18n/server'
import { addMonths, formatMonth, formatTaka, monthStart } from '@/lib/utils/format'
import { periodSchema } from '@/lib/validation/schemas'

export const metadata: Metadata = { title: 'Bills' }

export default async function BillsPage({ searchParams }: PageProps<'/bills'>) {
  const user = await requireOnboardedUser()
  const [t, locale, { month }] = await Promise.all([getT(), getLocale(), searchParams])
  const isLandlord = user.profile.role === 'landlord'

  if (!isLandlord) {
    const bills = await listMyBills()
    return (
      <>
        <PageHeader title={t.nav.myBills} />
        <Card>
          {bills.length === 0 ? (
            <p className="text-ink-muted">{t.onboarding.tenantWaiting}</p>
          ) : (
            <ul className="-mx-2 divide-y divide-line">
              {bills.map((b) => (
                <BillRow key={b.id} bill={b} t={t} locale={locale} showTenant={false} />
              ))}
            </ul>
          )}
        </Card>
      </>
    )
  }

  const parsed = periodSchema.safeParse({ period: month })
  const period = parsed.success ? parsed.data.period : monthStart()
  const bills = await listBills(period)
  const due = bills.reduce((s, b) => s + Number(b.amount_due), 0)
  const paid = bills.reduce((s, b) => s + Number(b.amount_paid), 0)

  return (
    <>
      <PageHeader title={t.bills.title} />

      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-2">
        <Link href={`/bills?month=${addMonths(period, -1)}`} className="grid size-10 place-items-center rounded-xl hover:bg-canvas" aria-label="Previous month">
          <ChevronLeftIcon />
        </Link>
        <div className="text-center">
          <p className="font-semibold">{formatMonth(period, locale)}</p>
          <p className="text-sm text-ink-muted">
            {t.bills.paid} {formatTaka(paid, locale)} / {formatTaka(due, locale)}
          </p>
        </div>
        <Link href={`/bills?month=${addMonths(period, 1)}`} className="grid size-10 place-items-center rounded-xl hover:bg-canvas" aria-label="Next month">
          <ChevronRightIcon />
        </Link>
      </div>

      <Card>
        {bills.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-ink-muted">{t.bills.empty}</p>
            <GenerateBillsForm period={period} />
          </div>
        ) : (
          <ul className="-mx-2 divide-y divide-line">
            {bills.map((b) => (
              <BillRow key={b.id} bill={b} t={t} locale={locale} />
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
