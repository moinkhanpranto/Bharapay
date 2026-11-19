import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BackLink } from '@/components/layout/back-link'
import { LinkButton } from '@/components/ui/button'
import { Card, CardTitle, PageHeader } from '@/components/ui/card'
import { Pill } from '@/components/ui/status-badge'
import { getProperty } from '@/features/properties/queries'
import { requireLandlord } from '@/lib/auth/session'
import { getLocale, getT } from '@/lib/i18n/server'
import { formatTaka } from '@/lib/utils/format'
import { idSchema } from '@/lib/validation/schemas'
import { UnitForm } from './unit-form'

export const metadata: Metadata = { title: 'Property' }

export default async function PropertyPage({ params }: PageProps<'/properties/[id]'>) {
  await requireLandlord()
  const { id } = await params
  if (!idSchema.safeParse({ id }).success) notFound()

  const [t, locale, property] = await Promise.all([getT(), getLocale(), getProperty(id)])
  if (!property) notFound()

  return (
    <>
      <PageHeader
        title={property.name}
        subtitle={[property.area, property.address, property.city].filter(Boolean).join(', ')}
        back={<BackLink href="/properties" label={t.properties.title} />}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardTitle>{t.properties.units}</CardTitle>
          {property.units.length === 0 ? (
            <p className="text-ink-muted">{t.properties.noUnits}</p>
          ) : (
            <ul className="-mx-2 divide-y divide-line">
              {property.units.map((u) => {
                const tenant = u.tenants.find((x) => x.status === 'active')
                return (
                  <li key={u.id} className="flex items-center gap-3 px-2 py-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-canvas font-bold">{u.label}</span>
                    <span className="min-w-0 flex-1">
                      {tenant ? (
                        <Link href={`/tenants/${tenant.id}`} className="block truncate font-semibold hover:underline">
                          {tenant.full_name}
                        </Link>
                      ) : (
                        <span className="block text-ink-muted">—</span>
                      )}
                      <span className="block text-sm text-ink-muted">
                        {u.floor ? `${t.properties.floor} ${u.floor} · ` : ''}
                        {u.default_rent ? formatTaka(u.default_rent, locale) : ''}
                      </span>
                    </span>
                    {u.status === 'occupied' ? (
                      <Pill tone="success">{t.properties.occupied}</Pill>
                    ) : (
                      <LinkButton href={`/tenants/new?unit=${u.id}`} variant="secondary" size="sm">
                        {t.tenants.add}
                      </LinkButton>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle>{t.properties.addUnit}</CardTitle>
          <UnitForm propertyId={property.id} />
        </Card>
      </div>
    </>
  )
}
