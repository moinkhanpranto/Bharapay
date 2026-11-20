import { redirect } from 'next/navigation'
import { LanguageSwitch } from '@/components/layout/language-switch'
import { LinkButton } from '@/components/ui/button'
import { Logo } from '@/components/brand/logo'
import { ShieldIcon } from '@/components/ui/icons'
import { getCurrentUser } from '@/lib/auth/session'
import { getLocale, getT } from '@/lib/i18n/server'

export default async function LandingPage() {
  if (await getCurrentUser()) redirect('/dashboard')
  const [t, locale] = await Promise.all([getT(), getLocale()])

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col px-5 py-6">
      <header className="flex items-center justify-between">
        <Logo height={34} />
        <LanguageSwitch locale={locale} />
      </header>

      <section className="flex flex-1 flex-col justify-center gap-6 py-12 md:max-w-2xl">
        <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">{t.landing.title}</h1>
        <p className="text-lg text-ink-muted">{t.landing.body}</p>
        <ul className="flex flex-col gap-2 text-base">
          {[t.landing.point1, t.landing.point2, t.landing.point3].map((p) => (
            <li key={p} className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full bg-success-soft text-success">✓</span>
              {p}
            </li>
          ))}
        </ul>
        <div>
          <LinkButton href="/login" size="lg">
            {t.landing.cta}
          </LinkButton>
        </div>
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <ShieldIcon width={18} height={18} /> {t.common.privacyNote}
        </p>
      </section>
    </main>
  )
}
