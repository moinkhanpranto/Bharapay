import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * HMAC-SHA256 helpers.
 *
 * Webhook header format (same idea as Stripe):
 *   x-bharapay-signature: t=<unix seconds>,v1=<hex hmac of "<t>.<raw body>">
 * The timestamp stops replay of old requests; the HMAC proves the body came
 * from someone holding PAYMENT_WEBHOOK_SECRET and was not modified.
 */

export const SIGNATURE_HEADER = 'x-bharapay-signature'
const TOLERANCE_SECONDS = 5 * 60

function hmac(secret: string, payload: string) {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

function safeEqualHex(a: string, b: string) {
  const ab = Buffer.from(a, 'hex')
  const bb = Buffer.from(b, 'hex')
  return ab.length === bb.length && ab.length > 0 && timingSafeEqual(ab, bb)
}

export function signWebhook(secret: string, rawBody: string, timestamp = Math.floor(Date.now() / 1000)) {
  return `t=${timestamp},v1=${hmac(secret, `${timestamp}.${rawBody}`)}`
}

export function verifyWebhookSignature(secret: string, rawBody: string, header: string | null): boolean {
  if (!header) return false
  const parts = Object.fromEntries(
    header.split(',').map((kv) => {
      const [k, ...rest] = kv.trim().split('=')
      return [k, rest.join('=')]
    }),
  )
  const t = Number(parts.t)
  if (!Number.isInteger(t) || !parts.v1) return false
  if (Math.abs(Date.now() / 1000 - t) > TOLERANCE_SECONDS) return false
  return safeEqualHex(hmac(secret, `${t}.${rawBody}`), parts.v1)
}

/**
 * Compact signed token: base64url(JSON) + "." + hmac.
 * Used by the mock checkout so the URL can't be tampered with (e.g. amount).
 */
export function signToken(secret: string, data: Record<string, unknown>) {
  const body = Buffer.from(JSON.stringify(data)).toString('base64url')
  return `${body}.${hmac(secret, body)}`
}

export function verifyToken<T>(secret: string, token: string): T | null {
  const [body, sig] = token.split('.')
  if (!body || !sig || !safeEqualHex(hmac(secret, body), sig)) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T & { exp?: number }
    if (typeof data.exp === 'number' && data.exp < Date.now() / 1000) return null
    return data
  } catch {
    return null
  }
}
