-- =============================================================================
-- 0003 · Functions and triggers
-- -----------------------------------------------------------------------------
-- Conventions
--   * private.*  helpers for policies/triggers (not callable through the API)
--   * public.*   RPCs the app calls with supabase.rpc(...)
--   * Every SECURITY DEFINER function pins `search_path = ''` and uses fully
--     qualified names, so it cannot be hijacked by objects in other schemas.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Generic: keep updated_at fresh
-- -----------------------------------------------------------------------------
create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch        before update on public.profiles        for each row execute function private.touch_updated_at();
create trigger properties_touch      before update on public.properties      for each row execute function private.touch_updated_at();
create trigger units_touch           before update on public.units           for each row execute function private.touch_updated_at();
create trigger tenants_touch         before update on public.tenants         for each row execute function private.touch_updated_at();
create trigger bills_touch           before update on public.bills           for each row execute function private.touch_updated_at();
create trigger payment_intents_touch before update on public.payment_intents for each row execute function private.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Policy helpers (SECURITY DEFINER so they can read tables without recursing
-- into the RLS policies that call them)
-- -----------------------------------------------------------------------------
create or replace function private.is_landlord()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'landlord'
  );
$$;

-- tenant rows (tenancies) that belong to the signed-in tenant user
create or replace function private.my_tenant_ids()
returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select id from public.tenants where user_id = (select auth.uid());
$$;

create or replace function private.my_unit_ids()
returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select unit_id from public.tenants where user_id = (select auth.uid());
$$;

create or replace function private.my_property_ids()
returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select u.property_id
  from public.tenants t join public.units u on u.id = t.unit_id
  where t.user_id = (select auth.uid());
$$;

create or replace function private.my_landlord_ids()
returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select landlord_id from public.tenants where user_id = (select auth.uid());
$$;

grant execute on function
  private.is_landlord(), private.my_tenant_ids(), private.my_unit_ids(),
  private.my_property_ids(), private.my_landlord_ids()
to authenticated;

-- -----------------------------------------------------------------------------
-- New auth user → profile row
-- -----------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 120), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Backfill users that existed before this migration.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Role can be chosen once (onboarding) and never changed by the user.
-- -----------------------------------------------------------------------------
create or replace function private.guard_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.role is not null and new.role is distinct from old.role
     and (select auth.role()) <> 'service_role' then
    raise exception 'role_locked' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function private.guard_profile_role();

-- -----------------------------------------------------------------------------
-- Unit status follows its active tenant
-- -----------------------------------------------------------------------------
create or replace function private.sync_unit_status()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  affected uuid[];
begin
  affected := array_remove(array[
    case when tg_op <> 'INSERT' then old.unit_id end,
    case when tg_op <> 'DELETE' then new.unit_id end
  ], null);

  update public.units u
  set status = case
    when exists (select 1 from public.tenants t where t.unit_id = u.id and t.status = 'active')
    then 'occupied'::public.unit_status else 'vacant'::public.unit_status end
  where u.id = any (affected);

  return null;
end;
$$;

create trigger tenants_sync_unit_status
  after insert or update of status, unit_id or delete on public.tenants
  for each row execute function private.sync_unit_status();

-- -----------------------------------------------------------------------------
-- Bill totals: amount_due = sum(items), amount_paid = sum(non-voided payments)
-- -----------------------------------------------------------------------------
create or replace function private.refresh_bill(p_bill_id uuid)
returns void
language sql security definer
set search_path = ''
as $$
  with totals as (
    select
      coalesce((select sum(amount) from public.bill_items where bill_id = p_bill_id), 0) as due,
      coalesce((select sum(amount) from public.payments
                where bill_id = p_bill_id and voided_at is null), 0)                    as paid
  )
  update public.bills b
  set amount_due  = t.due,
      amount_paid = t.paid,
      status = case
        when t.due > 0 and t.paid >= t.due then 'paid'::public.bill_status
        when t.paid > 0                    then 'partial'::public.bill_status
        else 'unpaid'::public.bill_status
      end
  from totals t
  where b.id = p_bill_id;
$$;

create or replace function private.on_bill_child_change()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op <> 'INSERT' then perform private.refresh_bill(old.bill_id); end if;
  if tg_op <> 'DELETE' and (tg_op = 'INSERT' or new.bill_id is distinct from old.bill_id) then
    perform private.refresh_bill(new.bill_id);
  end if;
  return null;
end;
$$;

create trigger bill_items_refresh_bill
  after insert or update or delete on public.bill_items
  for each row execute function private.on_bill_child_change();

create trigger payments_refresh_bill
  after insert or update or delete on public.payments
  for each row execute function private.on_bill_child_change();

-- -----------------------------------------------------------------------------
-- Payments: fill derived fields + protect history
-- -----------------------------------------------------------------------------
create or replace function private.before_payment_insert()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  -- tenant always comes from the bill (never trusted from the client)
  select tenant_id into new.tenant_id from public.bills where id = new.bill_id;
  new.receipt_no  := 'BP-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('public.receipt_seq')::text, 6, '0');
  new.recorded_by := (select auth.uid());
  new.voided_at   := null;
  new.void_reason := null;
  return new;
