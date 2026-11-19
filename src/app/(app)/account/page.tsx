import type { Metadata } from 'next'
import { LanguageSwitch } from '@/components/layout/language-switch'
import { InstallButton } from '@/components/pwa/install-button'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, PageHeader } from '@/components/ui/card'
import { signOut } from '@/features/auth/actions'
import { requireOnboardedUser } from '@/lib/auth/session'
import { getLocale, getT } from '@/lib/i18n/server'
import { ProfileForm } from './profile-form'

export const metadata: Metadata = { title: 'Account' }

export default async function AccountPage() {
  const user = await requireOnboardedUser()
  const [t, locale] = await Promise.all([getT(), getLocale()])

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <PageHeader title={t.account.title} subtitle={`${user.email ?? ''} · ${t.account.role[user.profile.role]}`} />
      <Card>
        <CardTitle>{t.account.profile}</CardTitle>
        <ProfileForm fullName={user.profile.full_name ?? ''} phone={user.profile.phone ?? ''} />
      </Card>
      <Card>
        <CardTitle>{t.account.language}</CardTitle>
        <LanguageSwitch locale={locale} />
      </Card>
      <InstallButton />
      <form action={signOut}>
        <Button variant="danger" className="w-full">
          {t.auth.signOut}
        </Button>
      </form>
      <p className="text-center text-sm text-ink-muted">{t.common.privacyNote}</p>
    </div>
  )
}
