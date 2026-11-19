'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/client'

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

/**
 * "Install app" button for Android/Chrome/Edge. Hidden when the app is
 * already installed or the browser doesn't support the prompt (iPhone users
 * use Share → Add to Home Screen).
 */
export function InstallButton() {
  const { t } = useI18n()
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPromptEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (!promptEvent) return null

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink-muted">{t.account.installHint}</p>
      <Button
        variant="secondary"
        onClick={async () => {
          await promptEvent.prompt()
          await promptEvent.userChoice
          setPromptEvent(null)
        }}
      >
        {t.account.installApp}
      </Button>
    </div>
  )
}
