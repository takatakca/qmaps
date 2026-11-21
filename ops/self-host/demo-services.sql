-- Stable demonstration fixtures. The install ledger runs this file only once.
insert into public.guest_services (business_id,reservations,waitlist)
values ('a9bf0001-0000-4000-8000-000000000001',true,true)
on conflict (business_id) do nothing;

insert into public.business_content (id,business_id,kind,title,body,is_published)
values ('a9bf0002-0000-4000-8000-000000000001','a9bf0001-0000-4000-8000-000000000001','post',
 'Essayer les réservations du bistro','Cette fiche est fictive. Connectez-vous pour essayer une demande de table ou une inscription à la liste d’attente.',true)
on conflict (id) do nothing;
