import type { Metadata } from 'next'
import { BackLink } from '@/components/layout/back-link'
import { LinkButton } from '@/components/ui/button'
import { Card, EmptyState, PageHeader } from '@/components/ui/card'
import { listVacantUnits } from '@/features/properties/queries'
import { requireLandlord } from '@/lib/auth/session'
import { getT } from '@/lib/i18n/server'
import { todayISO } from '@/lib/utils/format'
import { TenantForm } from './tenant-form'

export const metadata: Metadata = { title: 'Add tenant' }

export default async function NewTenantPage({ searchParams }: PageProps<'/tenants/new'>) {
  await requireLandlord()
  const [t, units, { unit }] = await Promise.all([getT(), listVacantUnits(), searchParams])

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t.tenants.add} back={<BackLink href="/tenants" label={t.common.back} />} />
      {units.length === 0 ? (
        <EmptyState title={t.tenants.noVacantUnits} action={<LinkButton href="/properties">{t.properties.title}</LinkButton>} />
      ) : (
        <Card>
          <TenantForm
            units={units.map((u) => ({ id: u.id, label: `${u.properties?.name ?? ''} · ${u.label}`, rent: u.default_rent }))}
            defaultUnitId={typeof unit === 'string' ? unit : undefined}
            today={todayISO()}
          />
        </Card>
      )}
    </div>
  )
}
