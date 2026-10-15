-- Only editorial additions are persisted. Automatic counts always use live texts.
-- Same no-login test access as quotes; no additional grants on existing tables.
create table public.soul_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  description text not null default '' check (char_length(description) <= 600),
  color text not null check (color in ('#c25148','#42636c','#9a754b','#827286','#687a59')),
  terms text[] not null default '{}' check (cardinality(terms) <= 300 and array_position(terms, null) is null),
  archived boolean not null default false,
  updated_at timestamptz not null default now()
);
create table public.soul_synonyms (
  id uuid primary key default gen_random_uuid(),
  label text not null unique check (char_length(btrim(label)) between 1 and 100),
  terms text[] not null check (cardinality(terms) between 2 and 300 and array_position(terms, null) is null and label = any(terms)),
  updated_at timestamptz not null default now()
);
create table public.soul_links (
  id uuid primary key default gen_random_uuid(),
  source_term text not null check (char_length(btrim(source_term)) between 1 and 100),
  target_term text not null check (char_length(btrim(target_term)) between 1 and 100),
  note text not null check (char_length(btrim(note)) between 1 and 1200),
  example_quote_id uuid references public.quotes(id) on delete set null,
  updated_at timestamptz not null default now(),
  check (source_term < target_term),
  unique(source_term, target_term)
);
create index soul_links_example_idx on public.soul_links(example_quote_id) where example_quote_id is not null;
alter table public.soul_categories enable row level security;
alter table public.soul_synonyms enable row level security;
alter table public.soul_links enable row level security;
revoke all on public.soul_categories, public.soul_synonyms, public.soul_links from anon, authenticated;
grant select, insert, update on public.soul_categories to anon, authenticated;
grant select, insert, update, delete on public.soul_synonyms, public.soul_links to anon, authenticated;

create policy "Read editorial categories" on public.soul_categories for select to anon, authenticated using (true);
create policy "Create editorial categories" on public.soul_categories for insert to anon, authenticated with check (true);
create policy "Edit editorial categories" on public.soul_categories for update to anon, authenticated using (true) with check (true);
create policy "Read manual synonyms" on public.soul_synonyms for select to anon, authenticated using (true);
create policy "Create manual synonyms" on public.soul_synonyms for insert to anon, authenticated with check (true);
create policy "Edit manual synonyms" on public.soul_synonyms for update to anon, authenticated using (true) with check (true);
create policy "Remove manual synonyms" on public.soul_synonyms for delete to anon, authenticated using (true);
create policy "Read editorial connections" on public.soul_links for select to anon, authenticated using (true);
create policy "Create editorial connections" on public.soul_links for insert to anon, authenticated with check (true);
create policy "Edit editorial connections" on public.soul_links for update to anon, authenticated using (true) with check (true);
create policy "Remove editorial connections" on public.soul_links for delete to anon, authenticated using (true);
