import type { Metadata } from 'next'
import { BillRow } from '@/components/bills/bill-row'
import { GenerateBillsForm } from '@/components/bills/generate-bills-form'
import { LinkButton } from '@/components/ui/button'
import { Card, CardTitle, EmptyState, PageHeader, StatCard } from '@/components/ui/card'
import { getLandlordSummary, listMyBills } from '@/features/bills/queries'
import { requireOnboardedUser } from '@/lib/auth/session'
import { format } from '@/lib/i18n/config'
import { getLocale, getT } from '@/lib/i18n/server'
import { displayStatus } from '@/lib/utils/bill-status'
import { formatDate, formatMonth, formatNumber, formatTaka, monthStart } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const user = await requireOnboardedUser()
  return user.profile.role === 'landlord' ? <LandlordDashboard name={user.profile.full_name} /> : <TenantDashboard name={user.profile.full_name} />
}

async function LandlordDashboard({ name }: { name: string | null }) {
  const [t, locale] = await Promise.all([getT(), getLocale()])
  const period = monthStart()
  const s = await getLandlordSummary(period)

  if (s.propertyCount === 0) {
    return (
      <>
        <PageHeader title={format(t.dashboard.greeting, { name: name ?? '' })} />
        <EmptyState
          title={t.dashboard.firstRunTitle}
          body={t.dashboard.firstRunBody}
          action={<LinkButton href="/properties/new">{t.properties.add}</LinkButton>}
        />
      </>
    )
  }

  return (
    <>
      <PageHeader title={format(t.dashboard.greeting, { name: name ?? '' })} subtitle={formatMonth(period, locale)} />

      {/* Most important answer first: who hasn't paid */}
      <Card className="mb-5">
        <CardTitle action={<LinkButton href="/bills" variant="ghost" size="sm">{t.common.seeAll}</LinkButton>}>
          {t.dashboard.unpaidList}
        </CardTitle>
        {s.bills.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-ink-muted">{t.dashboard.noBillsYet}</p>
            <GenerateBillsForm period={period} />
          </div>
        ) : s.unpaid.length === 0 ? (
          <p className="rounded-2xl bg-success-soft px-4 py-3 text-success">{t.dashboard.allPaid}</p>
        ) : (
          <ul className="-mx-2 divide-y divide-line">
            {s.unpaid
              .sort((a, b) => (displayStatus(a) === 'overdue' ? -1 : 0) - (displayStatus(b) === 'overdue' ? -1 : 0))
              .map((b) => (
                <BillRow key={b.id} bill={b} t={t} locale={locale} />
              ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t.dashboard.dueThisMonth} value={formatTaka(s.due, locale)} />
        <StatCard label={t.dashboard.collected} value={formatTaka(s.collected, locale)} />
        <StatCard label={t.dashboard.outstanding} value={formatTaka(s.outstanding, locale)} />
        <StatCard
          label={t.dashboard.occupancy}
          value={`${formatNumber(s.occupiedCount, locale)}/${formatNumber(s.unitCount, locale)}`}
        />
      </div>

      {s.bills.length > 0 && (
        <div className="mt-5">
          <GenerateBillsForm period={period} variant="secondary" />
        </div>
      )}
    </>
  )
}

async function TenantDashboard({ name }: { name: string | null }) {
  const [t, locale] = await Promise.all([getT(), getLocale()])
  const bills = await listMyBills()
  const open = bills.filter((b) => b.status !== 'paid')
  const next = open.at(-1) ?? null

  return (
    <>
      <PageHeader title={format(t.dashboard.greeting, { name: name ?? '' })} />
      {bills.length === 0 ? (
        <EmptyState title={t.bills.empty} body={t.onboarding.tenantWaiting} />
      ) : (
        <>
          {next && (
            <Card className="mb-5 border-0 bg-tenant text-white">
              <p className="opacity-90">{next.tenants?.units?.properties?.name} · {next.tenants?.units?.label}</p>
              <p className="mt-2 text-3xl font-bold">{formatTaka(Number(next.amount_due) - Number(next.amount_paid), locale)}</p>
              <p className="opacity-90">{format(t.bills.due, { date: formatDate(next.due_date, locale) })}</p>
              <LinkButton href={`/bills/${next.id}`} variant="secondary" className="mt-4 bg-white text-tenant hover:bg-white/90">
                {t.common.seeAll}
              </LinkButton>
            </Card>
          )}
          <Card>
            <CardTitle>{t.nav.myBills}</CardTitle>
            <ul className="-mx-2 divide-y divide-line">
              {bills.map((b) => (
                <BillRow key={b.id} bill={b} t={t} locale={locale} showTenant={false} />
              ))}
            </ul>
          </Card>
        </>
      )}
    </>
  )
}
