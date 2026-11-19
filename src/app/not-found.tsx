import { LinkButton } from '@/components/ui/button'
import { getT } from '@/lib/i18n/server'

export default async function NotFound() {
  const t = await getT()
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-6xl font-bold text-brand">404</p>
      <h1 className="text-2xl font-bold">{t.common.notFound}</h1>
      <LinkButton href="/dashboard">{t.nav.home}</LinkButton>
    </main>
  )
}
