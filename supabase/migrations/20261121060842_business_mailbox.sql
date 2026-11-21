-- Each conversation is bound to its business, its customer and the merchant who received it.
create table public.business_mail (
  id uuid primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  merchant_id uuid not null references auth.users(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  check (customer_id <> merchant_id and author_id in (customer_id, merchant_id))
);
create index business_mail_thread on public.business_mail(business_id,merchant_id,customer_id,created_at desc,id desc);
create index business_mail_customer on public.business_mail(customer_id,created_at desc);
alter table public.business_mail enable row level security;
revoke all on public.business_mail from public, anon, authenticated;
grant select, insert(id,business_id,customer_id,merchant_id,body) on public.business_mail to authenticated;
create policy participants_read_mail on public.business_mail for select to authenticated using (
  customer_id = (select auth.uid()) or (merchant_id = (select auth.uid()) and exists (
    select 1 from public.businesses b where b.id = business_id and b.owner_user_id = (select auth.uid()))));
create policy participants_send_mail on public.business_mail for insert to authenticated with check (
  author_id = (select auth.uid()) and exists (
    select 1 from public.businesses b where b.id = business_id and b.owner_user_id = merchant_id and b.is_active
  ) and (customer_id = (select auth.uid()) or merchant_id = (select auth.uid())));
-- Check the prior customer message with ordinary participant visibility, outside policy expansion.
create function public.check_business_reply() returns trigger language plpgsql set search_path='' as $$
begin
  if new.author_id = new.merchant_id and not exists (
    select 1 from public.business_mail m where m.business_id = new.business_id and m.merchant_id = new.merchant_id
      and m.customer_id = new.customer_id and m.author_id = new.customer_id
  ) then raise exception 'Customer must start the conversation' using errcode='42501'; end if;
  return new;
end $$;
revoke all on function public.check_business_reply() from public, anon, authenticated;
create trigger business_reply before insert on public.business_mail for each row execute function public.check_business_reply();
create view public.business_mail_threads with (security_invoker=true) as
  select distinct on (business_id,merchant_id,customer_id) business_id,merchant_id,customer_id,
    m.id,m.created_at,m.body,b.name as business_name
  from public.business_mail m join public.businesses b on b.id=m.business_id
  order by business_id,merchant_id,customer_id,m.created_at desc,m.id desc;
revoke all on public.business_mail_threads from public, anon, authenticated;
grant select on public.business_mail_threads to authenticated;
