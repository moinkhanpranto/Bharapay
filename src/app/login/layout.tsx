import Link from 'next/link'
import { LanguageSwitch } from '@/components/layout/language-switch'
import { Logo } from '@/components/brand/logo'
import { ShieldIcon } from '@/components/ui/icons'
import { getLocale, getT } from '@/lib/i18n/server'

/** Centered card layout shared by /login and /login/verify. */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const [t, locale] = await Promise.all([getT(), getLocale()])
  return (
    <main className="flex min-h-dvh flex-col px-5 py-6">
      <header className="mx-auto flex w-full max-w-md items-center justify-between">
        <Link href="/" aria-label="BharaPay">
          <Logo height={32} />
        </Link>
        <LanguageSwitch locale={locale} />
      </header>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
      <p className="mx-auto flex max-w-md items-center gap-2 text-sm text-ink-muted">
        <ShieldIcon width={18} height={18} /> {t.common.privacyNote}
      </p>
    </main>
  )
}
