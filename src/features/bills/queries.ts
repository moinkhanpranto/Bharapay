import 'server-only'

import { createClient } from '@/lib/supabase/server'

const BILL_LIST_COLUMNS =
  'id, period, due_date, amount_due, amount_paid, status, tenants(id, full_name, units(label, properties(name)))' as const

/** Bills of one month. RLS: landlords see theirs, tenants see their own. */
export async function listBills(period: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bills')
    .select(BILL_LIST_COLUMNS)
    .eq('period', period)
    .order('due_date')
  if (error) throw error
  return data
}

/** Every bill the signed-in tenant can see, newest month first. */
export async function listMyBills() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bills')
    .select(BILL_LIST_COLUMNS)
    .order('period', { ascending: false })
    .limit(24)
  if (error) throw error
  return data
}

export async function getBill(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bills')
    .select(
      `id, period, due_date, amount_due, amount_paid, status, note,
       tenants(id, full_name, phone, units(label, properties(name, area))),
       bill_items(id, kind, label, amount, created_at),
       payments(id, amount, method, reference, paid_at, source, verified, receipt_no, voided_at, void_reason, created_at)`,
    )
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    ...data,
    bill_items: [...data.bill_items].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    payments: [...data.payments].sort((a, b) => b.created_at.localeCompare(a.created_at)),
  }
}

/** Landlord dashboard numbers for one month. */
export async function getLandlordSummary(period: string) {
  const supabase = await createClient()
  const [bills, units, properties] = await Promise.all([
    listBills(period),
    supabase.from('units').select('status'),
    supabase.from('properties').select('id', { count: 'exact', head: true }),
  ])
  if (units.error) throw units.error

  const due = bills.reduce((s, b) => s + Number(b.amount_due), 0)
  const collected = bills.reduce((s, b) => s + Number(b.amount_paid), 0)
  return {
    bills,
    unpaid: bills.filter((b) => b.status !== 'paid'),
    due,
    collected,
    outstanding: Math.max(0, due - collected),
    unitCount: units.data.length,
    occupiedCount: units.data.filter((u) => u.status === 'occupied').length,
    propertyCount: properties.count ?? 0,
  }
}
