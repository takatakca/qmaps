\set ON_ERROR_STOP on
begin;
set local lock_timeout = '5s';

-- Keep the expression and UUID tie-breaker in sync with directoryResults.
-- Account-specific visibility stays in the query, not in this shared index.
create index if not exists qmaps_directory_recommended_rank_idx
  on public.businesses ((case when avg_rating = 0 then 0::float8
    else -(avg_rating::float8 * log(10 + greatest(0, reviews_count)::float8)) end), id)
  where is_active and status in ('open', 'temporarily_closed', 'seasonal');

commit;
