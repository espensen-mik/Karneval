-- Shared editorial flag; existing private RLS and grants remain unchanged.
alter table public.survey_responses add column is_favorite boolean not null default false;
create index survey_responses_favorites_created_idx on public.survey_responses (created_at desc, id asc) where is_favorite;
