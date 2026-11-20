'use client'

import { useActionState } from 'react'
import { FormMessage } from '@/components/ui/card'
import { TextField } from '@/components/ui/field'
import { GoogleIcon } from '@/components/ui/icons'
import { SubmitButton } from '@/components/ui/submit-button'
import { sendEmailOtp, signInWithGoogle } from '@/features/auth/actions'
import { initialState } from '@/lib/actions/result'
import { useI18n } from '@/lib/i18n/client'

export function LoginForm({ next, googleEnabled }: { next?: string; googleEnabled: boolean }) {
  const { t } = useI18n()
  const [state, sendCode] = useActionState(sendEmailOtp, initialState)
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined

  return (
    <div className="flex flex-col gap-5">
      {/* Shown only when Google is enabled in Supabase → Authentication → Providers */}
      {googleEnabled && (
        <>
          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value={next ?? ''} />
            <SubmitButton variant="ghost" size="lg" className="w-full bg-surface" pendingText={t.common.loading}>
              <GoogleIcon /> {t.auth.google}
            </SubmitButton>
          </form>

          <div className="flex items-center gap-3 text-sm text-ink-muted">
            <span className="h-px flex-1 bg-line" /> {t.auth.or} <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form action={sendCode} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next ?? ''} />
        <TextField
          label={t.auth.email}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t.auth.emailPlaceholder}
          required
          error={fieldErrors?.email}
        />
        <FormMessage state={state} />
        <SubmitButton size="lg" pendingText={t.common.loading}>
          {t.auth.sendCode}
        </SubmitButton>
      </form>
    </div>
  )
}
