-- Run once in the Supabase SQL editor before deploying the message centre.
-- Existing enquiries start unread; their workflow status and content are preserved.
begin;
alter table public.enquiries add column if not exists read_at timestamptz;
grant update(read_at) on public.enquiries to authenticated;
-- Existing owner-only SELECT, UPDATE and DELETE policies continue to apply.
commit;
