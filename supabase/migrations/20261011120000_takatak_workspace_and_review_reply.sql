-- Link a QMAPS business to a TAKATAK client workspace, and store an owner reply.
-- Additive and nullable. Does not change existing rows.

alter table public.businesses
  add column if not exists takatak_client_id text;

comment on column public.businesses.takatak_client_id is
  'TAKATAK client workspace id. Null until an admin links this business.';

create index if not exists businesses_takatak_client_id_idx
  on public.businesses (takatak_client_id);

alter table public.reviews
  add column if not exists owner_reply text,
  add column if not exists owner_replied_at timestamptz;

comment on column public.reviews.owner_reply is
  'Reply published by the business. Null until a reply is accepted.';
