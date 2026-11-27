\set ON_ERROR_STOP on
begin;
do $$
begin
  if not exists (
    select 1 from pg_index where indexrelid = to_regclass('public.qmaps_directory_recommended_rank_idx')
      and indrelid = 'public.businesses'::regclass and indisvalid and indisready
  ) then
    raise exception 'The recommended directory index must be usable after standalone migration';
  end if;
end;
$$;

-- Synthetic visibility, ordering, sparse-cursor and service fixtures for the
-- disposable standalone CI database. Never load them on a live deployment.
insert into public.businesses(
  id,name,city,address,latitude,longitude,price_level,is_open,hours,amenities,attributes,
  avg_rating,reviews_count,created_at,status,is_active
) values
  ('f00d0000-0000-4000-8000-000000000001','Café Pour ici','QMAPS QA Results','Fictif',
    46.8100,-71.213,2,true,null,'{}','{"boolean":{"Óffers Delivery":true,"wheelchair accessible":true}}',
    4.5,5,'2026-01-01Z','open',true),
  ('f00d0000-0000-4000-8000-000000000002','Fermé Pour test','QMAPS QA Results','Fictif',
    46.8600,-71.213,3,true,'Fermé ce mois-ci','{"Offers Delivery","Wheelchair Accessible"}','{"single":{"wifi":"Free"}}',
    4.5,30,'2026-02-01Z','open',true),
  ('f00d0000-0000-4000-8000-000000000003','Statut de vente','QMAPS QA Results','Fictif',
    null,null,4,true,null,'{"Offers Takeout"}','{}',
    4,3,'2026-03-01Z','temporarily_closed',true),
  ('f00d0000-0000-4000-8000-000000000004','Invisible au public','QMAPS QA Results','Fictif',
    46.8100,-71.213,2,true,null,'{}','{}',
    5,90,'2026-04-01Z','open',false),
  ('f00d0000-0000-4000-8000-000000000005','Autre endroit','QMAPS QA Results','Fictif',
    46.9512,-71.213,2,false,null,'{"Offers Takeout"}','{"boolean":{"Offers Takeout":false,"Takes Reservations":true}}',
    4,60,'2026-01-01Z','open',true);
insert into public.business_categories(business_id,category_id)
select 'f00d0000-0000-4000-8000-000000000001',id
from public.categories where slug='contractors' and is_active;

insert into public.businesses(id,name,city,address,latitude,longitude,is_open,attributes)
select ('f00d1000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,
  'Suite fictive ' || n::text,'QMAPS QA Results Sparse','Fictif',null,null,false,
  jsonb_build_object('boolean',jsonb_build_object('Offers Delivery',n = 386))
from generate_series(1,386) n;
commit;
