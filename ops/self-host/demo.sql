-- The initial migration included illustrative listings. Only hide rows captured during that fresh install.
update public.businesses set status='hidden', is_active=false, is_open=false
where id in (select id from qmaps_ops.initial_examples);

insert into public.businesses (id,name,description,address,city,latitude,longitude,price_level,is_active,is_open,status,attributes,hours_json)
values
  ('a9bf0001-0000-4000-8000-000000000001','QMAPS Démo — Bistro de nuit','Commerce fictif pour essayer la recherche, les horaires et les réservations.','Adresse de démonstration','Montréal',45.5088,-73.554,2,true,true,'open',
   '{"boolean":{"Takes Reservations":true,"Offers Takeout":true}}','{"friday":{"closed":false,"blocks":[{"open":"16:00","close":"03:00"}]},"saturday":{"closed":false,"blocks":[{"open":"16:00","close":"03:00"}]}}'),
  ('a9bf0001-0000-4000-8000-000000000002','QMAPS Démo — Café du quartier','Commerce fictif pour essayer la livraison et les favoris.','Adresse de démonstration','Montréal',45.510,-73.556,1,true,true,'open',
   '{"boolean":{"Offers Delivery":true,"Wheelchair Accessible":true}}','{"monday":{"closed":false,"blocks":[{"open":"08:00","close":"16:00"}]}}'),
  ('a9bf0001-0000-4000-8000-000000000003','QMAPS Démo — Atelier de services','Fiche fictive pour vérifier la recherche à Laval et les collections.','Adresse de démonstration','Laval',45.606,-73.712,1,true,true,'open','{}',null);
insert into public.business_categories(business_id,category_id)
select b.id,c.id from public.businesses b join public.categories c
  on c.slug = case b.id when 'a9bf0001-0000-4000-8000-000000000003' then 'contractors' else 'restaurants' end
where b.id in ('a9bf0001-0000-4000-8000-000000000001','a9bf0001-0000-4000-8000-000000000002','a9bf0001-0000-4000-8000-000000000003')
on conflict do nothing;