end;
$$;

create trigger payments_before_insert
  before insert on public.payments
  for each row execute function private.before_payment_insert();

-- Landlords may only void a manual payment or fix its reference. Amounts,
-- methods and gateway payments are immutable (corrections = void + new record).
create or replace function private.guard_payment_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.role()) = 'service_role' then
    return new;
  end if;
  if old.source = 'gateway' then
    raise exception 'gateway_payment_immutable' using errcode = '42501';
  end if;
  if old.voided_at is not null then
    raise exception 'payment_already_voided' using errcode = '42501';
  end if;
  if (new.amount, new.method, new.bill_id, new.tenant_id, new.landlord_id, new.paid_at,
      new.source, new.verified, new.intent_id, new.receipt_no, new.recorded_by, new.created_at)
     is distinct from
     (old.amount, old.method, old.bill_id, old.tenant_id, old.landlord_id, old.paid_at,
      old.source, old.verified, old.intent_id, old.receipt_no, old.recorded_by, old.created_at) then
    raise exception 'payment_fields_immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger payments_guard_update
  before update on public.payments
  for each row execute function private.guard_payment_update();

-- -----------------------------------------------------------------------------
-- Audit log
-- -----------------------------------------------------------------------------
create or replace function private.write_audit()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  row_data jsonb;
begin
  if tg_op = 'DELETE' then row_data := to_jsonb(old); else row_data := to_jsonb(new); end if;
  insert into public.audit_log (actor_id, landlord_id, action, entity, entity_id, details)
  values (
    (select auth.uid()),
    (row_data ->> 'landlord_id')::uuid,
    lower(tg_op),
    tg_table_name,
    (row_data ->> 'id')::uuid,
    row_data
  );
  return null;
end;
$$;

create trigger audit_properties after insert or update or delete on public.properties      for each row execute function private.write_audit();
create trigger audit_tenants    after insert or update or delete on public.tenants         for each row execute function private.write_audit();
create trigger audit_bills      after insert or update or delete on public.bills           for each row execute function private.write_audit();
create trigger audit_payments   after insert or update or delete on public.payments        for each row execute function private.write_audit();
create trigger audit_intents    after insert or update           on public.payment_intents for each row execute function private.write_audit();

-- =============================================================================
-- RPCs called by the app
-- =============================================================================

-- -----------------------------------------------------------------------------
-- claim_tenancies() · link tenant records whose email matches the signed-in,
-- email-verified user. Called right after sign-in.
-- -----------------------------------------------------------------------------
create or replace function public.claim_tenancies()
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_email text;
  v_count integer;
begin
  if v_uid is null then
    return 0;
  end if;

  select lower(email) into v_email
  from auth.users
  where id = v_uid and email_confirmed_at is not null;

  if v_email is null then
    return 0;
  end if;

  update public.tenants
  set user_id = v_uid
  where email = v_email and user_id is null and status = 'active'
    and landlord_id <> v_uid;
  get diagnostics v_count = row_count;

  if v_count > 0 then
    update public.profiles set role = 'tenant' where id = v_uid and role is null;
  end if;

  return v_count;
end;
$$;

-- -----------------------------------------------------------------------------
-- generate_monthly_bills(period) · create this month's bill (rent + service
-- charge) for every active tenant of the calling landlord. Idempotent.
-- SECURITY INVOKER: runs with the landlord's own RLS permissions.
-- -----------------------------------------------------------------------------
create or replace function public.generate_monthly_bills(p_period date default current_date)
returns integer
language plpgsql security invoker
set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_period  date := date_trunc('month', p_period)::date;
  v_bill_id uuid;
  v_count   integer := 0;
  t         record;
begin
  if not private.is_landlord() then
    raise exception 'not_landlord' using errcode = '42501';
  end if;

  for t in
    select * from public.tenants
    where landlord_id = v_uid
      and status = 'active'
      and move_in_date < (v_period + interval '1 month')
  loop
    v_bill_id := null;

    insert into public.bills (landlord_id, tenant_id, period, due_date)
    values (v_uid, t.id, v_period, v_period + (t.due_day - 1))
    on conflict (tenant_id, period) do nothing
    returning id into v_bill_id;

    if v_bill_id is not null then
      insert into public.bill_items (landlord_id, bill_id, kind, label, amount)
      values (v_uid, v_bill_id, 'rent', 'Rent', t.rent_amount);

      if t.service_charge > 0 then
        insert into public.bill_items (landlord_id, bill_id, kind, label, amount)
        values (v_uid, v_bill_id, 'service', 'Service charge', t.service_charge);
      end if;

      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

