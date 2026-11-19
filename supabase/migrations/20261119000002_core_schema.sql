-- =============================================================================
-- 0002 · Core schema
-- -----------------------------------------------------------------------------
-- Domain model (one landlord owns everything below them):
--
--   profiles ─┬─< properties ─< units ─< tenants ─< bills ─< bill_items
--             │                                    └─< payments
--             └─ (tenant users are linked to `tenants.user_id` by email)
--
--   payment_intents  : an online payment attempt for one bill (gateway flow)
--   payment_events   : raw, de-duplicated webhook events from the gateway
--   audit_log        : append-only history of money-related changes
--
-- Money is numeric(12,2) in BDT. Every child row repeats `landlord_id` and a
-- composite foreign key (id, landlord_id) guarantees it matches its parent, so
-- Row Level Security can check ownership with a single column comparison.
-- =============================================================================

-- Private schema: helper functions used by policies/triggers. Not exposed by
-- the Data API (only `public` and `graphql_public` are exposed).
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.user_role      as enum ('landlord', 'tenant');
create type public.unit_status    as enum ('vacant', 'occupied');
create type public.tenant_status  as enum ('active', 'ended');
create type public.bill_status    as enum ('unpaid', 'partial', 'paid');
create type public.charge_kind    as enum ('rent', 'gas', 'electricity', 'water', 'service', 'other');
create type public.payment_method as enum ('cash', 'bkash', 'nagad', 'rocket', 'bank', 'card', 'online');
create type public.payment_source as enum ('manual', 'gateway');
create type public.intent_status  as enum ('created', 'pending', 'succeeded', 'failed', 'cancelled', 'expired');

-- -----------------------------------------------------------------------------
-- profiles · one row per auth user (created by trigger in 0003)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (char_length(full_name) between 1 and 120),
  phone       text check (phone ~ '^\+?[0-9]{10,15}$'),
  role        public.user_role,               -- null until onboarding
  locale      text not null default 'bn' check (locale in ('bn', 'en')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- properties · a building / house owned by a landlord
-- -----------------------------------------------------------------------------
create table public.properties (
  id           uuid primary key default gen_random_uuid(),
  landlord_id  uuid not null references public.profiles (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 120),
  address      text check (char_length(address) <= 300),
  area         text check (char_length(area) <= 80),
  city         text not null default 'Dhaka' check (char_length(city) <= 60),
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, landlord_id)
);
create index properties_landlord_idx on public.properties (landlord_id);

-- -----------------------------------------------------------------------------
-- units · a flat / room inside a property
-- -----------------------------------------------------------------------------
create table public.units (
  id            uuid primary key default gen_random_uuid(),
  landlord_id   uuid not null,
  property_id   uuid not null,
  label         text not null check (char_length(label) between 1 and 40),
  floor         text check (char_length(floor) <= 20),
  default_rent  numeric(12, 2) check (default_rent >= 0),
  status        public.unit_status not null default 'vacant',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (id, landlord_id),
  unique (property_id, label),
  foreign key (property_id, landlord_id)
    references public.properties (id, landlord_id) on delete cascade
);
create index units_landlord_idx on public.units (landlord_id);

-- -----------------------------------------------------------------------------
-- tenants · a person renting a unit. Works WITHOUT the tenant having an
-- account; if `email` matches a verified login, `user_id` gets linked.
-- -----------------------------------------------------------------------------
create table public.tenants (
  id              uuid primary key default gen_random_uuid(),
  landlord_id     uuid not null,
  unit_id         uuid not null,
  user_id         uuid references auth.users (id) on delete set null,
  full_name       text not null check (char_length(full_name) between 1 and 120),
  phone           text check (phone ~ '^\+?[0-9]{10,15}$'),
  email           text check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  move_in_date    date not null default current_date,
  move_out_date   date,
  rent_amount     numeric(12, 2) not null check (rent_amount > 0),
  service_charge  numeric(12, 2) not null default 0 check (service_charge >= 0),
  due_day         smallint not null default 5 check (due_day between 1 and 28),
  deposit_amount  numeric(12, 2) not null default 0 check (deposit_amount >= 0),
  status          public.tenant_status not null default 'active',
  notes           text check (char_length(notes) <= 500),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (id, landlord_id),
  foreign key (unit_id, landlord_id)
    references public.units (id, landlord_id) on delete cascade
);
create index tenants_landlord_idx on public.tenants (landlord_id);
create index tenants_user_idx     on public.tenants (user_id) where user_id is not null;
create index tenants_email_idx    on public.tenants (email) where email is not null;
-- Only one active tenancy per unit.
create unique index tenants_one_active_per_unit on public.tenants (unit_id) where status = 'active';

