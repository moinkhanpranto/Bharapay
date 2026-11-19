import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BillRow } from '@/components/bills/bill-row'
import { BackLink } from '@/components/layout/back-link'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, PageHeader } from '@/components/ui/card'
import { Pill } from '@/components/ui/status-badge'
import { endTenancy } from '@/features/tenants/actions'
import { getTenant } from '@/features/tenants/queries'
import { requireLandlord } from '@/lib/auth/session'
import { getLocale, getT } from '@/lib/i18n/server'
import { formatDate, formatTaka } from '@/lib/utils/format'
import { idSchema } from '@/lib/validation/schemas'

export const metadata: Metadata = { title: 'Tenant' }

export default async function TenantPage({ params }: PageProps<'/tenants/[id]'>) {
  await requireLandlord()
  const { id } = await params
  if (!idSchema.safeParse({ id }).success) notFound()
  const [t, locale, tenant] = await Promise.all([getT(), getLocale(), getTenant(id)])
  if (!tenant) notFound()

  const facts: [string, string][] = [
    [t.tenants.unit, `${tenant.units?.properties?.name ?? ''} · ${tenant.units?.label ?? ''}`],
    [t.tenants.phone, tenant.phone ?? '—'],
    [t.tenants.email, tenant.email ?? '—'],
    [t.tenants.rent, formatTaka(tenant.rent_amount, locale)],
    [t.tenants.serviceCharge, formatTaka(tenant.service_charge, locale)],
    [t.tenants.dueDay, String(tenant.due_day)],
    [t.tenants.deposit, formatTaka(tenant.deposit_amount, locale)],
    [t.tenants.moveIn, formatDate(tenant.move_in_date, locale)],
  ]

  const billRows = tenant.bills.map((b) => ({ ...b, tenants: { full_name: tenant.full_name, units: tenant.units } }))

  return (
    <>
      <PageHeader
        title={tenant.full_name}
        back={<BackLink href="/tenants" label={t.tenants.title} />}
        action={
          <div className="flex gap-2">
            {tenant.status === 'ended' ? <Pill>{t.tenants.ended}</Pill> : <Pill tone="success">{t.tenants.active}</Pill>}
            <Pill tone={tenant.user_id ? 'brand' : 'muted'}>{tenant.user_id ? t.tenants.linked : t.tenants.notLinked}</Pill>
          </div>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Card>
          <dl className="grid gap-3">
            {facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-line pb-2 last:border-0">
                <dt className="text-ink-muted">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          {tenant.notes && <p className="mt-4 rounded-2xl bg-canvas p-3 text-sm">{tenant.notes}</p>}
          {tenant.status === 'active' && (
            <form action={endTenancy} className="mt-5">
              <input type="hidden" name="id" value={tenant.id} />
              <Button variant="danger" className="w-full">
                {t.tenants.endTenancy}
              </Button>
            </form>
          )}
        </Card>
        <Card>
          <CardTitle>{t.tenants.bills}</CardTitle>
          {billRows.length === 0 ? (
            <p className="text-ink-muted">{t.bills.empty}</p>
          ) : (
            <ul className="-mx-2 divide-y divide-line">
              {billRows.map((b) => (
                <BillRow key={b.id} bill={b} t={t} locale={locale} showTenant={false} />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
