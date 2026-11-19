# BharaPay — ভাড়ার হিসাব সহজ

A Bangla-first rent ledger for Bangladeshi landlords and tenants.
Landlords track properties, flats, tenants and monthly bills (rent + utilities),
record cash/bKash payments and send numbered receipts. Tenants see their own
bills and can pay online (mock gateway today, real gateway later).

Mobile-first, responsive, installable as a PWA.

| Layer | Tech |
| --- | --- |
| App | Next.js 16 (App Router, Server Actions, Proxy) · React 19 · TypeScript |
| UI | Tailwind CSS 4 · Onest + Hind Siliguri · Bangla/English |
| Backend | Supabase (Postgres, Auth, Row Level Security) |
| Auth | Google OAuth + email one-time code (OTP) |
| Payments | Provider adapter interface · mock gateway · signed webhooks |
| Hosting | Vercel |

---

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

Before sign-in works you must configure Supabase Auth once — see
[docs/SETUP.md](docs/SETUP.md).

### Environment variables

| Name | Where | What |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | Publishable key (RLS still applies) |
| `NEXT_PUBLIC_SITE_URL` | public | Base URL of this app (used for payment return URLs) |
| `SUPABASE_SECRET_KEY` | **server only** | Secret key — used only by the payment webhook |
| `PAYMENT_PROVIDER` | server | `mock` (default) or `bkash` |
| `PAYMENT_WEBHOOK_SECRET` | server | 32+ random chars, signs webhooks (`openssl rand -hex 32`) |
| `MOCK_GATEWAY_ENABLED` | server | `true` shows the fake checkout page |

### Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (type-checks too) |
| `npm run lint` | ESLint |
| `npx next typegen` | Regenerate route types (`PageProps`, `RouteContext`) |

---

## Project structure

```
supabase/migrations/      Database schema, functions, RLS, grants (run in order)
src/
  proxy.ts                Runs before every request: refresh session, guard private pages
  app/                    Routes (one folder = one URL)
    page.tsx              Landing
    login/                Google + email-code sign in, /login/verify
    auth/callback/        Google OAuth code exchange
    onboarding/           First-time: landlord or tenant
    (app)/                Signed-in area (shared AppShell layout)
      dashboard/          Landlord: who hasn't paid · Tenant: my next bill
      properties/         Buildings and flats
      tenants/            Tenants (no app needed for them)
      bills/              Monthly bills, charges, record payment, pay online
      receipts/[id]/      Printable / shareable receipt
      payments/[id]/      Online payment status (after gateway)
      account/            Profile, language, install app, sign out
    api/payments/webhook/[provider]/   Gateway → BharaPay notifications
    mock-gateway/, api/mock-gateway/   Fake gateway for testing
    manifest.ts, offline/ PWA
  features/<domain>/      Business logic per domain
    actions.ts            Server Actions (validate → authorise → write)
    queries.ts            Server-side reads
  lib/
    supabase/             server / client / admin / proxy clients + generated types
    auth/session.ts       requireUser / requireLandlord / requireTenant
    payments/             Provider interface, mock + bKash adapters, HMAC signing
    validation/schemas.ts Zod schemas for every form
    i18n/                 Bangla + English dictionaries
    utils/                Taka/date formatting, helpers
  components/             UI building blocks, app shell, PWA helpers
public/sw.js              Service worker (offline page + static cache)
docs/                     Architecture, security, payments, setup
```

**Where do I add…?**

- a new screen → `src/app/(app)/<name>/page.tsx`
- a new form action → `src/features/<domain>/actions.ts` + schema in `lib/validation/schemas.ts`
- a new table → new file in `supabase/migrations/` (with RLS + grants), then regenerate `database.types.ts`
- a new text → `src/lib/i18n/dictionaries.ts` (English first, Bangla is type-checked)
- a real payment gateway → `src/lib/payments/providers/<name>.ts` (see [docs/PAYMENTS.md](docs/PAYMENTS.md))

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — data model and request flow
- [docs/SECURITY.md](docs/SECURITY.md) — security layers and checklist
- [docs/PAYMENTS.md](docs/PAYMENTS.md) — payment flow and how to plug in bKash / a bank
- [docs/SETUP.md](docs/SETUP.md) — Supabase Auth, Google sign-in, Vercel
