import { AppShell } from '@/components/layout/app-shell'
import { requireOnboardedUser } from '@/lib/auth/session'

/** Every page in (app)/ needs a signed-in, onboarded user. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOnboardedUser()
  return (
    <AppShell role={user.profile.role} name={user.profile.full_name ?? user.email ?? ''}>
      {children}
    </AppShell>
  )
}
