create table public.guest_services (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  reservations boolean not null default false,
  waitlist boolean not null default false
);
create table public.guest_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.guest_services(business_id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('reservation','waitlist')),
  guest_name text not null check (length(trim(guest_name)) between 1 and 80),
  party_size int not null check (party_size between 1 and 30),
  requested_time timestamp without time zone,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled','completed')),
  created_at timestamptz not null default now(),
  check ((kind = 'reservation') = (requested_time is not null))
);
create unique index guest_one_open_request on public.guest_requests(user_id,business_id,kind)
  where status in ('pending','accepted');
create index guest_merchant_queue on public.guest_requests(business_id,status,created_at);
alter table public.guest_services enable row level security;
alter table public.guest_requests enable row level security;
revoke all on public.guest_services, public.guest_requests from public, anon, authenticated;
grant select on public.guest_services to anon, authenticated;
grant insert (business_id,reservations,waitlist), update (reservations,waitlist) on public.guest_services to authenticated;
grant select, insert (business_id,kind,guest_name,party_size,requested_time), update (status) on public.guest_requests to authenticated;
create policy visible_services on public.guest_services for select to anon, authenticated
  using (exists (select 1 from public.businesses b where b.id = business_id and b.is_active));
create policy owned_services on public.guest_services for all to authenticated
  using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_user_id = (select auth.uid())));

create policy guest_request_read on public.guest_requests for select to authenticated using (
  user_id = (select auth.uid()) or exists (select 1 from public.businesses b where b.id = business_id and b.owner_user_id = (select auth.uid())));
create policy guest_request_create on public.guest_requests for insert to authenticated with check (
  user_id = (select auth.uid()) and status = 'pending' and
  (requested_time is null or requested_time between timezone('America/Toronto',now()) and timezone('America/Toronto',now()) + interval '1 year') and
  exists (select 1 from public.guest_services s join public.businesses b on b.id=s.business_id
          where s.business_id=guest_requests.business_id and b.is_active and
          ((kind='reservation' and s.reservations) or (kind='waitlist' and s.waitlist))));
create policy guest_request_update on public.guest_requests for update to authenticated
  using (status in ('pending','accepted') and (user_id = (select auth.uid()) or
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_user_id = (select auth.uid()))))
  with check ((user_id = (select auth.uid()) and status = 'cancelled') or
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_user_id = (select auth.uid())));
create function public.check_guest_transition() returns trigger language plpgsql set search_path = '' as $$
begin
  if not ((old.status = 'pending' and new.status in ('accepted','declined','cancelled'))
     or (old.status = 'accepted' and new.status in ('completed','cancelled'))) then
    raise exception 'Invalid request transition' using errcode='23514';
  end if;
  return new;
end $$;
revoke all on function public.check_guest_transition() from public, anon, authenticated;
create trigger guest_request_transition before update on public.guest_requests for each row execute function public.check_guest_transition();
