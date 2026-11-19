# Payments

Today BharaPay ships with a **mock gateway** so the full online-payment flow
works end to end. A real gateway (bKash, Nagad, SSLCOMMERZ or a bank) plugs in
by adding one adapter file — the rest of the app does not change.

Money never passes through BharaPay: the gateway settles directly to the
landlord's merchant/bank account. BharaPay only records that it happened.

## Flow

```
Tenant taps "Pay ৳X online"                 (bills/[id] → startOnlinePayment)
  │
  ├─ DB: create_payment_intent(bill)        amount = amount_due − amount_paid (server-side)
  ├─ provider.createCheckout(intent)        → redirectUrl + providerRef
  └─ redirect to gateway checkout
                 │
                 ├─ gateway → POST /api/payments/webhook/<provider>   (server to server)
                 │     provider.verifyWebhook()  signature / re-query
                 │     DB: apply_payment_event()  idempotent, checks amount,
                 │         intent → succeeded, inserts verified payment,
                 │         bill totals update by trigger
                 │
                 └─ gateway → browser back to /payments/<intentId>
                       page reads the intent status from the DB (polls until final)
```

Intent states: `created → pending → succeeded | failed | cancelled | expired`.
Final states never change again.

## The adapter interface

`src/lib/payments/types.ts`

```ts
interface PaymentProvider {
  name: 'mock' | 'bkash' | ...
  createCheckout(input: CheckoutInput): Promise<{ redirectUrl: string; providerRef: string }>
  verifyWebhook(request: Request): Promise<VerifiedPaymentEvent>   // throw WebhookVerificationError if not authentic
}
```

## Adding a real gateway (e.g. when the bKash / bank API arrives)

1. Fill in `src/lib/payments/providers/bkash.ts` (steps are written in the file).
2. Add its credentials to `src/lib/env.server.ts` and Vercel env vars.
3. If it is a new provider name, add it to `ProviderName`, the registry in
   `src/lib/payments/index.ts`, and the `provider` CHECK constraint
   (`payment_intents.provider` + `create_payment_intent`) in a new migration.
4. Add the gateway's checkout domain to CSP `form-action` in `next.config.ts`.
5. Set `PAYMENT_PROVIDER=bkash`, `MOCK_GATEWAY_ENABLED=false`.

Rules for any adapter:

- Never trust the browser redirect alone — confirm with a signed webhook or a
  server-to-server status query.
- Use the gateway's transaction id as `eventId`, so retries stay idempotent.
- Pass the amount the gateway reports; the DB rejects a mismatch.

## Testing the mock gateway

1. Landlord adds a tenant **with the email** the tenant will sign in with.
2. Landlord creates this month's bills (dashboard button).
3. Tenant signs in with that email → Bills → open the bill → "Pay online".
4. On the pink test checkout choose Pay / Fail / Cancel.
5. You return to the status page; on success the receipt is "Verified online payment".

Requires `SUPABASE_SECRET_KEY` (the webhook writes with the service role).
