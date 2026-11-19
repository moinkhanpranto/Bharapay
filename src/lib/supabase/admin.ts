import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { publicEnv } from '@/lib/env'
import { supabaseSecretKey } from '@/lib/env.server'
import type { Database } from './database.types'

/**
 * ⚠️ ADMIN client — uses the secret key and BYPASSES Row Level Security.
 *
 * Only for trusted server code that has already verified the caller, e.g. the
 * payment webhook after checking the gateway signature. Never use it to serve
 * data a user asked for; use `@/lib/supabase/server` instead.
 */
export function createAdminClient() {
  return createClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, supabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
