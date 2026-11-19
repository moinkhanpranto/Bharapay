# Security

BharaPay handles people's money records, so security is layered: if one layer
has a bug, the next one still protects the data.

## Layers

| Layer | Where | What it does |
| --- | --- | --- |
| 1. Auth | Supabase Auth | Google OAuth (PKCE) or 6-digit email code. No passwords stored. |
| 2. Session check | `src/proxy.ts`, `lib/auth/session.ts` | JWT verified with `getClaims()` (never `getSession()` on the server). Every page/action calls `requireUser/Landlord/Tenant`. |
| 3. Input validation | `lib/validation/schemas.ts` | Zod on every Server Action; DB CHECK constraints repeat the rules. |
| 4. Row Level Security | migration 0004 | Landlords see only their rows; tenants read-only their own bills. `anon` has no access. |
| 5. Least-privilege grants | migration 0005 | e.g. no DELETE on payments, no writes to payment_intents for users. |
| 6. Money rules in the DB | migration 0003 | Bill totals by trigger; payment amounts immutable; gateway payments only via `apply_payment_event` (service role). |
| 7. Payment integrity | `lib/payments` | Amount computed server-side; HMAC-SHA256 signed webhooks with timestamp (5 min); idempotent event store; return page reads DB, not URL. |
| 8. HTTP headers | `next.config.ts` | CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy. |
| 9. Secrets | `lib/env.server.ts` | `server-only` import guard; secret key used only in the webhook. |
| 10. Audit log | trigger `write_audit` | Every insert/update/delete on properties, tenants, bills, payments, intents. |
| 11. Abuse limits | `create_payment_intent` | Max 5 payment attempts per user per 10 minutes; Supabase Auth rate-limits OTP. |
| 12. Open redirect | `lib/utils/safe-redirect.ts` | `?next=` only accepts same-site paths. |
| 13. PWA cache | `public/sw.js` | Never caches API, auth or page data — only static assets and the offline page. |

## Verified (19 Nov 2026)

Tested against the live database inside a rolled-back transaction:

- landlord cannot insert a `verified` payment (RLS) ✔
- landlord cannot change a payment amount (trigger) ✔
- landlord cannot start a payment intent for a tenant (`not_allowed`) ✔
- another user sees 0 bills / 0 tenants and cannot insert into another landlord's data ✔
- tenant can read own bill/property/landlord name, cannot change `amount_paid` ✔
- tenant cannot call `apply_payment_event` (permission denied) ✔
- duplicate webhook event is ignored (`duplicate`) ✔; bill becomes `paid` after a verified event ✔

HTTP: bad or tampered webhook signatures → 400; unknown provider → 404;
signed-out access to private pages → redirect to /login; `?next=//evil.com` blocked.

## Supabase advisor notes (expected)

- `payment_events` has RLS with no policies → intentional (service role only).
- `claim_tenancies` and `create_payment_intent` are SECURITY DEFINER and callable
  by signed-in users → intentional; both check `auth.uid()` themselves.

## Before going live with real money

- [ ] Set `MOCK_GATEWAY_ENABLED=false` in production
- [ ] Rotate `PAYMENT_WEBHOOK_SECRET`; store it only in Vercel env
- [ ] Enable Supabase MFA for the dashboard owner account; restrict team access
- [ ] Turn on Supabase Point-in-Time Recovery / daily backups
- [ ] Add the gateway's checkout domain to CSP `form-action`
- [ ] Add a uptime + error monitor (e.g. Vercel Observability, Sentry)
- [ ] Have a third party review the payment flow before launch
- [ ] Publish a privacy policy (Bangladesh data protection rules)
