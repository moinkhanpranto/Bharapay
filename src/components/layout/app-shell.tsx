'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { BuildingIcon, HomeIcon, LogoMark, ReceiptIcon, UserIcon, UsersIcon } from '@/components/ui/icons'
import { useI18n } from '@/lib/i18n/client'
import { cn } from '@/lib/utils/cn'

type Role = 'landlord' | 'tenant'

function useNavItems(role: Role) {
  const { t } = useI18n()
  return role === 'landlord'
    ? [
        { href: '/dashboard', label: t.nav.home, Icon: HomeIcon },
        { href: '/properties', label: t.nav.properties, Icon: BuildingIcon },
        { href: '/tenants', label: t.nav.tenants, Icon: UsersIcon },
        { href: '/bills', label: t.nav.bills, Icon: ReceiptIcon },
        { href: '/account', label: t.nav.account, Icon: UserIcon },
      ]
    : [
        { href: '/dashboard', label: t.nav.home, Icon: HomeIcon },
        { href: '/bills', label: t.nav.myBills, Icon: ReceiptIcon },
        { href: '/account', label: t.nav.account, Icon: UserIcon },
      ]
}

/**
 * Responsive app frame:
 *  - phone/tablet (< lg): content + fixed bottom tab bar
 *  - desktop (≥ lg): left sidebar + content
 */
export function AppShell({ role, name, children }: { role: Role; name: string; children: ReactNode }) {
  const pathname = usePathname()
  const items = useNavItems(role)
  const { t } = useI18n()
  const accent = role === 'tenant' ? 'text-tenant bg-tenant-soft' : 'text-brand-strong bg-brand-soft'
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="no-print hidden w-64 shrink-0 flex-col border-r border-line bg-surface p-5 lg:flex">
        <Link href="/dashboard" className="mb-8 flex items-center gap-2.5 text-xl font-bold">
          <LogoMark /> {t.app.name}
        </Link>
        <nav className="flex flex-col gap-1" aria-label="Main">
          {items.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={cn(
                'flex h-11 items-center gap-3 rounded-xl px-3 font-medium text-ink-muted hover:bg-canvas',
                isActive(href) && accent,
              )}
            >
              <Icon /> {label}
            </Link>
          ))}
        </nav>
        <p className="mt-auto truncate rounded-xl bg-canvas px-3 py-2 text-sm">
          <span className="block font-semibold text-ink">{name}</span>
          <span className="text-ink-muted">{t.account.role[role]}</span>
        </p>
      </aside>

      <main className="mx-auto w-full max-w-5xl px-4 pt-5 pb-28 sm:px-6 lg:px-10 lg:pt-8 lg:pb-12">{children}</main>

      <nav
        aria-label="Main"
        className="no-print safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
      >
        <ul className="mx-auto flex max-w-md justify-around px-2 pt-1.5">
          {items.map(({ href, label, Icon }) => (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-xs font-medium text-ink-muted',
                  isActive(href) && (role === 'tenant' ? 'text-tenant' : 'text-brand-strong'),
                )}
              >
                <span className={cn('rounded-full px-4 py-1', isActive(href) && accent)}>
                  <Icon />
                </span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
