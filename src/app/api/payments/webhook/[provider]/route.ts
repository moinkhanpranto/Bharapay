import { NextResponse } from 'next/server'
import { providerByName, WebhookVerificationError } from '@/lib/payments'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/payments/webhook/:provider
 *
 * Server-to-server notification from the payment gateway.
 *   1. the provider adapter verifies the signature (or re-queries the gateway)
 *   2. apply_payment_event() stores the event once and updates intent + bill
 *      atomically in the database (duplicate events are ignored)
 *
 * Responses never reveal why verification failed.
 */
export async function POST(request: Request, ctx: RouteContext<'/api/payments/webhook/[provider]'>) {
  const { provider: name } = await ctx.params
  const provider = providerByName(name)
  if (!provider) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  let event
  try {
    event = await provider.verifyWebhook(request)
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.warn('[webhook] rejected', { provider: name, reason: err.message })
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
    }
    console.error('[webhook] provider error', { provider: name, err })
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }

  let admin
  try {
    admin = createAdminClient()
  } catch (err) {
    console.error('[webhook] SUPABASE_SECRET_KEY is not configured', err)
    return NextResponse.json({ error: 'retry' }, { status: 500 })
  }

  const { data: result, error } = await admin.rpc('apply_payment_event', {
    p_provider: provider.name,
    p_event_id: event.eventId,
    p_event_type: event.eventType,
    p_intent_id: event.intentId,
    p_status: event.status,
    p_amount: event.amount as number,
    p_provider_ref: event.providerRef as string,
    p_method: event.method as NonNullable<typeof event.method>,
    p_payload: JSON.parse(JSON.stringify(event.raw)),
  })

  if (error) {
    // 500 → the gateway retries later; the event_id keeps retries idempotent
    console.error('[webhook] apply failed', { provider: name, eventId: event.eventId, error: error.message })
    return NextResponse.json({ error: 'retry' }, { status: 500 })
  }

  return NextResponse.json({ received: true, result })
}
