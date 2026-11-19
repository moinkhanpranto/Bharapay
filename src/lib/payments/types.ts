import type { Enums } from '@/lib/supabase/database.types'

/**
 * The contract every payment gateway adapter implements.
 * The rest of the app only talks to this interface, so swapping the mock for
 * bKash / Nagad / SSLCOMMERZ / a bank means writing one new file in
 * ./providers and registering it in ./index.ts — nothing else changes.
 */

export type ProviderName = 'mock' | 'bkash'

export type CheckoutInput = {
  intentId: string
  /** Amount in BDT, computed by the database — never from the client. */
  amount: number
  currency: 'BDT'
  billId: string
  customer: { name: string | null; email: string | null; phone: string | null }
  /** Where the gateway sends the payer's browser afterwards. */
  returnUrl: string
  /** Where the gateway sends the server-to-server notification. */
  webhookUrl: string
}

export type CheckoutSession = {
  /** URL to send the payer to (gateway's hosted page). */
  redirectUrl: string
  /** The gateway's own id for this payment, stored on the intent. */
  providerRef: string
}

/** A webhook translated into BharaPay's language, AFTER signature verification. */
export type VerifiedPaymentEvent = {
  eventId: string
  eventType: string
  intentId: string
  status: Enums<'intent_status'>
  amount: number | null
  providerRef: string | null
  method: Enums<'payment_method'> | null
  raw: unknown
}

export interface PaymentProvider {
  readonly name: ProviderName
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>
  /** Must throw WebhookVerificationError if the request is not authentic. */
  verifyWebhook(request: Request): Promise<VerifiedPaymentEvent>
}

export class WebhookVerificationError extends Error {
  constructor(reason: string) {
    super(`webhook_verification_failed: ${reason}`)
    this.name = 'WebhookVerificationError'
  }
}

export class PaymentProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`payment_provider_not_configured: ${provider}`)
    this.name = 'PaymentProviderNotConfiguredError'
  }
}
