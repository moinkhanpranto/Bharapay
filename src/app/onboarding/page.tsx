import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LogoIcon } from '@/components/brand/logo'
import { requireUser } from '@/lib/auth/session'
import { getT } from '@/lib/i18n/server'
import { OnboardingForm } from './onboarding-form'

export const metadata: Metadata = { title: 'Setup' }

export default async function OnboardingPage() {
  const user = await requireUser()
  if (user.profile.role) redirect('/dashboard')
  const t = await getT()

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5 py-10">
      <LogoIcon size={48} />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.onboarding.title}</h1>
        <p className="mt-1 text-ink-muted">{t.onboarding.subtitle}</p>
      </div>
      <OnboardingForm defaultName={user.profile.full_name ?? ''} />
    </main>
  )
}
