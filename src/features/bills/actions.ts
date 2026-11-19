'use server'

import { revalidatePath } from 'next/cache'
import { fieldErrorsFrom, type ActionState } from '@/lib/actions/result'
import { requireLandlord } from '@/lib/auth/session'
import { format } from '@/lib/i18n/config'
import { getT } from '@/lib/i18n/server'
import { createClient } from '@/lib/supabase/server'
import { billItemSchema, formToObject, idSchema, periodSchema } from '@/lib/validation/schemas'

/** Create the month's bill (rent + service charge) for every active tenant. Idempotent. */
export async function generateBills(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireLandlord()
  const t = await getT()
  const parsed = periodSchema.safeParse({ period: formData.get('period') })
  if (!parsed.success) return { ok: false, error: t.common.somethingWrong }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('generate_monthly_bills', { p_period: parsed.data.period })
  if (error) return { ok: false, error: t.common.somethingWrong }

  revalidatePath('/dashboard')
  revalidatePath('/bills')
  return { ok: true, message: format(t.dashboard.billsGenerated, { count: data ?? 0 }) }
}

/** Add a utility or other charge to a bill (gas, electricity, water…). */
export async function addBillItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireLandlord()
  const t = await getT()
  const parsed = billItemSchema.safeParse(formToObject(formData))
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error.issues) }

  const supabase = await createClient()
  const { error } = await supabase.from('bill_items').insert({ ...parsed.data, landlord_id: user.id })
  if (error) return { ok: false, error: t.common.somethingWrong }

  revalidatePath(`/bills/${parsed.data.bill_id}`)
  return { ok: true }
}

export async function deleteBillItem(formData: FormData) {
  await requireLandlord()
  const parsed = idSchema.safeParse({ id: formData.get('id') })
  const billId = idSchema.safeParse({ id: formData.get('bill_id') })
  if (!parsed.success || !billId.success) return

  const supabase = await createClient()
  await supabase.from('bill_items').delete().eq('id', parsed.data.id)
  revalidatePath(`/bills/${billId.data.id}`)
}
