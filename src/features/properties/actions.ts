'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { fieldErrorsFrom, type ActionState } from '@/lib/actions/result'
import { requireLandlord } from '@/lib/auth/session'
import { getT } from '@/lib/i18n/server'
import { createClient } from '@/lib/supabase/server'
import { formToObject, propertySchema, unitSchema } from '@/lib/validation/schemas'

export async function createProperty(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireLandlord()
  const t = await getT()
  const parsed = propertySchema.safeParse(formToObject(formData))
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error.issues) }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('properties')
    .insert({ ...parsed.data, landlord_id: user.id })
    .select('id')
    .single()
  if (error || !data) return { ok: false, error: t.common.somethingWrong }

  revalidatePath('/properties')
  redirect(`/properties/${data.id}`)
}

export async function createUnit(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireLandlord()
  const t = await getT()
  const parsed = unitSchema.safeParse(formToObject(formData))
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error.issues) }

  const supabase = await createClient()
  const { error } = await supabase.from('units').insert({ ...parsed.data, landlord_id: user.id })
  if (error) {
    // 23505 = unique violation (same flat name twice in one building)
    return error.code === '23505'
      ? { ok: false, fieldErrors: { label: t.common.somethingWrong } }
      : { ok: false, error: t.common.somethingWrong }
  }

  revalidatePath(`/properties/${parsed.data.property_id}`)
  return { ok: true, message: t.common.save }
}
