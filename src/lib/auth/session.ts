import 'server-only'

import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/database.types'

/**
 * Data Access Layer for "who is signed in".
 * Every page, Server Action and Route Handler that needs a user goes through
 * these helpers — never read cookies or trust client input for identity.
 */

export type CurrentUser = {
  id: string
  email: string | null
  profile: Pick<Tables<'profiles'>, 'full_name' | 'phone' | 'role' | 'locale'>
}

/** Signed-in user (verified with Supabase Auth) or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  if (!claims?.sub) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, role, locale')
    .eq('id', claims.sub)
    .single()

  return {
    id: claims.sub,
    email: typeof claims.email === 'string' ? claims.email : null,
    profile: profile ?? { full_name: null, phone: null, role: null, locale: 'bn' },
  }
})

/** Use in private pages: redirects to /login when signed out. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

/** Signed in AND finished onboarding (has a role). */
export async function requireOnboardedUser(): Promise<CurrentUser & { profile: { role: 'landlord' | 'tenant' } }> {
  const user = await requireUser()
  if (!user.profile.role) redirect('/onboarding')
  return user as CurrentUser & { profile: { role: 'landlord' | 'tenant' } }
}

export async function requireLandlord() {
  const user = await requireOnboardedUser()
  if (user.profile.role !== 'landlord') redirect('/dashboard')
  return user
}

export async function requireTenant() {
  const user = await requireOnboardedUser()
  if (user.profile.role !== 'tenant') redirect('/dashboard')
  return user
}
