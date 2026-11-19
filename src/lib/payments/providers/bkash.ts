import 'server-only'

import { PaymentProviderNotConfiguredError, type PaymentProvider } from '../types'

/**
 * bKash adapter — PLACEHOLDER until merchant API credentials are available.
 *
 * When credentials arrive, implement:
 *   createCheckout()
 *     1. get/refresh a grant token (app key + secret + username + password)
 *     2. "create payment" with amount, our intentId as the merchant invoice
 *        number, and callbackURL = input.returnUrl
 *     3. return { redirectUrl: bkashURL, providerRef: paymentID }
 *   verifyWebhook()
 *     - never trust the browser callback alone: call bKash "execute" and/or
 *       "query payment" server-to-server with the paymentID, then map the
 *       transaction status to 'succeeded' | 'failed' | 'cancelled'
 *     - use bKash's trxID as eventId so retries stay idempotent
 *
 * Add the credentials to env.server.ts (BKASH_APP_KEY, BKASH_APP_SECRET, …),
 * set PAYMENT_PROVIDER=bkash, and nothing else in the app needs to change.
 */
export const bkashProvider: PaymentProvider = {
  name: 'bkash',
  async createCheckout() {
    throw new PaymentProviderNotConfiguredError('bkash')
  },
  async verifyWebhook() {
    throw new PaymentProviderNotConfiguredError('bkash')
  },
}
