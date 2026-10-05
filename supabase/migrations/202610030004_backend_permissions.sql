begin;
-- BYPASSRLS does not grant table privileges. Daily selection reads these
-- tables through the Edge Function; all writes still use the guarded RPCs.
grant select on public.music_preferences, public.daily_gifts to service_role;
commit;
