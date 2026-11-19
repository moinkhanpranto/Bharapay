'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { fieldErrorsFrom, type ActionState } from '@/lib/actions/result'
import { requireLandlord, requireTenant } from '@/lib/auth/session'
import { publicEnv } from '@/lib/env'
import { getT } from '@/lib/i18n/server'
import { activeProvider } from '@/lib/payments'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { formToObject, idSchema, recordPaymentSchema, voidPaymentSchema } from '@/lib/validation/schemas'

/**
 * Landlord records money received outside the app (cash, bKash send-money…).
 * Saved as source=manual, verified=false — RLS rejects anything else.
 */
export async function recordPayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireLandlord()
  const t = await getT()
  const parsed = recordPaymentSchema.safeParse(formToObject(formData))
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error.issues) }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .insert({ ...parsed.data, landlord_id: user.id, source: 'manual', verified: false })
    .select('id')
    .single()
  if (error || !data) return { ok: false, error: t.common.somethingWrong }

  revalidatePath(`/bills/${parsed.data.bill_id}`)
  revalidatePath('/dashboard')
  redirect(`/receipts/${data.id}`)
}

/** Corrections never edit history: the landlord voids a manual payment with a reason. */
export async function voidPayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireLandlord()
  const t = await getT()
  const parsed = voidPaymentSchema.safeParse(formToObject(formData))
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error.issues) }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .update({ voided_at: new Date().toISOString(), void_reason: parsed.data.reason })
    .eq('id', parsed.data.payment_id)
    .select('bill_id')
    .single()
  if (error || !data) return { ok: false, error: t.common.somethingWrong }

  revalidatePath(`/bills/${data.bill_id}`)
  revalidatePath('/dashboard')
  return { ok: true }
}

/**
 * Tenant pays a bill online.
 *   1. DB creates the intent and computes the amount (create_payment_intent)
 *   2. the active gateway adapter creates a checkout session
 *   3. we store the gateway reference and send the tenant to the gateway
 * The bill is only marked paid later, by the VERIFIED webhook.
 */
export async function startOnlinePayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireTenant()
  const t = await getT()
  const parsed = idSchema.safeParse({ id: formData.get('bill_id') })
  if (!parsed.success) return { ok: false, error: t.common.somethingWrong }

  const provider = activeProvider()
  const supabase = await createClient()
  const { data: intent, error } = await supabase.rpc('create_payment_intent', {
    p_bill_id: parsed.data.id,
    p_provider: provider.name,
  })
  if (error || !intent) {
    if (error?.message.includes('rate_limited')) return { ok: false, error: t.payments.rateLimited }
    if (error?.message.includes('nothing_due')) return { ok: false, error: t.bills.nothingDue }
    return { ok: false, error: t.common.somethingWrong }
  }

  let redirectUrl: string
  try {
    const session = await provider.createCheckout({
      intentId: intent.id,
      amount: Number(intent.amount),
      currency: 'BDT',
      billId: intent.bill_id,
      customer: { name: user.profile.full_name, email: user.email, phone: user.profile.phone },
      returnUrl: new URL(`/payments/${intent.id}`, publicEnv.NEXT_PUBLIC_SITE_URL).toString(),
      webhookUrl: new URL(`/api/payments/webhook/${provider.name}`, publicEnv.NEXT_PUBLIC_SITE_URL).toString(),
    })
    // intents are read-only for users; only trusted server code may write them
    await createAdminClient().from('payment_intents').update({ provider_ref: session.providerRef }).eq('id', intent.id)
    redirectUrl = session.redirectUrl
  } catch (err) {
    console.error('[payments] createCheckout failed', { intentId: intent.id, err })
    return { ok: false, error: t.common.somethingWrong }
  }

  redirect(redirectUrl)
}
