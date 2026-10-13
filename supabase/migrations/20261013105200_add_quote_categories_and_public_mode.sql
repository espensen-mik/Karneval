-- Add quote categories and make submissions immediately visible during testing.
alter table public.quotes
  add column if not exists category text not null default 'Generel';

alter table public.quotes
  drop constraint if exists quotes_category_check;

alter table public.quotes
  add constraint quotes_category_check
  check (category in ('Generel', 'Parade', 'Kildeparken', 'Børnekarneval', 'Gløden'));

alter table public.quotes
  alter column status set default 'approved';

update public.quotes
set status = 'approved'
where status = 'pending'
  and publication_consent is true;

drop policy if exists "Visitors can submit quotes for review" on public.quotes;
drop policy if exists "Visitors can read approved quotes" on public.quotes;
drop policy if exists "Visitors can submit quotes immediately" on public.quotes;
drop policy if exists "Visitors can read shared quotes" on public.quotes;

create policy "Visitors can submit quotes immediately"
  on public.quotes
  for insert
  to anon, authenticated
  with check (
    status = 'approved'
    and publication_consent is true
  );

create policy "Visitors can read shared quotes"
  on public.quotes
  for select
  to anon, authenticated
  using (publication_consent is true);
