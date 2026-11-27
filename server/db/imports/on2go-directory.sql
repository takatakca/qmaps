-- Operator-run import. See docs/on2go-directory-import.md for scope and verification.
-- Source: https://on2go.ca/directory.json, snapshot 2026-10-16T10:02:28.065Z.
-- Each place ID below is UUIDv5 (URL namespace) of the source URL + '#' + external_id.
\set ON_ERROR_STOP on
begin;
set local lock_timeout = '5s';
select pg_advisory_xact_lock(hashtextextended('QMAPS ON2GO directory import', 0));

do $guard$
begin
  if to_regclass('qmaps_private.accounts') is null
     or to_regclass('qmaps_ops.applied_migrations') is null then
    raise exception 'Run this import against initialized QMAPS PostgreSQL';
  end if;
end;
$guard$;

create temporary table on2go_kitchens (
  id text primary key,
  area text not null,
  address text not null,
  city text not null,
  region text not null,
  postal_code text not null,
  country text not null,
  latitude double precision,
  longitude double precision
) on commit drop;

insert into on2go_kitchens values
  ('ndg', 'Notre-Dame-de-Grâce', '6280 Av Somerled', 'Montréal', 'QC', 'H3X 2B6', 'CA', 45.4705921, -73.6353129),
  ('saint-leonard', 'Saint-Léonard', '5839 Rue Jean-Talon E', 'Montréal', 'QC', 'H1S 1M4', 'CA', null, null);

create temporary table on2go_places (
  id uuid primary key,
  external_id text unique not null,
  name text not null,
  kitchen_id text not null references on2go_kitchens(id),
  cuisine text not null
) on commit drop;

