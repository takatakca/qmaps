create table public.business_content (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  kind text not null check (kind in ('post', 'action')),
  title text not null check (length(trim(title)) between 1 and 100),
  body text not null default '' check (length(body) <= 2000),
  link_url text check (length(link_url) <= 2048 and link_url ~ '^https://[^/@?#[:space:]]+([/?#][^[:space:]]*)?$'),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  check (kind <> 'action' or link_url is not null)
);
create unique index business_content_one_action on public.business_content (business_id) where kind = 'action';
create index business_content_feed on public.business_content (business_id, kind, created_at desc, id desc);
alter table public.business_content enable row level security;
revoke all on public.business_content from public, anon, authenticated;
grant select on public.business_content to anon, authenticated;
grant insert (id, business_id, kind, title, body, link_url, is_published),
      update (title, body, link_url, is_published) on public.business_content to authenticated;
create policy visible_content on public.business_content for select to anon, authenticated
  using (is_published and exists (select 1 from public.businesses b where b.id = business_id and b.is_active));
create policy manage_own_content on public.business_content for all to authenticated
  using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_user_id = (select auth.uid())));
