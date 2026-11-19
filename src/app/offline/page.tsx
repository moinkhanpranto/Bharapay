import { LogoMark } from '@/components/ui/icons'
import { getT } from '@/lib/i18n/server'

export default async function OfflinePage() {
  const t = await getT()
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <LogoMark width={56} height={56} />
      <h1 className="text-2xl font-bold">{t.offline.title}</h1>
      <p className="max-w-sm text-ink-muted">{t.offline.body}</p>
    </main>
  )
}
