-- =============================================================================
-- 0005 · Table privileges (least privilege)
-- -----------------------------------------------------------------------------
-- New Supabase projects do not auto-grant table access to API roles, so each
-- grant is explicit. RLS (0004) still decides WHICH rows; these grants decide
-- WHICH operations are possible at all.
-- =============================================================================

grant select, update                 on public.profiles        to authenticated;
grant select, insert, update, delete on public.properties      to authenticated;
grant select, insert, update, delete on public.units           to authenticated;
grant select, insert, update, delete on public.tenants         to authenticated;
grant select, insert, update, delete on public.bills           to authenticated;
grant select, insert, update, delete on public.bill_items      to authenticated;
grant select, insert, update         on public.payments        to authenticated;  -- no delete: void instead
grant select                         on public.payment_intents to authenticated;  -- writes via RPC only
grant select                         on public.audit_log       to authenticated;
-- public.payment_events: no grant to authenticated (service role only)

grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;
