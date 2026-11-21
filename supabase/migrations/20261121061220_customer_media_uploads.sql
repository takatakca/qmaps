-- Customer media has a separate namespace from merchant-controlled covers and albums.
create policy customer_listing_upload on storage.objects for insert to authenticated with check (
  bucket_id='photos' and split_part(name,'/',1)='customer-media'
  and split_part(name,'/',2)=(select auth.uid())::text
  and name ~ '^customer-media/[^/]+/[^/]+/[0-9a-f-]+\.(jpg|png|webp|gif|avif|mp4|webm|mov)$'
  and exists (select 1 from public.businesses b where b.id::text=split_part(storage.objects.name,'/',3) and b.is_active)
);
