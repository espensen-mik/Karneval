-- Shared quote collection for the Sjælen af Karneval research room.
-- Public visitors may submit quotes for review and read only approved quotes.
-- No public update or delete access is granted.

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_text text not null
    check (char_length(btrim(quote_text)) between 1 and 3000),
  person_name text
    check (person_name is null or char_length(btrim(person_name)) <= 160),
  person_title text
    check (person_title is null or char_length(btrim(person_title)) <= 200),
  organization text
    check (organization is null or char_length(btrim(organization)) <= 200),
  quote_source text
    check (quote_source is null or char_length(btrim(quote_source)) <= 500),
  publication_consent boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(quote_text, '') || ' ' ||
      coalesce(person_name, '') || ' ' ||
      coalesce(person_title, '') || ' ' ||
      coalesce(organization, '') || ' ' ||
      coalesce(quote_source, '')
    )
  ) stored
);

create index if not exists quotes_search_vector_idx
  on public.quotes using gin (search_vector);

create index if not exists quotes_status_created_at_idx
  on public.quotes (status, created_at desc);

alter table public.quotes enable row level security;

grant select, insert on public.quotes to anon, authenticated;

create policy "Visitors can submit quotes for review"
  on public.quotes
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and publication_consent is true
  );

create policy "Visitors can read approved quotes"
  on public.quotes
  for select
  to anon, authenticated
  using (status = 'approved');
