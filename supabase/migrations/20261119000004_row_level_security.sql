-- =============================================================================
-- 0004 · Row Level Security
-- -----------------------------------------------------------------------------
-- Rule of thumb
--   * Landlord: full access to rows where landlord_id = auth.uid()
--   * Tenant:   READ-ONLY access to their own tenancy, bills, items, payments
--   * anon:     nothing
--   * payment_events / audit writes: service role or triggers only
-- `(select auth.uid())` is wrapped in a sub-select so Postgres evaluates it
-- once per query instead of once per row.
-- =============================================================================

-- Defence in depth: the anonymous role gets no table access at all.
revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from anon;

alter table public.profiles        enable row level security;
alter table public.properties      enable row level security;
alter table public.units           enable row level security;
alter table public.tenants         enable row level security;
alter table public.bills           enable row level security;
alter table public.bill_items      enable row level security;
alter table public.payments        enable row level security;
alter table public.payment_intents enable row level security;
alter table public.payment_events  enable row level security;
alter table public.audit_log       enable row level security;

-- profiles ------------------------------------------------------------------
create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: tenant reads own landlord"
  on public.profiles for select to authenticated
  using (id in (select private.my_landlord_ids()));

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- properties ----------------------------------------------------------------
create policy "properties: landlord reads own"
  on public.properties for select to authenticated
  using (landlord_id = (select auth.uid()));

create policy "properties: tenant reads own building"
  on public.properties for select to authenticated
  using (id in (select private.my_property_ids()));

create policy "properties: landlord inserts"
  on public.properties for insert to authenticated
  with check (landlord_id = (select auth.uid()) and (select private.is_landlord()));

create policy "properties: landlord updates"
  on public.properties for update to authenticated
  using (landlord_id = (select auth.uid()))
  with check (landlord_id = (select auth.uid()));

create policy "properties: landlord deletes"
  on public.properties for delete to authenticated
  using (landlord_id = (select auth.uid()));

-- units ---------------------------------------------------------------------
create policy "units: landlord reads own"
  on public.units for select to authenticated
  using (landlord_id = (select auth.uid()));

create policy "units: tenant reads own unit"
  on public.units for select to authenticated
  using (id in (select private.my_unit_ids()));

create policy "units: landlord inserts"
  on public.units for insert to authenticated
  with check (landlord_id = (select auth.uid()) and (select private.is_landlord()));

create policy "units: landlord updates"
  on public.units for update to authenticated
  using (landlord_id = (select auth.uid()))
  with check (landlord_id = (select auth.uid()));

create policy "units: landlord deletes"
  on public.units for delete to authenticated
  using (landlord_id = (select auth.uid()));

-- tenants -------------------------------------------------------------------
create policy "tenants: landlord reads own"
  on public.tenants for select to authenticated
  using (landlord_id = (select auth.uid()));

create policy "tenants: tenant reads self"
  on public.tenants for select to authenticated
  using (user_id = (select auth.uid()));

create policy "tenants: landlord inserts"
  on public.tenants for insert to authenticated
  with check (landlord_id = (select auth.uid()) and (select private.is_landlord()) and user_id is null);

create policy "tenants: landlord updates"
  on public.tenants for update to authenticated
  using (landlord_id = (select auth.uid()))
  with check (landlord_id = (select auth.uid()));

create policy "tenants: landlord deletes"
  on public.tenants for delete to authenticated
  using (landlord_id = (select auth.uid()));

-- bills ---------------------------------------------------------------------
create policy "bills: landlord reads own"
  on public.bills for select to authenticated
  using (landlord_id = (select auth.uid()));

create policy "bills: tenant reads own"
  on public.bills for select to authenticated
  using (tenant_id in (select private.my_tenant_ids()));

create policy "bills: landlord inserts"
  on public.bills for insert to authenticated
  with check (landlord_id = (select auth.uid()));

create policy "bills: landlord updates"
  on public.bills for update to authenticated
  using (landlord_id = (select auth.uid()))
  with check (landlord_id = (select auth.uid()));

create policy "bills: landlord deletes unpaid"
  on public.bills for delete to authenticated
  using (landlord_id = (select auth.uid()) and amount_paid = 0);

-- bill_items ----------------------------------------------------------------
create policy "bill_items: landlord reads own"
  on public.bill_items for select to authenticated
  using (landlord_id = (select auth.uid()));

create policy "bill_items: tenant reads own"
  on public.bill_items for select to authenticated
  using (bill_id in (select id from public.bills where tenant_id in (select private.my_tenant_ids())));

create policy "bill_items: landlord inserts"
  on public.bill_items for insert to authenticated
  with check (landlord_id = (select auth.uid()));

create policy "bill_items: landlord updates"
  on public.bill_items for update to authenticated
  using (landlord_id = (select auth.uid()))
  with check (landlord_id = (select auth.uid()));

create policy "bill_items: landlord deletes"
  on public.bill_items for delete to authenticated
  using (landlord_id = (select auth.uid()));

-- payments ------------------------------------------------------------------
create policy "payments: landlord reads own"
  on public.payments for select to authenticated
  using (landlord_id = (select auth.uid()));

create policy "payments: tenant reads own"
  on public.payments for select to authenticated
  using (tenant_id in (select private.my_tenant_ids()));

-- Landlords can only RECORD manual, unverified payments. Verified gateway
-- payments are inserted exclusively by apply_payment_event().
create policy "payments: landlord records manual"
  on public.payments for insert to authenticated
  with check (
    landlord_id = (select auth.uid())
    and source = 'manual'
    and verified = false
    and intent_id is null
  );

-- Only voiding is possible (enforced by trigger guard_payment_update). No deletes.
create policy "payments: landlord voids"
  on public.payments for update to authenticated
  using (landlord_id = (select auth.uid()))
  with check (landlord_id = (select auth.uid()));

-- payment_intents -------------------------------------------------------------
-- No insert/update/delete policies: created by create_payment_intent(),
-- changed by apply_payment_event().
create policy "payment_intents: payer reads own"
  on public.payment_intents for select to authenticated
  using (created_by = (select auth.uid()));

create policy "payment_intents: landlord reads own"
  on public.payment_intents for select to authenticated
  using (landlord_id = (select auth.uid()));

-- payment_events: no policies → only the service role can touch it.

-- audit_log -----------------------------------------------------------------
create policy "audit_log: landlord reads own"
  on public.audit_log for select to authenticated
  using (landlord_id = (select auth.uid()));