-- -----------------------------------------------------------------------------
-- bills · one monthly bill per tenant (rent + utilities etc. in bill_items)
-- amount_due / amount_paid / status are maintained by triggers (0003).
-- -----------------------------------------------------------------------------
create table public.bills (
  id           uuid primary key default gen_random_uuid(),
  landlord_id  uuid not null,
  tenant_id    uuid not null,
  period       date not null check (period = date_trunc('month', period)::date),
  due_date     date not null,
  amount_due   numeric(12, 2) not null default 0,
  amount_paid  numeric(12, 2) not null default 0,
  status       public.bill_status not null default 'unpaid',
  note         text check (char_length(note) <= 300),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, landlord_id),
  unique (tenant_id, period),
  foreign key (tenant_id, landlord_id)
    references public.tenants (id, landlord_id) on delete cascade
);
create index bills_landlord_period_idx on public.bills (landlord_id, period);

create table public.bill_items (
  id           uuid primary key default gen_random_uuid(),
  landlord_id  uuid not null,
  bill_id      uuid not null,
  kind         public.charge_kind not null,
  label        text not null check (char_length(label) between 1 and 60),
  amount       numeric(12, 2) not null check (amount >= 0),
  created_at   timestamptz not null default now(),
  foreign key (bill_id, landlord_id)
    references public.bills (id, landlord_id) on delete cascade
);
create index bill_items_bill_idx on public.bill_items (bill_id);

-- -----------------------------------------------------------------------------
-- payment_intents · one online payment attempt (gateway flow)
-- Created ONLY through public.create_payment_intent() which computes the
-- amount on the server. Status changes ONLY through public.apply_payment_event()
-- (service role, called by the verified webhook).
-- -----------------------------------------------------------------------------
create table public.payment_intents (
  id              uuid primary key default gen_random_uuid(),
  landlord_id     uuid not null,
  tenant_id       uuid not null references public.tenants (id) on delete cascade,
  bill_id         uuid not null,
  amount          numeric(12, 2) not null check (amount > 0),
  currency        text not null default 'BDT' check (currency = 'BDT'),
  provider        text not null check (provider in ('mock', 'bkash', 'nagad', 'sslcommerz')),
  provider_ref    text,
  status          public.intent_status not null default 'created',
  failure_reason  text,
  created_by      uuid not null references auth.users (id) on delete cascade,
  expires_at      timestamptz not null default now() + interval '30 minutes',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (provider, provider_ref),
  foreign key (bill_id, landlord_id)
    references public.bills (id, landlord_id) on delete cascade
);
create index payment_intents_bill_idx    on public.payment_intents (bill_id);
create index payment_intents_creator_idx on public.payment_intents (created_by, created_at desc);

-- -----------------------------------------------------------------------------
-- payments · money actually received (manual record OR verified gateway)
-- -----------------------------------------------------------------------------
create sequence public.receipt_seq;

create table public.payments (
  id           uuid primary key default gen_random_uuid(),
  landlord_id  uuid not null,
  bill_id      uuid not null,
  tenant_id    uuid not null references public.tenants (id) on delete cascade,
  amount       numeric(12, 2) not null check (amount > 0),
  method       public.payment_method not null,
  reference    text check (char_length(reference) <= 60),
  paid_at      date not null default current_date,
  source       public.payment_source not null default 'manual',
  verified     boolean not null default false,
  intent_id    uuid unique references public.payment_intents (id),
  receipt_no   text not null unique,
  recorded_by  uuid references auth.users (id) on delete set null,
  voided_at    timestamptz,
  void_reason  text check (char_length(void_reason) <= 200),
  created_at   timestamptz not null default now(),
  foreign key (bill_id, landlord_id)
    references public.bills (id, landlord_id) on delete cascade,
  -- a gateway payment is always verified and tied to an intent
  check (source = 'manual' or (verified and intent_id is not null))
);
create index payments_bill_idx     on public.payments (bill_id);
create index payments_landlord_idx on public.payments (landlord_id, paid_at desc);

-- -----------------------------------------------------------------------------
-- payment_events · raw gateway webhooks, de-duplicated by (provider, event_id)
-- -----------------------------------------------------------------------------
create table public.payment_events (
  id           uuid primary key default gen_random_uuid(),
  provider     text not null,
  event_id     text not null,
  event_type   text not null,
  intent_id    uuid references public.payment_intents (id) on delete set null,
  payload      jsonb not null,
  result       text,
  received_at  timestamptz not null default now(),
  unique (provider, event_id)
);

-- -----------------------------------------------------------------------------
-- audit_log · append-only (written by triggers only)
-- -----------------------------------------------------------------------------
create table public.audit_log (
  id           bigint generated always as identity primary key,
  actor_id     uuid,
  landlord_id  uuid,
  action       text not null,
  entity       text not null,
  entity_id    uuid,
  details      jsonb,
  created_at   timestamptz not null default now()
);
create index audit_log_landlord_idx on public.audit_log (landlord_id, created_at desc);
