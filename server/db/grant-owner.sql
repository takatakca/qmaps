-- In psql, pass -v owner_id=UUID after verifying the handle with its owner.
\set ON_ERROR_STOP on
begin;
select a.user_id as confirmed_user from qmaps_private.accounts a
where a.user_id=:'owner_id'::uuid for update \gset
insert into public.user_roles(user_id,role) values (:'confirmed_user','admin')
on conflict(user_id,role) do nothing;
commit;
