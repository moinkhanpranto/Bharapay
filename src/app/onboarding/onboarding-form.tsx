'use client'

import { useActionState } from 'react'
import { FormMessage } from '@/components/ui/card'
import { TextField } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import { completeOnboarding } from '@/features/account/actions'
import { initialState } from '@/lib/actions/result'
import { useI18n } from '@/lib/i18n/client'

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const { t } = useI18n()
  const [state, action] = useActionState(completeOnboarding, initialState)
  const errors = state && !state.ok ? state.fieldErrors : undefined

  const roles = [
    { value: 'landlord', title: t.onboarding.landlord, hint: t.onboarding.landlordHint },
    { value: 'tenant', title: t.onboarding.tenant, hint: t.onboarding.tenantHint },
  ]

  return (
    <form action={action} className="flex flex-col gap-5">
      <fieldset className="grid gap-3">
        {roles.map((r, i) => (
          <label key={r.value} className="cursor-pointer">
            <input type="radio" name="role" value={r.value} defaultChecked={i === 0} className="peer sr-only" />
            <span className="flex flex-col rounded-2xl border-2 border-line bg-surface p-4 peer-checked:border-brand peer-checked:bg-brand-soft peer-focus-visible:ring-4 peer-focus-visible:ring-brand/20">
              <span className="text-lg font-semibold">{r.title}</span>
              <span className="text-sm text-ink-muted">{r.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <TextField label={t.onboarding.fullName} name="full_name" defaultValue={defaultName} autoComplete="name" required error={errors?.full_name} />
      <TextField
        label={t.onboarding.phone}
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={t.onboarding.phoneHint}
        optionalLabel={t.common.optional}
        error={errors?.phone}
      />
      <FormMessage state={state} />
      <SubmitButton size="lg" pendingText={t.common.loading}>
        {t.onboarding.continue}
      </SubmitButton>
    </form>
  )
}
