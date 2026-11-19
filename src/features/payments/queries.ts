import 'server-only'

import { createClient } from '@/lib/supabase/server'

/** Data for a printable receipt. RLS: the landlord or that tenant only. */
export async function getReceipt(paymentId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select(
      `id, amount, method, reference, paid_at, source, verified, receipt_no, voided_at, created_at,
       bills(id, period),
       tenants(full_name, phone, units(label, properties(name, area, landlord_id)))`,
    )
    .eq('id', paymentId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Status of an online payment attempt, for the return page. */
export async function getIntent(intentId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payment_intents')
    .select('id, bill_id, amount, status, failure_reason, payments(id)')
    .eq('id', intentId)
    .maybeSingle()
  if (error) throw error
  return data
}
