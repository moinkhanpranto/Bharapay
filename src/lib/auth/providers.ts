import 'server-only'

import { publicEnv } from '@/lib/env'

/**
 * Which sign-in methods are switched on in Supabase (Authentication → Providers).
 * Read from Supabase's public settings endpoint and cached for 60 seconds, so
 * the Google button appears automatically once Google is enabled there —
 * no code change or redeploy needed.
 */
export async function getEnabledProviders(): Promise<{ google: boolean; email: boolean }> {
  try {
    const res = await fetch(`${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY },
      next: { revalidate: 60 },
    })
    if (!res.ok) throw new Error(`settings ${res.status}`)
    const data = (await res.json()) as { external?: Record<string, boolean> }
    return { google: data.external?.google === true, email: data.external?.email !== false }
  } catch {
    // If Supabase can't be reached, keep email (always configured) and hide Google.
    return { google: false, email: true }
  }
}
