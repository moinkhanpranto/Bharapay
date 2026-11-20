'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ActionState } from '@/lib/actions/result'
import { getEnabledProviders } from '@/lib/auth/providers'
import { publicEnv } from '@/lib/env'
import { getT } from '@/lib/i18n/server'
import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/utils/safe-redirect'
import { emailSchema, otpSchema } from '@/lib/validation/schemas'

/**
 * Sign-in flows
 *  A) Google  : signInWithGoogle → Google → /auth/callback (code exchange)
 *  B) Email OTP: sendEmailOtp → 6-digit code by email → verifyEmailOtp
 *
 * The email waiting for a code is kept in a short-lived httpOnly cookie, not
 * in the URL, so it doesn't end up in browser history or server logs.
 */

const OTP_EMAIL_COOKIE = 'bp_otp_email'
const NEXT_COOKIE = 'bp_next'
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 10 * 60 }

async function siteOrigin() {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return host ? `${proto}://${host}` : publicEnv.NEXT_PUBLIC_SITE_URL
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeNextPath(formData.get('next')?.toString())
  // Never send users to Supabase's raw "provider is not enabled" error page.
  if (!(await getEnabledProviders()).google) redirect('/login?error=google')

  const supabase = await createClient()
  const callback = new URL('/auth/callback', await siteOrigin())
  callback.searchParams.set('next', next)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callback.toString(), queryParams: { prompt: 'select_account' } },
  })
  if (error || !data.url) redirect('/login?error=google')
  redirect(data.url)
}

export async function sendEmailOtp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const t = await getT()
  const parsed = emailSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) return { ok: false, fieldErrors: { email: t.auth.invalidEmail } }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { shouldCreateUser: true },
  })
  if (error) {
    return { ok: false, error: error.status === 429 ? t.auth.tooMany : t.common.somethingWrong }
  }

  const jar = await cookies()
  jar.set(OTP_EMAIL_COOKIE, parsed.data.email, cookieOptions)
  jar.set(NEXT_COOKIE, safeNextPath(formData.get('next')?.toString()), cookieOptions)
  redirect('/login/verify')
}

export async function verifyEmailOtp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const t = await getT()
  const jar = await cookies()
  const email = jar.get(OTP_EMAIL_COOKIE)?.value
  if (!email) redirect('/login')

  const parsed = otpSchema.safeParse({ email, token: formData.get('token') })
  if (!parsed.success) return { ok: false, fieldErrors: { token: t.auth.invalidCode } }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ email: parsed.data.email, token: parsed.data.token, type: 'email' })
  if (error) {
    return { ok: false, fieldErrors: { token: error.status === 429 ? t.auth.tooMany : t.auth.invalidCode } }
  }

  // Link any tenancy a landlord created with this email.
  await supabase.rpc('claim_tenancies')

  const next = safeNextPath(jar.get(NEXT_COOKIE)?.value)
  jar.delete(OTP_EMAIL_COOKIE)
  jar.delete(NEXT_COOKIE)
  redirect(next)
}

/** Read the pending email for the verify page (masked for display). */
export async function getPendingOtpEmail() {
  const email = (await cookies()).get(OTP_EMAIL_COOKIE)?.value ?? null
  if (!email) return null
  const [name, domain] = email.split('@')
  return `${name.slice(0, 2)}${'•'.repeat(Math.max(1, name.length - 2))}@${domain}`
}

export async function resendEmailOtp(): Promise<ActionState> {
  const t = await getT()
  const email = (await cookies()).get(OTP_EMAIL_COOKIE)?.value
  if (!email) redirect('/login')
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
  if (error) return { ok: false, error: error.status === 429 ? t.auth.tooMany : t.common.somethingWrong }
  return { ok: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
