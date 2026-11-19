# Architecture

## Data model

```
auth.users ──1:1── profiles (role: landlord | tenant, locale)
                      │
                      └──< properties ──< units ──< tenants ──< bills ──< bill_items
                                                       │          └──< payments
                                                       └── user_id → auth.users (when the tenant signs in)
payment_intents  one online payment attempt for a bill
payment_events   raw gateway webhooks (unique per provider + event id)
audit_log        append-only history written by triggers
```

- Every child table repeats `landlord_id`; a composite foreign key
  `(parent_id, landlord_id)` guarantees it matches the parent. RLS can then
  check ownership with `landlord_id = auth.uid()`.
- Money is `numeric(12,2)` in BDT.
- `bills.amount_due`, `amount_paid` and `status` are maintained by triggers
  from `bill_items` and non-voided `payments`. App code never writes them.
- "Overdue" is not stored; it is `status <> 'paid' and due_date < today`.
- Payments are never edited: a wrong manual payment is **voided** with a reason.

## Tenants without the app

A landlord can add a tenant with only a name. If they add an email and that
person later signs in with the same verified email, `claim_tenancies()` links
the tenant row to their account and they see their bills.

## Request flow

```
Browser ──► src/proxy.ts            refresh Supabase session, redirect signed-out users
        ──► page.tsx (Server)       requireUser()/requireLandlord() → queries.ts → Supabase (RLS)
        ──► form → actions.ts       Zod validate → require role → Supabase write (RLS) → revalidate
```

The Supabase client in Server Components/Actions acts **as the user**, so the
database enforces permissions even if app code has a bug. The admin (secret
key) client is used in exactly one place: the payment webhook.

## Database functions (RPC)

| Function | Caller | Purpose |
| --- | --- | --- |
| `claim_tenancies()` | signed-in user | link tenant rows by verified email |
| `generate_monthly_bills(period)` | landlord | create rent + service charge bills, idempotent |
| `create_payment_intent(bill, provider)` | tenant | start online payment; amount computed in DB |
| `apply_payment_event(...)` | service role only | apply a verified webhook atomically and idempotently |

## Migrations

`supabase/migrations/` — run in filename order. After a schema change:

1. add a new migration file (never edit an applied one)
2. apply it (Supabase CLI `supabase db push` or the dashboard SQL editor)
3. regenerate `src/lib/supabase/database.types.ts`
4. run the Supabase security advisor