insert into on2go_places values
  ('e01de00e-6de9-5663-b09b-18284e356a83', 'ppp-pizzeria@ndg', 'PPP Pizzeria', 'ndg', 'Pizza, Poulet, Poutine'),
  ('0f08bcd4-ee47-5c42-8c5a-e737ec0c4f22', 'ppp-pizzeria@saint-leonard', 'PPP Pizzeria', 'saint-leonard', 'Pizza, Poulet, Poutine'),
  ('14028e5a-d702-59b2-b6b7-8fd10e0009b6', 'ooeuf@ndg', 'OOEUF', 'ndg', 'Casse-croûte, Burgers, Hot-dogs, Poutine'),
  ('15ac5e6c-5b95-525c-8822-090bd93342f4', 'ooeuf@saint-leonard', 'OOEUF', 'saint-leonard', 'Casse-croûte, Burgers, Hot-dogs, Poutine'),
  ('7765ec41-1689-52e0-b32f-c688bdfc96ae', 'dejeuner-montreal@ndg', 'Déjeuner Montréal', 'ndg', 'Casse-croûte, Trios, Poutine'),
  ('afa0924d-e5f8-5b55-9d6e-a52e9c02b22c', 'dejeuner-montreal@saint-leonard', 'Déjeuner Montréal', 'saint-leonard', 'Casse-croûte, Trios, Poutine'),
  ('e8b9b953-d02a-58cb-860d-79d47514acdb', 'pi-pita@ndg', 'Pi Pita', 'ndg', 'Libanais, Shawarma, Shish taouk'),
  ('1a60fb18-1e6a-5295-82b7-f2a74331739c', 'pi-pita@saint-leonard', 'Pi Pita', 'saint-leonard', 'Libanais, Shawarma, Shish taouk'),
  ('2dca42d1-1734-5683-a4df-79d724ff09f6', 'pita-libanais@ndg', 'Pita Libanais', 'ndg', 'Libanais, Repas familiaux, Shish taouk'),
  ('db227972-828e-51cf-b85e-b7f2a960d817', 'pita-libanais@saint-leonard', 'Pita Libanais', 'saint-leonard', 'Libanais, Repas familiaux, Shish taouk'),
  ('b1d2efcb-f75a-55b8-918b-2a8bb1c97ef1', 'mythos-and-go@ndg', 'Mythos & Go', 'ndg', 'Grec, Gyros, Souvlaki'),
  ('7b196458-adb2-5856-8520-a9b39c90f74b', 'mythos-and-go@saint-leonard', 'Mythos & Go', 'saint-leonard', 'Grec, Gyros, Souvlaki'),
  ('c1f66f26-e43d-586b-a3d9-3261a0bd510c', 'nutrition-shake@ndg', 'Nutrition Shake', 'ndg', 'Santé, Salades protéinées, Végétarien'),
  ('96278722-4c7b-5b3a-ab42-cba3682d221c', 'nutrition-shake@saint-leonard', 'Nutrition Shake', 'saint-leonard', 'Santé, Salades protéinées, Végétarien'),
  ('94873802-69c3-5ae7-b601-eed658ac0f89', 'bin-molle-bin-dure@ndg', 'Bin Molle & Bin Dure', 'ndg', 'Crèmerie, Desserts'),
  ('69b57563-ad97-511a-85c9-921b81872431', 'bin-molle-bin-dure@saint-leonard', 'Bin Molle & Bin Dure', 'saint-leonard', 'Crèmerie, Desserts'),
  ('0cf279e2-e982-59cb-a1bd-3865aa9450aa', 'ocrepe@ndg', 'OCRÊPE', 'ndg', 'Crêpes, Gaufres, Desserts'),
  ('d762956d-9ba9-5744-9119-0eef8f8b6ec4', 'ocrepe@saint-leonard', 'OCRÊPE', 'saint-leonard', 'Crêpes, Gaufres, Desserts'),
  ('375e8091-87f5-59db-95c5-bf157aa0daf7', 'gateaux-montreal@ndg', 'Gâteaux Montréal', 'ndg', 'Pâtisserie, Gâteaux, Cheesecakes'),
  ('e00d4085-6155-5b3c-82ed-d345ce51d6fc', 'gateaux-montreal@saint-leonard', 'Gâteaux Montréal', 'saint-leonard', 'Pâtisserie, Gâteaux, Cheesecakes'),
  ('a9b41ad1-a6f1-5943-9f89-fa4962d677cb', 'taco-mexican@ndg', 'Taco Mexican', 'ndg', 'Mexicain, Tacos, Burritos, Nachos'),
  ('98b6f75c-0d95-52cd-90a4-125503fbd058', 'taco-mexican@saint-leonard', 'Taco Mexican', 'saint-leonard', 'Mexicain, Tacos, Burritos, Nachos'),
  ('31c24bc2-6206-5314-a3c4-3bb775c94708', 'pizza-inntime@ndg', 'Pizza Inntime', 'ndg', 'Pizzeria, Pizza'),
  ('48157ca0-bdcb-5723-ac29-2318f130b9d2', 'pizza-inntime@saint-leonard', 'Pizza Inntime', 'saint-leonard', 'Pizzeria, Pizza'),
  ('2f6ddfe1-6f14-5f63-9eb6-a373bdbdf016', 'pizza-algerie@ndg', 'Pizza Algérie', 'ndg', 'Pizza, Combos pizza'),
  ('26e9b592-da74-5704-8ab2-e7b6494bcd73', 'po-poulet@saint-leonard', 'Po Poulet', 'saint-leonard', 'Poulet frit, Ailes, Burgers poulet'),
  ('aa966693-d4f8-5b0c-a591-df799d78c421', 'poulet-poulet@ndg', 'Poulet Poulet', 'ndg', 'Ailes de poulet, Croquettes'),
  ('da5c8abc-4c80-563d-b673-5fdc9c60600e', 'poulet-poulet@saint-leonard', 'Poulet Poulet', 'saint-leonard', 'Ailes de poulet, Croquettes'),
  ('3c650268-46d9-572d-a666-86357c12ffba', 'cafe-bolon@ndg', 'Café Bolon', 'ndg', 'Latino-américain, Empanadas, Nachos'),
  ('382092ca-f5fa-55da-b2b2-7d3507b365e4', 'cafe-bolon@saint-leonard', 'Café Bolon', 'saint-leonard', 'Latino-américain, Empanadas, Nachos'),
  ('38df69b9-6173-5768-a45d-c0c2f3b31c8c', 'place-afrique@ndg', 'Place Afrique', 'ndg', 'Grillades, Bouchées'),
  ('0c94d892-3bc2-5237-99a2-71502232c0cc', 'place-afrique@saint-leonard', 'Place Afrique', 'saint-leonard', 'Grillades, Bouchées');

lock table public.businesses in share row exclusive mode;

