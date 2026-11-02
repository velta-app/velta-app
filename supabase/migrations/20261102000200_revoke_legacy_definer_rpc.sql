-- Harden legacy (v1) SECURITY DEFINER functions flagged by the Supabase
-- advisor: they were callable by anon/authenticated via /rest/v1/rpc.
-- Velta v2 does not use them; the v1 tables are kept untouched.
revoke execute on function public.apply_transaction_balance(text, numeric, uuid, uuid, integer) from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
alter function public.transactions_apply_balance() set search_path = '';
