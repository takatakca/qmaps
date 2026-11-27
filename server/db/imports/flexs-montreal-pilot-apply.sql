-- The operator wrapper has already begun a transaction and loaded the
-- verified CSV. The CSV supplies addresses; staging does not attest them.
\set ON_ERROR_STOP on
do $pilot$
declare
  opts pg_temp.flexs_montreal_pilot_options%rowtype;
  prior qmaps_ops.flexs_montreal_pilot_batches%rowtype;
  matched_snapshot timestamptz;
  expected_counts jsonb;
  actual_counts jsonb;
  v_manifest_hash text;
  restaurants_id uuid;
  v_member_count integer;
  published_count integer := 0;
  v_withdrawn integer := 0;
  v_preserved integer := 0;
  outcome text;
begin
  select * into strict opts from pg_temp.flexs_montreal_pilot_options;
  select count(*), encode(sha256(convert_to(
    coalesce(jsonb_agg(to_jsonb(i) order by i.id_qmaps_propose), '[]'::jsonb)::text, 'UTF8'
  )), 'hex')
  into v_member_count, v_manifest_hash from pg_temp.flexs_montreal_pilot_input i;
  if v_member_count not between 1 and 24 then
    raise exception 'The pilot requires from 1 to 24 verified rows';
  end if;
  if exists (
    select 1 from pg_temp.flexs_montreal_pilot_input i
    where i.ville <> 'Montréal' or i.province <> 'QC' or i.categorie_qmaps <> 'restaurants'
      or i.source <> 'Ville de Montréal — Établissements alimentaires' or i.licence <> 'CC BY 4.0'
      or i.reference_municipale !~ '^[1-9][0-9]{0,19}$'
      or i.nom <> btrim(i.nom) or length(i.nom) not between 2 and 200
      or i.nom ~ '[[:cntrl:]]' or pg_temp.qmaps_pilot_fold(i.nom) !~ '[[:alpha:]]'
      or i.adresse_publique <> btrim(i.adresse_publique) or length(i.adresse_publique) not between 4 and 250
      or i.adresse_publique ~ '[[:cntrl:]]'
      or i.adresse_publique !~ '^[0-9]{1,7}[[:alpha:]]?([[:space:]]*[-–/][[:space:]]*[0-9]{1,7}[[:alpha:]]?)?[ ,]+[^[:cntrl:]]*[[:alpha:]]'
      or pg_temp.qmaps_pilot_street(i.adresse_publique) !~ '[[:alpha:]]'
      or lower(public.unaccent(i.adresse_publique)) ~ 'confidentiel|non disponible|sans adresse|fictif|non attribu'
  ) then
    raise exception 'Invalid Montréal pilot row, source credit, licence or street address';
  end if;
  if exists (select 1 from pg_temp.flexs_montreal_pilot_input group by id_qmaps_propose having count(*) > 1)
     or exists (select 1 from pg_temp.flexs_montreal_pilot_input group by reference_municipale having count(*) > 1)
     or exists (select 1 from pg_temp.flexs_montreal_pilot_input group by pg_temp.qmaps_pilot_fold(nom) having count(*) > 1)
     or exists (select 1 from pg_temp.flexs_montreal_pilot_input group by pg_temp.qmaps_pilot_street(adresse_publique) having count(*) > 1) then
    raise exception 'Duplicate pilot ID, municipal reference, name or address';
  end if;

  select * into prior from qmaps_ops.flexs_montreal_pilot_batches where batch_id = opts.batch_id;
  if found then
    if prior.manifest_hash <> v_manifest_hash or prior.member_count <> v_member_count then
      raise exception 'The manifest does not match this batch receipt';
    end if;
    if prior.withdrawal_attempted_at is not null then
      outcome := 'already_withdrawn';
      v_preserved := prior.preserved_count;
    elsif opts.action = 'publish' then
      outcome := 'already_published';
    else
      -- Lock writes briefly so ownership, listing content, categories and
      -- pending claims cannot change between verification and deactivation.
      lock table public.businesses, public.business_categories in share row exclusive mode;
      lock table public.business_claims, public.business_claim_requests in share mode;
      update public.businesses b set is_active = false
      from qmaps_ops.flexs_montreal_pilot_members m
      where m.batch_id = opts.batch_id and m.business_id = b.id
        and b.is_active and not b.is_claimed and b.owner_user_id is null
        and b.attributes #>> '{qmaps_directory_import,source}' = 'mtl_food'
        and b.attributes #>> '{qmaps_directory_import,external_id}' = m.municipal_ref
        and b.attributes #>> '{qmaps_directory_import,cohort}' = opts.batch_id
        and pg_temp.qmaps_pilot_fingerprint(b) = m.expected_fingerprint
        and not exists (select 1 from public.business_claims c where c.business_id = b.id and c.status in ('pending','approved'))
        and not exists (select 1 from public.business_claim_requests c where c.business_id = b.id and c.status in ('pending','approved'));
      get diagnostics v_withdrawn = row_count;
      v_preserved := v_member_count - v_withdrawn;
      update qmaps_ops.flexs_montreal_pilot_batches
      set withdrawal_attempted_at = clock_timestamp(), withdrawn_count = v_withdrawn,
        preserved_count = v_preserved
      where batch_id = opts.batch_id;
      outcome := case when v_preserved > 0 then 'preserved' else 'withdrawn' end;
    end if;
  elsif opts.action = 'withdraw' then
    raise exception 'No published receipt for this Montréal pilot batch';
  else
    if to_regclass('qmaps_ops.flexs_directory_stage') is null then
      raise exception 'QMAPS FLEXS staging is not initialized';
    end if;
    if to_regclass('qmaps_ops.flexs_directory_snapshots') is null then
      raise exception 'No complete open FLEXS snapshot is staged';
    end if;
    lock table qmaps_ops.flexs_directory_stage in share mode;
    select staged_at, source_counts into matched_snapshot, expected_counts
    from qmaps_ops.flexs_directory_snapshots where source_family = 'open' for share;
    if matched_snapshot is null then
      raise exception 'No complete open FLEXS snapshot is staged';
    end if;
    select jsonb_object_agg(t.source, t.quantity) into actual_counts from (
      select source, count(*) as quantity from qmaps_ops.flexs_directory_stage
      where staged_at = matched_snapshot and licence in ('CC-BY-4.0', 'CC0-1.0') group by source
    ) t;
    if actual_counts is distinct from expected_counts then
      raise exception 'Staged rows do not match the complete open FLEXS snapshot receipt';
    end if;
    if exists (
      select 1 from pg_temp.flexs_montreal_pilot_input i
      where not exists (
        select 1 from qmaps_ops.flexs_directory_stage s
        where s.source = 'mtl_food' and s.licence = 'CC-BY-4.0'
          and s.city = 'Montréal' and s.trade = 'Restaurant' and s.staged_at = matched_snapshot
          and s.source_ref = i.reference_municipale and s.flexs_id = i.id_qmaps_propose
          and pg_temp.qmaps_pilot_fold(s.name) = pg_temp.qmaps_pilot_fold(i.nom)
      )
    ) then
      raise exception 'A candidate is not in the latest staged Montréal restaurant cohort';
    end if;
    if exists (
      select 1 from pg_temp.flexs_montreal_pilot_input i
      join qmaps_ops.flexs_montreal_pilot_members m
        on m.business_id = i.id_qmaps_propose or m.municipal_ref = i.reference_municipale
    ) then
      raise exception 'A candidate already belongs to a Montréal pilot receipt';
    end if;

    -- Compare normalized names and alternate names with other staged open
    -- data because the pilot preview did not select ambiguous stage rows.
    if exists (
      with inputs as (
        select i.id_qmaps_propose, pg_temp.qmaps_pilot_fold(i.nom) as name_key,
          nullif(pg_temp.qmaps_pilot_fold(stage.other_name), '') as alias_key
        from pg_temp.flexs_montreal_pilot_input i
        join qmaps_ops.flexs_directory_stage stage on stage.flexs_id = i.id_qmaps_propose
      )
      select 1 from qmaps_ops.flexs_directory_stage s join inputs i on s.flexs_id <> i.id_qmaps_propose
      where s.licence in ('CC-BY-4.0','CC0-1.0') and pg_temp.qmaps_pilot_montreal(s.city)
        and s.staged_at = matched_snapshot
        and (pg_temp.qmaps_pilot_fold(s.name) in (i.name_key,i.alias_key)
          or pg_temp.qmaps_pilot_fold(s.other_name) in (i.name_key,i.alias_key))
    ) then
      raise exception 'A candidate collides with another staged Montréal name or alias';
    end if;
    select id into restaurants_id from public.categories where slug = 'restaurants' and is_active for share;
    if restaurants_id is null then
      raise exception 'The pilot requires an active restaurants category';
    end if;
    lock table public.businesses, public.business_categories in share row exclusive mode;
    if exists (
      with inputs as (
        select i.*, pg_temp.qmaps_pilot_fold(i.nom) as name_key,
          nullif(pg_temp.qmaps_pilot_fold(s.other_name), '') as alias_key,
          pg_temp.qmaps_pilot_street(i.adresse_publique) as address_key
        from pg_temp.flexs_montreal_pilot_input i
        join qmaps_ops.flexs_directory_stage s on s.flexs_id = i.id_qmaps_propose
      )
      select 1 from public.businesses b join inputs i on
        b.id = i.id_qmaps_propose
        or (b.attributes #>> '{qmaps_directory_import,source}' = 'mtl_food'
          and b.attributes #>> '{qmaps_directory_import,external_id}' = i.reference_municipale)
        or (pg_temp.qmaps_pilot_montreal(b.city)
          and (pg_temp.qmaps_pilot_fold(b.name) in (i.name_key,i.alias_key)
            or pg_temp.qmaps_pilot_street(b.address) = i.address_key))
    ) then
      raise exception 'A candidate collides with an existing QMAPS ID, source reference, Montréal name or street address';
    end if;

    insert into public.businesses (
      id, name, address, city, region, country, latitude, longitude, owner_user_id,
      is_claimed, is_active, status, is_open, hours, hours_json, special_hours, attributes
    )
    select i.id_qmaps_propose, i.nom, i.adresse_publique, i.ville, 'QC', 'CA', null, null, null,
      false, true, 'open', false, null, null, null,
      jsonb_build_object('qmaps_directory_import', jsonb_build_object(
        'source','mtl_food','external_id',i.reference_municipale,'licence','CC-BY-4.0','cohort',opts.batch_id))
    from pg_temp.flexs_montreal_pilot_input i;
    get diagnostics published_count = row_count;
    if published_count <> v_member_count then
      raise exception 'The inserted counts do not match the pilot batch';
    end if;
    insert into public.business_categories(business_id,category_id)
    select id_qmaps_propose, restaurants_id from pg_temp.flexs_montreal_pilot_input;
    insert into qmaps_ops.flexs_montreal_pilot_batches (batch_id,manifest_hash,member_count)
    values (opts.batch_id,v_manifest_hash,v_member_count);
    insert into qmaps_ops.flexs_montreal_pilot_members (batch_id,business_id,municipal_ref,expected_fingerprint)
    select opts.batch_id, b.id, i.reference_municipale, pg_temp.qmaps_pilot_fingerprint(b)
    from pg_temp.flexs_montreal_pilot_input i join public.businesses b on b.id = i.id_qmaps_propose;
    outcome := 'published';
  end if;

  insert into pg_temp.flexs_montreal_pilot_result values (jsonb_build_object(
    'batch', opts.batch_id, 'action', opts.action, 'status', outcome,
    'members', v_member_count, 'published', published_count,
    'withdrawn', v_withdrawn, 'preserved', v_preserved
  ));
end;
$pilot$;
select result from pg_temp.flexs_montreal_pilot_result;
