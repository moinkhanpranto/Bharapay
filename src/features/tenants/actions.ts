'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { fieldErrorsFrom, type ActionState } from '@/lib/actions/result'
import { requireLandlord } from '@/lib/auth/session'
import { getT } from '@/lib/i18n/server'
import { createClient } from '@/lib/supabase/server'
import { todayISO } from '@/lib/utils/format'
import { formToObject, idSchema, tenantSchema } from '@/lib/validation/schemas'

/**
 * Add a tenant to a vacant flat. The tenant does NOT need the app: if an
 * email is given and they later sign in with it, their bills appear for them.
 */
export async function createTenant(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireLandlord()
  const t = await getT()
  const parsed = tenantSchema.safeParse(formToObject(formData))
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error.issues) }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tenants')
    .insert({ ...parsed.data, landlord_id: user.id })
    .select('id')
    .single()

  if (error || !data) {
    // unique index tenants_one_active_per_unit → flat already has a tenant
    return error?.code === '23505'
      ? { ok: false, fieldErrors: { unit_id: t.tenants.noVacantUnits } }
      : { ok: false, error: t.common.somethingWrong }
  }

  revalidatePath('/tenants')
  revalidatePath('/dashboard')
  redirect(`/tenants/${data.id}`)
}

/** Mark a tenant as moved out; the flat becomes vacant (trigger). */
export async function endTenancy(formData: FormData) {
  await requireLandlord()
  const parsed = idSchema.safeParse({ id: formData.get('id') })
  if (!parsed.success) return

  const supabase = await createClient()
  await supabase
    .from('tenants')
    .update({ status: 'ended', move_out_date: todayISO() })
    .eq('id', parsed.data.id)
    .eq('status', 'active')

  revalidatePath(`/tenants/${parsed.data.id}`)
  revalidatePath('/tenants')
}
