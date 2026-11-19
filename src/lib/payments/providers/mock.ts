import 'server-only'

import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { publicEnv } from '@/lib/env'
import { paymentEnv } from '@/lib/env.server'
import { SIGNATURE_HEADER, signToken, verifyWebhookSignature } from '../signature'
import { WebhookVerificationError, type PaymentProvider, type VerifiedPaymentEvent } from '../types'

/**
 * MOCK gateway — behaves like a real hosted checkout so the whole flow can be
 * built and tested before real API credentials exist.
 *
 *   1. createCheckout() → URL of our own fake page /mock-gateway/checkout
 *   2. the payer clicks "Pay" / "Fail" / "Cancel" there
 *   3. /api/mock-gateway/complete sends a SIGNED webhook to
 *      /api/payments/webhook/mock, exactly like a real gateway would
 *   4. verifyWebhook() below checks the signature and normalises the event
 */

export type MockCheckoutToken = {
  intentId: string
  providerRef: string
  amount: number
  returnUrl: string
  exp: number
}

const webhookBody = z.object({
  id: z.string().min(1).max(100),
  type: z.enum(['payment.succeeded', 'payment.failed', 'payment.cancelled']),
  data: z.object({
    intent_id: z.string().uuid(),
    provider_ref: z.string().max(100),
    amount: z.number().positive(),
    method: z.enum(['bkash', 'nagad', 'card']),
    reason: z.string().max(200).optional(),
  }),
})

export type MockWebhookBody = z.infer<typeof webhookBody>

const statusByType = {
  'payment.succeeded': 'succeeded',
  'payment.failed': 'failed',
  'payment.cancelled': 'cancelled',
} as const

export const mockProvider: PaymentProvider = {
  name: 'mock',

  async createCheckout(input) {
    const providerRef = `mock_${randomUUID()}`
    const token = signToken(paymentEnv().PAYMENT_WEBHOOK_SECRET, {
      intentId: input.intentId,
      providerRef,
      amount: input.amount,
      returnUrl: input.returnUrl,
      exp: Math.floor(Date.now() / 1000) + 30 * 60,
    } satisfies MockCheckoutToken)

    const url = new URL('/mock-gateway/checkout', publicEnv.NEXT_PUBLIC_SITE_URL)
    url.searchParams.set('token', token)
    return { redirectUrl: url.toString(), providerRef }
  },

  async verifyWebhook(request): Promise<VerifiedPaymentEvent> {
    const raw = await request.text()
    if (!verifyWebhookSignature(paymentEnv().PAYMENT_WEBHOOK_SECRET, raw, request.headers.get(SIGNATURE_HEADER))) {
      throw new WebhookVerificationError('bad_signature')
    }

    let json: unknown
    try {
      json = JSON.parse(raw)
    } catch {
      throw new WebhookVerificationError('bad_json')
    }
    const parsed = webhookBody.safeParse(json)
    if (!parsed.success) throw new WebhookVerificationError('bad_shape')

    const { id, type, data } = parsed.data
    return {
      eventId: id,
      eventType: type,
      intentId: data.intent_id,
      status: statusByType[type],
      amount: data.amount,
      providerRef: data.provider_ref,
      method: data.method,
      raw: parsed.data,
    }
  },
}
