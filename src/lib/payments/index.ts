import 'server-only'

import { paymentEnv } from '@/lib/env.server'
import { bkashProvider } from './providers/bkash'
import { mockProvider } from './providers/mock'
import type { PaymentProvider, ProviderName } from './types'

const providers: Record<ProviderName, PaymentProvider> = {
  mock: mockProvider,
  bkash: bkashProvider,
}

/** The gateway selected by PAYMENT_PROVIDER (defaults to `mock`). */
export function activeProvider(): PaymentProvider {
  return providers[paymentEnv().PAYMENT_PROVIDER]
}

/** Look up a provider by the name in a webhook URL. Unknown → null. */
export function providerByName(name: string): PaymentProvider | null {
  return Object.hasOwn(providers, name) ? providers[name as ProviderName] : null
}

export * from './types'
