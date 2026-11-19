'use client'

import { useActionState, useState } from 'react'
import { FormMessage } from '@/components/ui/card'
import { ChoiceChips, SelectField, TextAreaField, TextField } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import { createTenant } from '@/features/tenants/actions'
import { initialState } from '@/lib/actions/result'
import { useI18n } from '@/lib/i18n/client'

type UnitOption = { id: string; label: string; rent: number | null }

export function TenantForm({ units, defaultUnitId, today }: { units: UnitOption[]; defaultUnitId?: string; today: string }) {
  const { t } = useI18n()
  const [state, action] = useActionState(createTenant, initialState)
  const e = state && !state.ok ? state.fieldErrors : undefined
  const initialUnit = units.find((u) => u.id === defaultUnitId) ?? units[0]
  const [rent, setRent] = useState(initialUnit?.rent ? String(initialUnit.rent) : '')

  return (
    <form action={action} className="flex flex-col gap-4">
      <SelectField
        label={t.tenants.unit}
        name="unit_id"
        defaultValue={initialUnit?.id}
        error={e?.unit_id}
        onChange={(ev) => {
          const u = units.find((x) => x.id === ev.target.value)
          if (u?.rent) setRent(String(u.rent))
        }}
      >
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.label}
          </option>
        ))}
      </SelectField>

      <TextField label={t.tenants.fullName} name="full_name" required maxLength={120} autoComplete="off" error={e?.full_name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t.tenants.phone} name="phone" type="tel" inputMode="tel" placeholder="01XXXXXXXXX" optionalLabel={t.common.optional} error={e?.phone} />
        <TextField label={t.tenants.email} name="email" type="email" inputMode="email" optionalLabel={t.common.optional} hint={t.tenants.emailHint} error={e?.email} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t.tenants.rent}
          name="rent_amount"
          type="number"
          inputMode="decimal"
          min={1}
          step="0.01"
          required
          value={rent}
          onChange={(ev) => setRent(ev.target.value)}
          error={e?.rent_amount}
        />
        <TextField label={t.tenants.serviceCharge} name="service_charge" type="number" inputMode="decimal" min={0} step="0.01" defaultValue="0" error={e?.service_charge} />
      </div>

      <ChoiceChips
        label={t.tenants.dueDay}
        name="due_day"
        defaultValue="5"
        options={['1', '5', '7', '10', '15'].map((d) => ({ value: d, label: d }))}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t.tenants.moveIn} name="move_in_date" type="date" defaultValue={today} required error={e?.move_in_date} />
        <TextField label={t.tenants.deposit} name="deposit_amount" type="number" inputMode="decimal" min={0} step="0.01" defaultValue="0" error={e?.deposit_amount} />
      </div>

      <TextAreaField label={t.tenants.notes} name="notes" optionalLabel={t.common.optional} maxLength={500} error={e?.notes} />
      <FormMessage state={state} />
      <SubmitButton size="lg" pendingText={t.common.loading}>
        {t.common.save}
      </SubmitButton>
    </form>
  )
}
