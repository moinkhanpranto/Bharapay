'use client'

import { useActionState } from 'react'
import { FormMessage } from '@/components/ui/card'
import { TextField } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import { createProperty } from '@/features/properties/actions'
import { initialState } from '@/lib/actions/result'
import { useI18n } from '@/lib/i18n/client'

export function PropertyForm() {
  const { t } = useI18n()
  const [state, action] = useActionState(createProperty, initialState)
  const e = state && !state.ok ? state.fieldErrors : undefined
  return (
    <form action={action} className="flex flex-col gap-4">
      <TextField label={t.properties.name} name="name" placeholder={t.properties.namePlaceholder} required maxLength={120} error={e?.name} />
      <TextField label={t.properties.area} name="area" placeholder={t.properties.areaPlaceholder} optionalLabel={t.common.optional} maxLength={80} error={e?.area} />
      <TextField label={t.properties.address} name="address" optionalLabel={t.common.optional} maxLength={300} error={e?.address} />
      <TextField label={t.properties.city} name="city" defaultValue="Dhaka" required maxLength={60} error={e?.city} />
      <FormMessage state={state} />
      <SubmitButton pendingText={t.common.loading}>{t.common.save}</SubmitButton>
    </form>
  )
}
