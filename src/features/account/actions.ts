'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { fieldErrorsFrom, type ActionState } from '@/lib/actions/result'
import { getCurrentUser, requireUser } from '@/lib/auth/session'
import { LOCALE_COOKIE, isLocale } from '@/lib/i18n/config'
import { getT } from '@/lib/i18n/server'
import { createClient } from '@/lib/supabase/server'
import { formToObject, onboardingSchema, profileSchema } from '@/lib/validation/schemas'

/** First-time setup: choose landlord/tenant (locked afterwards), name, phone. */
export async function completeOnboarding(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser()
  const t = await getT()
  if (user.profile.role) redirect('/dashboard')

  const parsed = onboardingSchema.safeParse(formToObject(formData))
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error.issues) }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ role: parsed.data.role, full_name: parsed.data.full_name, phone: parsed.data.phone })
    .eq('id', user.id)
  if (error) return { ok: false, error: t.common.somethingWrong }

  if (parsed.data.role === 'tenant') await supabase.rpc('claim_tenancies')
  redirect('/dashboard')
}

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser()
  const t = await getT()
  const parsed = profileSchema.safeParse(formToObject(formData))
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error.issues) }

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update(parsed.data).eq('id', user.id)
  if (error) return { ok: false, error: t.common.somethingWrong }
  revalidatePath('/account')
  return { ok: true, message: t.account.saved }
}

/** Switch UI language. Works signed-out too (cookie only). */
export async function setLocale(formData: FormData) {
  const locale = formData.get('locale')
  if (!isLocale(locale)) return
  ;(await cookies()).set(LOCALE_COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })

  const user = await getCurrentUser()
  if (user) {
    const supabase = await createClient()
    await supabase.from('profiles').update({ locale }).eq('id', user.id)
  }
  revalidatePath('/', 'layout')
}
