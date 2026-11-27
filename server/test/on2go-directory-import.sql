\set ON_ERROR_STOP on

do $test$
begin
  if current_database() <> 'qmaps_on2go_import_test' then
    raise exception 'Run only against a fresh disposable qmaps_on2go_import_test database';
  end if;
end;
$test$;

insert into public.businesses (id, name, address)
values ('41dfffc9-a155-4ca7-afea-ba60bbb27599', 'QMAPS Démo — Bistro de nuit', 'Adresse de contrôle');

create temporary table original_listings as
select id, name, to_jsonb(b) as data from public.businesses b;
create temporary table example_names (id uuid primary key, old_name text, new_name text);
insert into example_names values
  ('a9bf0001-0000-4000-8000-000000000001', 'QMAPS Démo — Bistro de nuit', 'Bistro de nuit'),
  ('a9bf0001-0000-4000-8000-000000000002', 'QMAPS Démo — Café du quartier', 'Café du quartier'),
  ('a9bf0001-0000-4000-8000-000000000003', 'QMAPS Démo — Atelier de services', 'Atelier de services');

do $test$
begin
  if (select count(*) from original_listings b join example_names e on b.id = e.id
      where b.name = e.old_name) <> 3 then
    raise exception 'Fresh fixture listings are required';
  end if;
end;
$test$;

\ir ../db/imports/on2go-directory.sql

create temporary view on2go_imported_listings as
select b.*, b.attributes #>> '{qmaps_directory_import,external_id}' as external_id
from public.businesses b
where b.attributes #>> '{qmaps_directory_import,source}' = 'on2go.ca';

do $test$
begin
  if (select count(*) from original_listings o
      join example_names e on e.id = o.id
      join public.businesses b on b.id = o.id
      where b.name = e.new_name
        and to_jsonb(b) - array['name', 'updated_at', 'search_document']
           = o.data - array['name', 'updated_at', 'search_document']) <> 3 then
    raise exception 'Example names or preserved listing data differ from expectations';
  end if;

  if exists (
    select 1 from original_listings o left join public.businesses b on b.id = o.id
    where o.id not in (select id from example_names) and to_jsonb(b) is distinct from o.data
  ) then
    raise exception 'The import changed an unrelated listing';
  end if;

  if (select count(*) from on2go_imported_listings) <> 32 or exists (
    with expected as (
      select brand || '@' || kitchen as external_id
      from unnest(array[
        'ppp-pizzeria', 'ooeuf', 'dejeuner-montreal', 'pi-pita', 'pita-libanais',
        'mythos-and-go', 'nutrition-shake', 'bin-molle-bin-dure', 'ocrepe', 'gateaux-montreal',
        'taco-mexican', 'pizza-inntime', 'pizza-algerie', 'po-poulet', 'poulet-poulet',
        'cafe-bolon', 'place-afrique'
      ]) brand
      cross join unnest(array['ndg', 'saint-leonard']) kitchen
      where (brand, kitchen) not in (('po-poulet', 'ndg'), ('pizza-algerie', 'saint-leonard'))
    )
    select 1 from expected
    where external_id not in (select external_id from on2go_imported_listings)
  ) then
    raise exception 'The imported ON2GO listing IDs do not match the source coverage';
  end if;

  if exists (
    select 1 from on2go_imported_listings b
    where b.city <> 'Montréal' or b.region <> 'QC' or b.country <> 'CA'
      or not b.is_active or b.status <> 'open' or b.is_open or b.is_claimed or b.owner_user_id is not null
      or b.description not like '%cuisine partagée%Source : ON2GO.ca.%'
      or b.hours is not null or b.hours_json is not null or b.phone is not null
      or b.price_level is not null or b.reviews_count <> 0 or b.avg_rating <> 0
      or not exists (
        select 1 from public.business_categories bc join public.categories c on c.id = bc.category_id
        where bc.business_id = b.id and c.slug = 'restaurants' and c.is_active
      )
  ) then
    raise exception 'Missing source credit or unsafe business fields on an ON2GO listing';
  end if;

  if (select count(*) from on2go_imported_listings
      where external_id like '%@ndg' and address = '6280 Av Somerled' and postal_code = 'H3X 2B6'
        and latitude = 45.4705921 and longitude = -73.6353129) <> 16
      or (select count(*) from on2go_imported_listings
      where external_id like '%@saint-leonard' and address = '5839 Rue Jean-Talon E' and postal_code = 'H1S 1M4'
        and latitude is null and longitude is null) <> 16 then
    raise exception 'Shared kitchen addresses or coordinates differ from the feed';
  end if;
end;
$test$;

set session authorization qmaps_gateway;
set role anon;
do $test$
begin
  if (select count(*) from public.businesses b
      where b.attributes #>> '{qmaps_directory_import,source}' = 'on2go.ca'
        and b.is_active and b.status = 'open' and lower(unaccent(b.city)) = 'montreal'
        and public.qmaps_can_see_publisher(b.owner_user_id)
        and exists (
          select 1 from public.business_categories bc join public.categories c on c.id = bc.category_id
          where bc.business_id = b.id and c.slug = 'restaurants' and c.is_active
        )) <> 32 then
    raise exception 'Gateway guest role cannot read all 32 Montréal restaurant listings';
  end if;
end;
$test$;
reset role;
reset session authorization;

update public.businesses set name = 'Nom révisé de la fiche', description = 'Description révisée',
  is_active = false, status = 'hidden'
where id = 'e01de00e-6de9-5663-b09b-18284e356a83';
delete from public.business_categories where business_id = 'e01de00e-6de9-5663-b09b-18284e356a83';
update public.businesses set name = 'Nom révisé de l’exemple'
where id = 'a9bf0001-0000-4000-8000-000000000003';

create temporary table before_repeat as
select id, to_jsonb(b) as data from public.businesses b;
create temporary table before_category_repeat as
select business_id, category_id from public.business_categories;

\ir ../db/imports/on2go-directory.sql

do $test$
begin
  if not exists (select 1 from on2go_imported_listings
      where id = 'e01de00e-6de9-5663-b09b-18284e356a83' and external_id = 'ppp-pizzeria@ndg'
        and name = 'Nom révisé de la fiche' and status = 'hidden') then
    raise exception 'Stable ID or preserved ON2GO listing edit was not found';
  end if;
  if exists (
    select 1 from before_repeat s full join public.businesses b on b.id = s.id
    where s.data is distinct from to_jsonb(b)
  ) or exists (
    select 1 from before_category_repeat s
    full join public.business_categories bc using (business_id, category_id)
    where s.business_id is null or bc.business_id is null
  ) then
    raise exception 'Rerunning the import changed existing rows or category assignments';
  end if;
end;
$test$;

\echo ON2GO import verified with rerun, edits, source coverage and exact fixture renaming
