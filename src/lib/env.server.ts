import 'server-only'
import { z } from 'zod'

/**
 * Server-only secrets. Importing this file from a Client Component fails the
 * build (thanks to `server-only`), so secrets can never leak to the browser.
 *
 * Split into two groups and parsed lazily, so a missing value only breaks the
 * feature that needs it (e.g. signature checks work without the DB secret).
 */

const paymentSchema = z.object({
  /** Which gateway adapter to use: `mock` until a real provider is configured. */
  PAYMENT_PROVIDER: z.enum(['mock', 'bkash']).default('mock'),
  /** Shared secret used to sign/verify gateway webhooks (≥ 32 chars). */
  PAYMENT_WEBHOOK_SECRET: z.string().min(32),
  /** "true" exposes the fake checkout page. Turn off once a real gateway is live. */
  MOCK_GATEWAY_ENABLED: z.enum(['true', 'false']).default('false'),
})

const supabaseSecretSchema = z.object({
  /** Supabase secret key (sb_secret_… or legacy service_role JWT). Bypasses RLS — server only. */
  SUPABASE_SECRET_KEY: z.string().min(20),
})

function parse<T extends z.ZodType>(schema: T): z.infer<T> {
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ')
    throw new Error(`Missing or invalid server environment variables: ${missing}. See .env.example`)
  }
  return parsed.data
}

let paymentCache: z.infer<typeof paymentSchema> | null = null
let secretCache: z.infer<typeof supabaseSecretSchema> | null = null

export function paymentEnv() {
  return (paymentCache ??= parse(paymentSchema))
}

export function supabaseSecretKey() {
  return (secretCache ??= parse(supabaseSecretSchema)).SUPABASE_SECRET_KEY
}
