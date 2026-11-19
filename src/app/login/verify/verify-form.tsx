'use client'

import Link from 'next/link'
import { useActionState, useTransition } from 'react'
import { FormMessage } from '@/components/ui/card'
import { TextField } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import { resendEmailOtp, verifyEmailOtp } from '@/features/auth/actions'
import { initialState, type ActionState } from '@/lib/actions/result'
import { useI18n } from '@/lib/i18n/client'
import { useState } from 'react'

export function VerifyForm() {
  const { t } = useI18n()
  const [state, verify] = useActionState(verifyEmailOtp, initialState)
  const [resendState, setResendState] = useState<ActionState>(null)
  const [resending, startResend] = useTransition()
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined

  return (
    <div className="flex flex-col gap-5">
      <form action={verify} className="flex flex-col gap-4">
        <TextField
          label={t.auth.code}
          name="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6,8}"
          maxLength={8}
          placeholder="••••••"
          autoFocus
          required
          className="h-14 text-center text-2xl tracking-[0.5em]"
          error={fieldErrors?.token}
        />
        <FormMessage state={state} />
        <SubmitButton size="lg" pendingText={t.common.loading}>
          {t.auth.verify}
        </SubmitButton>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <button
          type="button"
          disabled={resending}
          onClick={() => startResend(async () => setResendState(await resendEmailOtp()))}
          className="font-medium text-brand-strong disabled:opacity-60"
        >
          {t.auth.resend}
        </button>
        <Link href="/login" className="text-ink-muted underline-offset-4 hover:underline">
          {t.auth.changeEmail}
        </Link>
      </div>
      {resendState && !resendState.ok && <FormMessage state={resendState} />}
    </div>
  )
}
