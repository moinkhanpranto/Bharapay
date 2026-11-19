'use client'

import { useActionState, useEffect, useRef } from 'react'
import { TextField } from '@/components/ui/field'
import { FormMessage } from '@/components/ui/card'
import { SubmitButton } from '@/components/ui/submit-button'
import { createUnit } from '@/features/properties/actions'
import { initialState } from '@/lib/actions/result'
import { useI18n } from '@/lib/i18n/client'

export function UnitForm({ propertyId }: { propertyId: string }) {
  const { t } = useI18n()
  const [state, action] = useActionState(createUnit, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const e = state && !state.ok ? state.fieldErrors : undefined

  // clear the form after a flat was added, ready for the next one
  useEffect(() => {
    if (state?.ok) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <input type="hidden" name="property_id" value={propertyId} />
      <TextField label={t.properties.unitLabel} name="label" placeholder={t.properties.unitLabelPlaceholder} required maxLength={40} error={e?.label} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t.properties.floor} name="floor" optionalLabel={t.common.optional} maxLength={20} error={e?.floor} />
        <TextField
          label={t.properties.defaultRent}
          name="default_rent"
          inputMode="decimal"
          type="number"
          min={0}
          step="0.01"
          optionalLabel={t.common.optional}
          error={e?.default_rent}
        />
      </div>
      {state && !state.ok && <FormMessage state={state} />}
      <SubmitButton variant="secondary" pendingText={t.common.loading}>
        {t.properties.addUnit}
      </SubmitButton>
    </form>
  )
}
