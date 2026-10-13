-- Shared manual source register. Uses the research room's existing visitor access.
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 250),
  creator text not null check (char_length(btrim(creator)) between 1 and 200),
  source_date date not null,
  url text check (url is null or (char_length(url) <= 2000 and url ~* '^https?://')),
  file_path text unique check (file_path is null or file_path ~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf$'),
  file_name text check (file_name is null or (char_length(file_name) between 1 and 250 and file_name ~* '\.pdf$')),
  created_at timestamptz not null default now(),
  check ((url is not null and file_path is null and file_name is null) or (url is null and file_path is not null and file_name is not null))
);
create index sources_created_at_idx on public.sources (created_at desc);
alter table public.sources enable row level security;
revoke all on public.sources from anon, authenticated;
grant select, insert on public.sources to anon, authenticated;
create policy "Visitors can read sources" on public.sources for select to anon, authenticated using (true);
create policy "Visitors can add sources" on public.sources for insert to anon, authenticated with check (
  file_path is null or exists (select 1 from storage.objects where bucket_id = 'source-pdfs' and name = file_path)
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('source-pdfs', 'source-pdfs', false, 20971520, array['application/pdf']);
create policy "Visitors can upload source PDFs" on storage.objects for insert to anon, authenticated with check (
  bucket_id = 'source-pdfs' and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf$'
);
create policy "Visitors can read source PDFs" on storage.objects for select to anon, authenticated using (bucket_id = 'source-pdfs');
