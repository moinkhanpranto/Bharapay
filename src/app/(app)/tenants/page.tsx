import type { Metadata } from 'next'
import Link from 'next/link'
import { LinkButton } from '@/components/ui/button'
import { EmptyState, PageHeader } from '@/components/ui/card'
import { ChevronRightIcon, PlusIcon } from '@/components/ui/icons'
import { Pill } from '@/components/ui/status-badge'
import { listTenants } from '@/features/tenants/queries'
import { requireLandlord } from '@/lib/auth/session'
import { getLocale, getT } from '@/lib/i18n/server'
import { formatTaka } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'Tenants' }

export default async function TenantsPage() {
  await requireLandlord()
  const [t, locale, tenants] = await Promise.all([getT(), getLocale(), listTenants()])

  return (
    <>
      <PageHeader
        title={t.tenants.title}
        action={
          <LinkButton href="/tenants/new" size="sm">
            <PlusIcon width={18} height={18} /> {t.tenants.add}
          </LinkButton>
        }
      />
      {tenants.length === 0 ? (
        <EmptyState title={t.tenants.empty} action={<LinkButton href="/tenants/new">{t.tenants.add}</LinkButton>} />
      ) : (
        <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
          {tenants.map((x) => (
            <li key={x.id}>
              <Link href={`/tenants/${x.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-canvas">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand-strong">
                  {x.full_name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{x.full_name}</span>
                  <span className="block truncate text-sm text-ink-muted">
                    {x.units?.properties?.name} · {x.units?.label} · {formatTaka(x.rent_amount, locale)}
                  </span>
                </span>
                {x.status === 'ended' ? <Pill>{t.tenants.ended}</Pill> : x.user_id ? <Pill tone="success">{t.tenants.linked}</Pill> : null}
                <ChevronRightIcon className="text-ink-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
