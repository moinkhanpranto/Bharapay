import 'server-only'

import { createClient } from '@/lib/supabase/server'

/** All of the landlord's properties with flat counts. RLS limits rows to the owner. */
export async function listProperties() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('properties')
    .select('id, name, area, city, units(id, status)')
    .is('archived_at', null)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data.map((p) => ({
    ...p,
    unitCount: p.units.length,
    occupiedCount: p.units.filter((u) => u.status === 'occupied').length,
  }))
}

export async function getProperty(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('properties')
    .select('id, name, address, area, city, units(id, label, floor, default_rent, status, tenants(id, full_name, status))')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    ...data,
    units: [...data.units].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })),
  }
}

/** Vacant flats for the "Add tenant" form. */
export async function listVacantUnits() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('units')
    .select('id, label, default_rent, properties(name)')
    .eq('status', 'vacant')
    .order('label')
  if (error) throw error
  return data
}
