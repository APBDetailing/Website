-- Run once in a new Supabase project's SQL editor. No secrets belong in this file.
begin;
create table public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admin_users enable row level security;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.admin_users where user_id=(select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon,authenticated,service_role;
create policy own_admin on public.admin_users for select to authenticated using(user_id=(select auth.uid()));
grant select on public.admin_users to authenticated;

create table public.services (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 100),
 description text not null default '' check(length(description)<=2000), enabled boolean not null default true,
 display_order integer not null default 0, image_path text,
 price_mode text not null default 'request' check(price_mode in ('request','fixed','from')),
 price numeric(10,2) check(price>=0), pricing_description text not null default '' check(length(pricing_description)<=500),
 show_price boolean not null default false,
 check(price_mode='request' or price is not null)
);
create table public.business_settings (
 id integer primary key default 1 check(id=1),telephone text not null default '',email text not null default '',
 address text not null default '',show_address boolean not null default false,service_area text not null default 'Selby, North Yorkshire',
 opening_hours text not null default '',facebook_url text not null default '',instagram_url text not null default '',
 whatsapp text not null default '',show_prices boolean not null default false,
 check(length(address)<=1000 and length(opening_hours)<=1000 and length(service_area)<=150),
 check(length(telephone)<=30 and length(whatsapp)<=30 and length(email)<=254),
 check(facebook_url='' or facebook_url ~ '^https://'), check(instagram_url='' or instagram_url ~ '^https://')
);
create table public.showcase_entries (
 id uuid primary key default gen_random_uuid(),name text not null check(length(name) between 1 and 150),
 year integer check(year between 1900 and 2100),description text not null default '' check(length(description)<=5000),
 service_ids uuid[] not null default '{}',published boolean not null default false,featured boolean not null default false,
 display_order integer not null default 0,featured_image_id uuid,deleting boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.showcase_images (
 id uuid primary key default gen_random_uuid(),entry_id uuid not null references public.showcase_entries(id) on delete cascade,
 slot smallint not null check(slot between 1 and 10),path text not null unique,
 alt text not null default '' check(length(alt)<=300),role text not null default 'general' check(role in ('general','before','after')),
 display_order integer not null default 0,status text not null default 'pending' check(status in ('pending','ready')),
 created_at timestamptz not null default now(),unique(entry_id,slot)
);
-- The unique slot + range constraint is the concurrency-safe hard ceiling, independent of UI/RPC.
create unique index one_comparison_role on public.showcase_images(entry_id,role) where role in ('before','after');
create table public.enquiries (
 id uuid primary key default gen_random_uuid(),created_at timestamptz not null default now(),
 name text not null check(length(name) between 1 and 100),email text not null check(length(email)<=254),
 telephone text not null check(length(telephone) between 7 and 30),vehicle text not null default '' check(length(vehicle)<=150),
 service_id uuid references public.services(id) on delete set null,service_name text not null,
 message text not null check(length(message) between 10 and 5000),privacy_acknowledged boolean not null check(privacy_acknowledged),
 status text not null default 'New' check(status in ('New','Contacted','Closed'))
);
create table public.rate_limits (key text primary key,window_start timestamptz not null,count integer not null);
alter table public.services enable row level security;
alter table public.business_settings enable row level security;
alter table public.showcase_entries enable row level security;
alter table public.showcase_images enable row level security;
alter table public.enquiries enable row level security;
alter table public.rate_limits enable row level security;
create policy public_services on public.services for select to anon,authenticated using(enabled or public.is_admin());
create policy edit_services on public.services for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy settings_admin on public.business_settings for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy public_entries on public.showcase_entries for select to anon,authenticated using((published and not deleting) or public.is_admin());
create policy insert_entries on public.showcase_entries for insert to authenticated with check(public.is_admin() and not deleting);
create policy update_entries on public.showcase_entries for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy public_photos on public.showcase_images for select to anon,authenticated using(public.is_admin() or (status='ready' and exists(select 1 from public.showcase_entries e where e.id=entry_id and e.published and not e.deleting)));
create policy edit_photo_details on public.showcase_images for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy read_enquiries on public.enquiries for select to authenticated using(public.is_admin());
create policy update_enquiries on public.enquiries for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy delete_enquiries on public.enquiries for delete to authenticated using(public.is_admin());
-- Public settings are a deliberately masked view. The base table has NO public grants.
create view public.public_business_settings with (security_barrier=true) as
 select id,telephone,email,case when show_address then address else '' end as address,show_address,
 service_area,opening_hours,facebook_url,instagram_url,whatsapp,show_prices from public.business_settings where id=1;
revoke all on all tables in schema public from anon,authenticated;
grant select on public.public_business_settings,public.services,public.showcase_entries,public.showcase_images to anon,authenticated;
grant select on public.admin_users,public.business_settings,public.enquiries to authenticated;
grant update(name,description,enabled,display_order,price_mode,price,pricing_description,show_price) on public.services to authenticated;
grant update(telephone,email,address,show_address,service_area,opening_hours,facebook_url,instagram_url,whatsapp,show_prices) on public.business_settings to authenticated;
grant insert(name,year,description,service_ids,published,featured,display_order) on public.showcase_entries to authenticated;
grant update(name,year,description,service_ids,published,featured,display_order,featured_image_id) on public.showcase_entries to authenticated;
grant update(alt,role,display_order) on public.showcase_images to authenticated;
grant update(status),delete on public.enquiries to authenticated;
grant all on all tables in schema public to service_role;

create function public.validate_showcase() returns trigger language plpgsql set search_path='' as $$
begin
 if new.published and (new.deleting or not exists(select 1 from public.showcase_images where entry_id=new.id and status='ready')) then
   raise exception 'Add at least one photograph before publishing.';
 end if;
 if new.featured_image_id is not null and not exists(select 1 from public.showcase_images where id=new.featured_image_id and entry_id=new.id and status='ready') then
   raise exception 'Choose a ready photograph belonging to this vehicle.';
 end if;
 if exists(select 1 from unnest(new.service_ids) x where not exists(select 1 from public.services s where s.id=x)) then
   raise exception 'Choose valid services.';
 end if;
 return new;
end;$$;
create trigger validate_showcase before insert or update on public.showcase_entries for each row execute function public.validate_showcase();

create function public.reserve_photo(p_entry uuid) returns public.showcase_images language plpgsql security definer set search_path='' as $$
declare n integer;image_id uuid:=gen_random_uuid();result public.showcase_images;
begin
 perform 1 from public.showcase_entries where id=p_entry and not deleting for update;
 if not found then raise exception 'Vehicle unavailable.';end if;
 select s into n from generate_series(1,10) s where not exists(select 1 from public.showcase_images i where i.entry_id=p_entry and i.slot=s) order by s limit 1;
 if n is null then raise exception 'Maximum 10 photographs per vehicle.';end if;
 insert into public.showcase_images(id,entry_id,slot,path,display_order) values(image_id,p_entry,n,'vehicles/'||p_entry||'/'||image_id||'.webp',n) returning * into result;
 return result;
end;$$;
create function public.finish_photo(p_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare vehicle uuid;
begin
 select entry_id into vehicle from public.showcase_images where id=p_id;
 perform 1 from public.showcase_entries where id=vehicle and not deleting for update;
 if not found then return false;end if;
 update public.showcase_images set status='ready' where id=p_id;
 return found;
end;$$;
create function public.begin_delete_entry(p_entry uuid) returns void language sql security definer set search_path='' as $$
 update public.showcase_entries set published=false,deleting=true where id=p_entry;
$$;
create function public.prepare_delete_photo(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare vehicle uuid;
begin
 select entry_id into vehicle from public.showcase_images where id=p_id;
 perform 1 from public.showcase_entries where id=vehicle for update;
 update public.showcase_entries set featured_image_id=case when featured_image_id=p_id then null else featured_image_id end,
 published=published and exists(select 1 from public.showcase_images where entry_id=vehicle and id<>p_id and status='ready') where id=vehicle;
 -- Block public access before deleting the object.
 update public.showcase_images set status='pending' where id=p_id;
end;$$;
create function public.consume_rate_limit(p_key text,p_seconds integer,p_limit integer) returns boolean language plpgsql security definer set search_path='' as $$
declare hits integer;
begin
 delete from public.rate_limits where window_start<now()-interval '1 day';
 insert into public.rate_limits(key,window_start,count) values(p_key,now(),1)
 on conflict(key) do update set count=case when rate_limits.window_start<now()-make_interval(secs=>p_seconds) then 1 else rate_limits.count+1 end,
 window_start=case when rate_limits.window_start<now()-make_interval(secs=>p_seconds) then now() else rate_limits.window_start end returning count into hits;
 return hits<=p_limit;
end;$$;
revoke all on function public.reserve_photo(uuid),public.finish_photo(uuid),public.begin_delete_entry(uuid),public.prepare_delete_photo(uuid),public.consume_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.reserve_photo(uuid),public.finish_photo(uuid),public.begin_delete_entry(uuid),public.prepare_delete_photo(uuid),public.consume_rate_limit(text,integer,integer) to service_role;

insert into public.business_settings(id) values(1);
insert into public.services(id,name,description,display_order) values
 ('00000000-0000-4000-8000-000000000001','Expert Hand Wash','Professional exterior hand washing designed to remove dirt and grime while caring for the vehicle’s finish.',0),
 ('00000000-0000-4000-8000-000000000002','Paint Correction','Machine polishing and paint enhancement to improve the appearance of swirl marks, light scratches and paint imperfections.',1),
 ('00000000-0000-4000-8000-000000000003','Ceramic Coating','Protective coatings designed to enhance gloss and make ongoing vehicle maintenance easier.',2),
 ('00000000-0000-4000-8000-000000000004','Interior Deep Clean','Thorough interior cleaning covering upholstery, carpets, surfaces and difficult-to-reach areas.',3),
 ('00000000-0000-4000-8000-000000000005','Wheel & Tyre Polish','Wheel cleaning and tyre finishing to improve the appearance of the vehicle’s wheels and tyres.',4);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('apb-media','apb-media',false,512000,array['image/webp']);
-- No browser upload/update/delete policy: all storage writes pass through checked Pages Functions.
create policy read_apb_media on storage.objects for select to anon,authenticated using(bucket_id='apb-media' and (
 public.is_admin() or exists(select 1 from public.showcase_images i join public.showcase_entries e on e.id=i.entry_id where i.path=storage.objects.name and i.status='ready' and e.published and not e.deleting)
 or exists(select 1 from public.services s where s.image_path=storage.objects.name and s.enabled)
));
commit;
