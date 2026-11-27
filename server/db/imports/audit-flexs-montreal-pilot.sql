-- Operator-only receipt and current public catalogue counts. This does not
-- run the publisher or determine which rows a past withdrawal preserved.
\set ON_ERROR_STOP on
\if :{?pilot_batch}
\else
  \set pilot_batch ''
\endif

begin isolation level repeatable read read only;
set local lock_timeout = '5s';
set local statement_timeout = '15s';
set local search_path = pg_catalog, public, pg_temp;
set local timezone = 'UTC';
select set_config('qmaps.audit_pilot_batch', :'pilot_batch', true) as audit_input
\gset

do $audit$
declare
  target_batch text := current_setting('qmaps.audit_pilot_batch');
  receipt_members integer;
  valid_receipt boolean;
begin
  if target_batch !~ '^mtl-[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9][a-z0-9-]{0,31}$' then
    raise exception 'Missing or invalid Montréal pilot batch identifier';
  end if;
  if to_regclass('qmaps_private.accounts') is null
     or to_regclass('qmaps_ops.applied_migrations') is null then
    raise exception 'Run only against initialized QMAPS PostgreSQL';
  end if;
  if current_user in ('anon','authenticated','qmaps_gateway','service_role')
     or not exists (
       select 1 from pg_namespace n join pg_roles r on r.rolname = current_user
       where n.nspname = 'qmaps_ops' and (r.rolsuper or pg_has_role(r.oid,n.nspowner,'USAGE'))
     ) then
    raise exception 'Run the Montréal pilot audit only as a QMAPS PostgreSQL operator';
  end if;
  if to_regclass('qmaps_ops.flexs_montreal_pilot_batches') is null
     or to_regclass('qmaps_ops.flexs_montreal_pilot_members') is null then
    raise exception 'No published receipt for this Montréal pilot batch';
  end if;

  select r.member_count, r.manifest_hash ~ '^[0-9a-f]{64}$'
    and r.member_count between 1 and 24 and isfinite(r.published_at)
    and case when r.withdrawal_attempted_at is null
      then r.withdrawn_count is null and r.preserved_count is null
      else isfinite(r.withdrawal_attempted_at) and r.withdrawn_count >= 0 and r.preserved_count >= 0
        and r.withdrawn_count + r.preserved_count = r.member_count
    end
  into receipt_members, valid_receipt
  from qmaps_ops.flexs_montreal_pilot_batches r where r.batch_id = target_batch;
  if not found then
    raise exception 'No published receipt for this Montréal pilot batch';
  end if;
  if valid_receipt is distinct from true then
    raise exception 'Invalid Montréal pilot receipt';
  end if;
  if receipt_members <> (select count(*) from qmaps_ops.flexs_montreal_pilot_members m
                         where m.batch_id = target_batch) then
    raise exception 'Montréal pilot receipt member count does not match persisted membership';
  end if;
end;
$audit$;

with current_members as (
  select b.id,
    -- Guest catalogue visibility ignores publisher blocks for signed-in
    -- viewers because a guest has no viewer ID.
    b.is_active and b.status in ('open','temporarily_closed','seasonal') as visible,
    b.attributes #>> '{qmaps_directory_import,source}' = 'mtl_food'
      and b.attributes #>> '{qmaps_directory_import,external_id}' = m.municipal_ref
      and b.attributes #>> '{qmaps_directory_import,licence}' = 'CC-BY-4.0'
      and b.attributes #>> '{qmaps_directory_import,cohort}' = m.batch_id as has_credit
  from qmaps_ops.flexs_montreal_pilot_members m
  left join public.businesses b on b.id = m.business_id
  where m.batch_id = current_setting('qmaps.audit_pilot_batch')
)
select jsonb_build_object(
  'batch', r.batch_id,
  'manifest_hash', r.manifest_hash,
  'manifest_hash_kind', 'canonical PostgreSQL rows SHA-256, not raw CSV',
  'receipt_member_count', r.member_count,
  'persisted_member_count', (select count(*) from current_members),
  'current_listing_count', (select count(id) from current_members),
  'current_visible_count', (select count(*) from current_members where visible),
  'current_visible_credited_count', (select count(*) from current_members where visible and has_credit),
  'published_at', r.published_at,
  'withdrawal_attempted_at', r.withdrawal_attempted_at,
  'withdrawn_count', r.withdrawn_count,
  'preserved_count', r.preserved_count
)
from qmaps_ops.flexs_montreal_pilot_batches r
where r.batch_id = current_setting('qmaps.audit_pilot_batch');
commit;
