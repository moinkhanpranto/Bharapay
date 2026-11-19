'use client'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/client'

/** Friendly fallback for unexpected errors. Details stay in server logs, not on screen. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n()
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold">{t.common.somethingWrong}</h1>
      <Button onClick={reset}>{t.common.back}</Button>
    </main>
  )
}
