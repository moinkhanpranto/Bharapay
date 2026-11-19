import 'server-only'

import { createClient } from '@/lib/supabase/server'

export async function listTenants() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('id, full_name, phone, rent_amount, status, user_id, units(label, properties(name))')
    .order('status', { ascending: true })
    .order('full_name')
  if (error) throw error
  return data
}

export async function getTenant(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tenants')
    .select(
      'id, full_name, phone, email, move_in_date, move_out_date, rent_amount, service_charge, due_day, deposit_amount, status, notes, user_id, units(label, properties(id, name)), bills(id, period, due_date, amount_due, amount_paid, status)',
    )
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { ...data, bills: [...data.bills].sort((a, b) => b.period.localeCompare(a.period)) }
}
