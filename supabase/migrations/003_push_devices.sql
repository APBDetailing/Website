begin;
create table if not exists public.push_devices (
 installation_id uuid primary key,
 user_id uuid not null references public.admin_users(user_id) on delete cascade,
 token text not null unique check(length(token) between 20 and 4096),
 updated_at timestamptz not null default now()
);
alter table public.push_devices enable row level security;
revoke all on public.push_devices from anon,authenticated;
grant select,insert,update,delete on public.push_devices to service_role;
commit;