-- -----------------------------------------------------------------------------
-- create_payment_intent(bill, provider) · tenant starts an online payment.
-- The amount is ALWAYS computed here from the bill — never sent by the client.
-- -----------------------------------------------------------------------------
create or replace function public.create_payment_intent(p_bill_id uuid, p_provider text default 'mock')
returns public.payment_intents
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_bill   public.bills;
  v_tenant public.tenants;
  v_amount numeric(12, 2);
  v_recent integer;
  v_intent public.payment_intents;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_provider not in ('mock', 'bkash', 'nagad', 'sslcommerz') then
    raise exception 'unknown_provider' using errcode = '22023';
  end if;

  select * into v_bill from public.bills where id = p_bill_id for update;
  if not found then
    raise exception 'bill_not_found' using errcode = 'P0002';
  end if;

  select * into v_tenant from public.tenants where id = v_bill.tenant_id;
  if v_tenant.user_id is distinct from v_uid then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  v_amount := v_bill.amount_due - v_bill.amount_paid;
  if v_amount <= 0 then
    raise exception 'nothing_due' using errcode = '22023';
  end if;

  -- simple abuse guard: max 5 attempts per user per 10 minutes
  select count(*) into v_recent
  from public.payment_intents
  where created_by = v_uid and created_at > now() - interval '10 minutes';
  if v_recent >= 5 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;

  -- an older unfinished attempt for the same bill is superseded
  update public.payment_intents
  set status = 'cancelled', failure_reason = 'superseded'
  where bill_id = p_bill_id and status in ('created', 'pending');

  insert into public.payment_intents (landlord_id, tenant_id, bill_id, amount, provider, created_by)
  values (v_bill.landlord_id, v_bill.tenant_id, v_bill.id, v_amount, p_provider, v_uid)
  returning * into v_intent;

  return v_intent;
end;
$$;

-- -----------------------------------------------------------------------------
-- apply_payment_event(...) · SERVICE ROLE ONLY. Called by the webhook route
-- after it has verified the gateway signature. Atomic + idempotent:
--   1. store the event once (duplicate event_id → no-op)
--   2. lock the intent, check amount, move it through the state machine
--   3. on success insert a verified gateway payment (bill totals update by trigger)
-- -----------------------------------------------------------------------------
create or replace function public.apply_payment_event(
  p_provider     text,
  p_event_id     text,
  p_event_type   text,
  p_intent_id    uuid,
  p_status       public.intent_status,
  p_amount       numeric,
  p_provider_ref text,
  p_method       public.payment_method,
  p_payload      jsonb
)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_intent   public.payment_intents;
  v_result   text;
begin
  insert into public.payment_events (provider, event_id, event_type, intent_id, payload)
  values (p_provider, p_event_id, p_event_type, p_intent_id, p_payload)
  on conflict (provider, event_id) do nothing
  returning id into v_event_id;

  if v_event_id is null then
    return 'duplicate';
  end if;

  select * into v_intent
  from public.payment_intents
  where id = p_intent_id and provider = p_provider
  for update;

  if not found then
    v_result := 'intent_not_found';
  elsif v_intent.status in ('succeeded', 'failed', 'cancelled', 'expired') then
    v_result := 'already_final';
  elsif p_status = 'succeeded' then
    if p_amount is distinct from v_intent.amount then
      update public.payment_intents
      set status = 'failed', failure_reason = 'amount_mismatch'
      where id = v_intent.id;
      v_result := 'amount_mismatch';
    else
      update public.payment_intents
      set status = 'succeeded', provider_ref = coalesce(p_provider_ref, provider_ref)
      where id = v_intent.id;

      insert into public.payments
        (landlord_id, bill_id, tenant_id, amount, method, reference, source, verified, intent_id)
      values
        (v_intent.landlord_id, v_intent.bill_id, v_intent.tenant_id, v_intent.amount,
         coalesce(p_method, 'online'), left(p_provider_ref, 60), 'gateway', true, v_intent.id);
      v_result := 'succeeded';
    end if;
  elsif p_status in ('failed', 'cancelled', 'expired') then
    update public.payment_intents
    set status = p_status, failure_reason = left(p_payload ->> 'reason', 200)
    where id = v_intent.id;
    v_result := p_status::text;
  elsif p_status = 'pending' then
    update public.payment_intents set status = 'pending' where id = v_intent.id;
    v_result := 'pending';
  else
    v_result := 'ignored';
  end if;

  update public.payment_events set result = v_result where id = v_event_id;
  return v_result;
end;
$$;

-- -----------------------------------------------------------------------------
-- Function privileges: deny by default, then grant precisely.
-- -----------------------------------------------------------------------------
revoke execute on function public.claim_tenancies()                   from public, anon;
revoke execute on function public.generate_monthly_bills(date)        from public, anon;
revoke execute on function public.create_payment_intent(uuid, text)   from public, anon;
revoke execute on function public.apply_payment_event(text, text, text, uuid, public.intent_status, numeric, text, public.payment_method, jsonb)
  from public, anon, authenticated;

grant execute on function public.claim_tenancies()                 to authenticated;
grant execute on function public.generate_monthly_bills(date)      to authenticated;
grant execute on function public.create_payment_intent(uuid, text) to authenticated;
grant execute on function public.apply_payment_event(text, text, text, uuid, public.intent_status, numeric, text, public.payment_method, jsonb)
  to service_role;
