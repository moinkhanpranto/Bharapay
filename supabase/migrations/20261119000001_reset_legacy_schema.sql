-- =============================================================================
-- 0001 · Reset legacy schema
-- -----------------------------------------------------------------------------
-- The project had 11 empty tables and helper functions created by hand in the
-- dashboard (no migration history). They are replaced by the versioned schema
-- in the following migrations. All dropped tables had 0 rows.
-- auth.users is NOT touched.
-- =============================================================================

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists
  public.service_requests,
  public.notifications,
  public.payments,
  public.sub_tenants,
  public.invites,
  public.join_requests,
  public.tenancies,
  public.units,
  public.properties,
  public.tenant_profiles,
  public.profiles
cascade;

do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'generate_bharapay_id',
        'handle_new_user',
        'is_landlord_of_property',
        'is_landlord_of_tenancy',
        'is_landlord_of_unit',
        'is_tenant_of_tenancy'
      )
  loop
    execute format('drop function if exists %s cascade', fn.signature);
  end loop;
end $$;
