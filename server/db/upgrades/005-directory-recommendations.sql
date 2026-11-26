begin;
create table if not exists public.qmaps_directory_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  viewed_at timestamptz,
  dismissed boolean not null default false,
  primary key (user_id, business_id)
);
create index if not exists qmaps_directory_preferences_recent
  on public.qmaps_directory_preferences(user_id, viewed_at desc nulls last);
alter table public.qmaps_directory_preferences enable row level security;
drop policy if exists qmaps_directory_preferences_own on public.qmaps_directory_preferences;
create policy qmaps_directory_preferences_own on public.qmaps_directory_preferences
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update on public.qmaps_directory_preferences to authenticated;
commit;
