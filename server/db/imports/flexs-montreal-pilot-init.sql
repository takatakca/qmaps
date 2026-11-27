-- Run only through the operator wrapper in one PostgreSQL transaction.
\set ON_ERROR_STOP on
-- The receipt is read after the staging advisory lock, so see commits made
-- by a loader that held the lock first, even with custom connection defaults.
set transaction isolation level read committed;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
set local search_path = pg_catalog, public, pg_temp;
set local timezone = 'UTC';
set local datestyle = 'ISO, YMD';
set local extra_float_digits = 3;

do $guard$
begin
  if to_regclass('qmaps_private.accounts') is null
     or to_regclass('qmaps_ops.applied_migrations') is null then
    raise exception 'Run only against initialized QMAPS PostgreSQL';
  end if;
  if current_user in ('anon','authenticated','qmaps_gateway','service_role')
     or not exists (
       select 1 from pg_namespace n join pg_roles r on r.rolname = current_user
       where n.nspname = 'qmaps_ops' and (r.rolsuper or pg_has_role(r.oid,n.nspowner,'USAGE'))
     ) then
    raise exception 'Run the Montréal pilot only as a QMAPS PostgreSQL operator';
  end if;
  -- The catalogue loader takes the same lock before writing staging.
  perform pg_advisory_xact_lock(hashtextextended('QMAPS FLEXS basic catalogue staging', 0));
end;
$guard$;

create temporary table flexs_montreal_pilot_options (
  action text not null check (action in ('publish','withdraw')),
  batch_id text not null check (batch_id ~ '^mtl-[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9][a-z0-9-]{0,31}$')
) on commit drop;
insert into pg_temp.flexs_montreal_pilot_options values (:'pilot_action', :'pilot_batch');

create temporary table flexs_montreal_pilot_input (
  id_qmaps_propose uuid not null,
  reference_municipale text not null,
  nom text not null,
  adresse_publique text not null,
  ville text not null,
  province text not null,
  categorie_qmaps text not null,
  source text not null,
  licence text not null
) on commit drop;

create temporary table flexs_montreal_pilot_result (result jsonb not null) on commit drop;

create table if not exists qmaps_ops.flexs_montreal_pilot_batches (
  batch_id text primary key,
  manifest_hash text not null check (manifest_hash ~ '^[0-9a-f]{64}$'),
  member_count smallint not null check (member_count between 1 and 24),
  published_at timestamptz not null default clock_timestamp(),
  withdrawal_attempted_at timestamptz,
  withdrawn_count smallint,
  preserved_count smallint,
  check (
    (withdrawal_attempted_at is null and withdrawn_count is null and preserved_count is null)
    or (withdrawal_attempted_at is not null and withdrawn_count is not null and preserved_count is not null
        and withdrawn_count >= 0 and preserved_count >= 0 and withdrawn_count + preserved_count = member_count)
  )
);

-- No FK to the live listing. The receipt remains visible to operators even
-- if a member is later removed by an unrelated catalogue lifecycle.
create table if not exists qmaps_ops.flexs_montreal_pilot_members (
  batch_id text not null references qmaps_ops.flexs_montreal_pilot_batches(batch_id),
  business_id uuid not null unique,
  municipal_ref text not null unique,
  expected_fingerprint text not null check (expected_fingerprint ~ '^[0-9a-f]{64}$'),
  primary key (batch_id,business_id)
);

revoke all on qmaps_ops.flexs_montreal_pilot_batches, qmaps_ops.flexs_montreal_pilot_members
  from public, anon, authenticated, qmaps_gateway, service_role;

create or replace function pg_temp.qmaps_pilot_fold(value text)
returns text language sql stable strict set search_path = pg_catalog, public as $$
  select regexp_replace(lower(public.unaccent(value)), '[^[:alnum:]]+', '', 'g');
$$;

create or replace function pg_temp.qmaps_pilot_montreal(value text)
returns boolean language sql stable strict set search_path = pg_catalog, public as $$
  with city as (select pg_temp.qmaps_pilot_fold(value) as name_key)
  select name_key in ('montreal','montrealnord') or regexp_replace(name_key, '^montreal', '') = any (array[
    'ahuntsiccartierville','anjou','cotedesneigesnotredamedegrace','lachine','lasalle',
    'leplateaumontroyal','plateaumontroyal','lesudouest','sudouest',
    'lilebizard','ilebizard','lilebizardesaintegenevieve','lilebizardsaintegenevieve',
    'ilebizardsaintegenevieve','saintegenevieve','stegenevieve','mercierhochelagamaisonneuve',
    'outremont','pierrefondsroxboro','pierrefonds','roxboro',
    'rivieredesprairiespointeauxtrembles','rivieredesprairies','pointeauxtrembles',
    'rosemontlapetitepatrie','saintlaurent','stlaurent','saintleonard','stleonard',
    'verdun','villemarie','villeraysaintmichelparcextension'
  ]) from city;
$$;

-- Deliberately conservative: street type and punctuation may be expressed
-- differently, but retain the civic number and any direction or unit.
create or replace function pg_temp.qmaps_pilot_street(value text)
returns text language sql stable strict set search_path = pg_catalog, public as $$
  with unaccented as (
    select btrim(regexp_replace(lower(public.unaccent(value)), '[^[:alnum:]]+', ' ', 'g')) as key
  ), endings as (
    select regexp_replace(key, '[[:space:]]+(st|street|rd|road|av|ave|avenue|blvd|boul|boulevard)$', '') as key
    from unaccented
  ), aliases as (
    select regexp_replace(regexp_replace(key, '\m(st|saint)\M', 'saint', 'g'),
      '\m(ste|sainte)\M', 'sainte','g') as key from endings
  )
  select regexp_replace(regexp_replace(key,
    '\m(rue|street|av|ave|avenue|blvd|boul|boulevard|ch|chemin|rd|road)\M', '', 'g'),
    '[[:space:]]+', '', 'g') from aliases;
$$;

create or replace function pg_temp.qmaps_pilot_fingerprint(place public.businesses)
returns text language sql stable strict set search_path = pg_catalog, public as $$
  select encode(sha256(convert_to(jsonb_build_object(
    -- Reviews refresh these three derived values. That must not prevent
    -- withdrawal of an otherwise untouched directory listing.
    'listing', to_jsonb(place) - array['avg_rating','reviews_count','updated_at'],
    'categories', coalesce((
      select jsonb_agg(bc.category_id order by bc.category_id)
      from public.business_categories bc where bc.business_id = (place).id
    ), '[]'::jsonb)
  )::text, 'UTF8')), 'hex');
$$;
