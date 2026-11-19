'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { FormMessage } from '@/components/ui/card'
import { ChoiceChips, SelectField, TextField } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import { addBillItem } from '@/features/bills/actions'
import { recordPayment, startOnlinePayment, voidPayment } from '@/features/payments/actions'
import { initialState } from '@/lib/actions/result'
import { useI18n } from '@/lib/i18n/client'

/** Landlord: add gas / electricity / water / other to this bill. */
export function AddChargeForm({ billId }: { billId: string }) {
  const { t } = useI18n()
  const [state, action] = useActionState(addBillItem, initialState)
  const ref = useRef<HTMLFormElement>(null)
  const e = state && !state.ok ? state.fieldErrors : undefined
  useEffect(() => {
    if (state?.ok) ref.current?.reset()
  }, [state])

  const kinds = ['gas', 'electricity', 'water', 'service', 'other', 'rent'] as const
  return (
    <form ref={ref} action={action} className="mt-4 grid gap-3 rounded-2xl bg-canvas p-3 sm:grid-cols-[1fr_1fr_120px_auto] sm:items-end">
      <input type="hidden" name="bill_id" value={billId} />
      <SelectField label={t.bills.addCharge} name="kind" error={e?.kind}>
        {kinds.map((k) => (
          <option key={k} value={k}>
            {t.bills.chargeKind[k]}
          </option>
        ))}
      </SelectField>
      <TextField label={t.bills.chargeLabel} name="label" required maxLength={60} placeholder="Nov meter" error={e?.label} />
      <TextField label={t.bills.amount} name="amount" type="number" inputMode="decimal" min={1} step="0.01" required error={e?.amount} />
      <SubmitButton variant="secondary" pendingText="…">
        {t.common.add}
      </SubmitButton>
    </form>
  )
}

/** Landlord: record cash / bKash / bank money received outside the app. */
export function RecordPaymentForm({ billId, left, today }: { billId: string; left: number; today: string }) {
  const { t } = useI18n()
  const [state, action] = useActionState(recordPayment, initialState)
  const e = state && !state.ok ? state.fieldErrors : undefined
  const methods = (['cash', 'bkash', 'nagad', 'rocket', 'bank'] as const).map((m) => ({ value: m, label: t.payments.methods[m] }))

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="bill_id" value={billId} />
      <TextField label={t.payments.amount} name="amount" type="number" inputMode="decimal" min={1} step="0.01" defaultValue={left} required error={e?.amount} />
      <TextField label={t.payments.date} name="paid_at" type="date" defaultValue={today} max={today} required error={e?.paid_at} />
      <ChoiceChips label={t.payments.method} name="method" options={methods} defaultValue="cash" />
      <TextField label={t.payments.reference} name="reference" maxLength={60} optionalLabel={t.common.optional} error={e?.reference} />
      <p className="rounded-2xl bg-warning-soft px-4 py-3 text-sm text-warning">{t.payments.manualNote}</p>
      <FormMessage state={state} />
      <SubmitButton size="lg" pendingText={t.common.loading}>
        {t.payments.record}
      </SubmitButton>
    </form>
  )
}

/** Landlord: cancel a wrong manual payment (kept in history with a reason). */
export function VoidPaymentForm({ paymentId }: { paymentId: string }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [state, action] = useActionState(voidPayment, initialState)

  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="self-start text-sm text-danger hover:underline">
        {t.payments.void}
      </button>
    )

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="payment_id" value={paymentId} />
      <div className="min-w-48 flex-1">
        <TextField label={t.payments.voidReason} name="reason" required maxLength={200} />
      </div>
      <SubmitButton variant="danger" pendingText="…">
        {t.payments.void}
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  )
}

/** Tenant: start the (currently mock) online payment. */
export function PayOnlineForm({ billId, label }: { billId: string; label: string }) {
  const { t } = useI18n()
  const [state, action] = useActionState(startOnlinePayment, initialState)
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="bill_id" value={billId} />
      <SubmitButton variant="tenant" size="lg" pendingText={t.common.loading}>
        {label}
      </SubmitButton>
      <p className="text-center text-sm text-ink-muted">bKash · Nagad · Card</p>
      <FormMessage state={state} />
    </form>
  )
}