do $guard$
begin
  if (select count(*) from public.categories where slug = 'restaurants' and is_active) <> 1 then
    raise exception 'The import requires one active restaurants category';
  end if;

  if exists (
    select 1
    from on2go_places p join public.businesses b on b.id = p.id
    where (b.attributes #>> '{qmaps_directory_import,source}') is distinct from 'on2go.ca'
       or (b.attributes #>> '{qmaps_directory_import,external_id}') is distinct from p.external_id
  ) then
    raise exception 'An ON2GO UUID is already used by an unrelated listing';
  end if;

  if exists (
    select 1
    from on2go_places p
    join public.businesses b
      on b.attributes #>> '{qmaps_directory_import,external_id}' = p.external_id
     and b.attributes #>> '{qmaps_directory_import,source}' = 'on2go.ca'
    where b.id <> p.id
  ) then
    raise exception 'An ON2GO source listing is already mapped to a different UUID';
  end if;

  if exists (
    select 1
    from on2go_places p
    join on2go_kitchens k on k.id = p.kitchen_id
    join public.businesses b
      on regexp_replace(lower(unaccent(b.name)), '[^[:alnum:]]+', '', 'g')
         = regexp_replace(lower(unaccent(p.name)), '[^[:alnum:]]+', '', 'g')
     and lower(unaccent(btrim(b.city))) = lower(unaccent(btrim(k.city)))
     and (
       regexp_replace(
         regexp_replace(lower(unaccent(split_part(b.address, ',', 1))), '\mavenue\M', 'av', 'g'),
         '[^[:alnum:]]+', '', 'g'
       ) = regexp_replace(
         regexp_replace(lower(unaccent(k.address)), '\mavenue\M', 'av', 'g'), '[^[:alnum:]]+', '', 'g'
       )
       or regexp_replace(upper(b.postal_code), '[^A-Z0-9]+', '', 'g')
          = regexp_replace(upper(k.postal_code), '[^A-Z0-9]+', '', 'g')
     )
    where (b.attributes #>> '{qmaps_directory_import,source}') is distinct from 'on2go.ca'
  ) then
    raise exception 'A QMAPS listing overlaps an ON2GO name and location. Reconcile it before importing';
  end if;
end;
$guard$;

with inserted_listings as (
  insert into public.businesses (
    id, name, description, address, city, region, postal_code, country, latitude, longitude,
    is_active, is_open, status, attributes
  )
  select p.id, p.name,
         concat('Enseigne de restauration répertoriée à cette cuisine partagée de ', k.area,
                '. Cuisine : ', p.cuisine, '. Source : ON2GO.ca.'),
         k.address, k.city, k.region, k.postal_code, k.country, k.latitude, k.longitude,
         true, false, 'open',
         jsonb_build_object('qmaps_directory_import', jsonb_build_object(
           'source', 'on2go.ca',
           'external_id', p.external_id,
           'url', 'https://on2go.ca/restaurants/' || split_part(p.external_id, '@', 1) || '/',
           'snapshot_at', '2026-10-16T10:02:28.065Z'
         ))
  from on2go_places p join on2go_kitchens k on k.id = p.kitchen_id
  on conflict (id) do nothing
  returning id
),
inserted_categories as (
  insert into public.business_categories (business_id, category_id)
  select listing.id, category.id
  from inserted_listings listing
  cross join public.categories category
  where category.slug = 'restaurants' and category.is_active
  returning business_id
)
select (select count(*) from inserted_listings) as inserted_listings,
       (select count(*) from inserted_categories) as inserted_categories;

with renamed_listings as (
  update public.businesses b set name = rename.new_name
  from (values
    ('a9bf0001-0000-4000-8000-000000000001'::uuid, 'QMAPS Démo — Bistro de nuit', 'Bistro de nuit'),
    ('a9bf0001-0000-4000-8000-000000000002'::uuid, 'QMAPS Démo — Café du quartier', 'Café du quartier'),
    ('a9bf0001-0000-4000-8000-000000000003'::uuid, 'QMAPS Démo — Atelier de services', 'Atelier de services')
  ) as rename(id, old_name, new_name)
  where b.id = rename.id and b.name = rename.old_name
  returning b.id
)
select count(*) as renamed_example_listings from renamed_listings;

commit;
