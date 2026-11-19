'use client'

import { useActionState } from 'react'
import { FormMessage } from '@/components/ui/card'
import { TextField } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import { updateProfile } from '@/features/account/actions'
import { initialState } from '@/lib/actions/result'
import { useI18n } from '@/lib/i18n/client'

export function ProfileForm({ fullName, phone }: { fullName: string; phone: string }) {
  const { t } = useI18n()
  const [state, action] = useActionState(updateProfile, initialState)
  const e = state && !state.ok ? state.fieldErrors : undefined
  return (
    <form action={action} className="flex flex-col gap-4">
      <TextField label={t.onboarding.fullName} name="full_name" defaultValue={fullName} required maxLength={120} error={e?.full_name} />
      <TextField label={t.onboarding.phone} name="phone" type="tel" defaultValue={phone} optionalLabel={t.common.optional} error={e?.phone} />
      <FormMessage state={state} />
      <SubmitButton variant="secondary" pendingText={t.common.loading}>
        {t.common.save}
      </SubmitButton>
    </form>
  )
}
