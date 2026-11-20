import type { Metadata } from 'next'
import { getEnabledProviders } from '@/lib/auth/providers'
import { getT } from '@/lib/i18n/server'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Login' }

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const [t, providers, { next, error }] = await Promise.all([getT(), getEnabledProviders(), searchParams])
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.auth.welcome}</h1>
        <p className="mt-1 text-ink-muted">{providers.google ? t.auth.subtitle : t.auth.subtitleEmailOnly}</p>
      </div>
      {error && (
        <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {t.auth.callbackError}
        </p>
      )}
      <LoginForm next={typeof next === 'string' ? next : undefined} googleEnabled={providers.google} />
    </div>
  )
}
