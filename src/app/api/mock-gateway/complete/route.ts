import { randomUUID } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { paymentEnv } from '@/lib/env.server'
import type { MockCheckoutToken, MockWebhookBody } from '@/lib/payments/providers/mock'
import { SIGNATURE_HEADER, signWebhook, verifyToken } from '@/lib/payments/signature'

/**
 * POST /api/mock-gateway/complete — pretends to be the gateway's backend.
 * Receives the payer's choice from the fake checkout page, sends a SIGNED
 * webhook to our real webhook endpoint, then returns the payer to BharaPay.
 * Disabled unless MOCK_GATEWAY_ENABLED=true.
 */
export async function POST(request: NextRequest) {
  const env = paymentEnv()
  if (env.MOCK_GATEWAY_ENABLED !== 'true') return new NextResponse('Not found', { status: 404 })

  const form = await request.formData()
  const token = verifyToken<MockCheckoutToken>(env.PAYMENT_WEBHOOK_SECRET, String(form.get('token') ?? ''))
  const outcome = String(form.get('outcome') ?? '')
  if (!token || !['succeeded', 'failed', 'cancelled'].includes(outcome)) {
    return new NextResponse('Invalid checkout', { status: 400 })
  }

  const body: MockWebhookBody = {
    id: `evt_${randomUUID()}`,
    type: `payment.${outcome}` as MockWebhookBody['type'],
    data: {
      intent_id: token.intentId,
      provider_ref: token.providerRef,
      amount: token.amount,
      method: 'bkash',
      ...(outcome === 'failed' ? { reason: 'insufficient_balance (simulated)' } : {}),
    },
  }
  const raw = JSON.stringify(body)

  const webhookUrl = new URL('/api/payments/webhook/mock', request.nextUrl.origin)
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json', [SIGNATURE_HEADER]: signWebhook(env.PAYMENT_WEBHOOK_SECRET, raw) },
    body: raw,
    cache: 'no-store',
  })
  if (!res.ok) console.error('[mock-gateway] webhook delivery failed', res.status)

  return NextResponse.redirect(token.returnUrl, { status: 303 })
}
