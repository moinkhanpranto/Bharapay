import type { Metadata } from 'next'
import Link from 'next/link'
import { LinkButton } from '@/components/ui/button'
import { EmptyState, PageHeader } from '@/components/ui/card'
import { BuildingIcon, ChevronRightIcon, PlusIcon } from '@/components/ui/icons'
import { listProperties } from '@/features/properties/queries'
import { requireLandlord } from '@/lib/auth/session'
import { format } from '@/lib/i18n/config'
import { getLocale, getT } from '@/lib/i18n/server'
import { formatNumber } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'Properties' }

export default async function PropertiesPage() {
  await requireLandlord()
  const [t, locale, properties] = await Promise.all([getT(), getLocale(), listProperties()])

  return (
    <>
      <PageHeader
        title={t.properties.title}
        action={
          <LinkButton href="/properties/new" size="sm">
            <PlusIcon width={18} height={18} /> {t.properties.add}
          </LinkButton>
        }
      />
      {properties.length === 0 ? (
        <EmptyState title={t.properties.empty} body={t.dashboard.firstRunBody} action={<LinkButton href="/properties/new">{t.properties.add}</LinkButton>} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {properties.map((p) => (
            <li key={p.id}>
              <Link href={`/properties/${p.id}`} className="flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 hover:border-brand">
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
                  <BuildingIcon />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-semibold">{p.name}</span>
                  <span className="block text-sm text-ink-muted">
                    {[p.area, p.city].filter(Boolean).join(', ')} · {format(t.properties.flatCount, { count: formatNumber(p.unitCount, locale) })} ·{' '}
                    {formatNumber(p.occupiedCount, locale)} {t.properties.occupied}
                  </span>
                </span>
                <ChevronRightIcon className="text-ink-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
