-- Public test mode: visitors with the link can edit and delete published quotes.
-- Add authentication or a private editor policy before sharing the workspace broadly.
grant update, delete on table public.quotes to anon, authenticated;

drop policy if exists "Visitors can edit shared quotes" on public.quotes;
create policy "Visitors can edit shared quotes"
on public.quotes for update to anon, authenticated
using (publication_consent is true)
with check (
  publication_consent is true
  and status = 'approved'
  and category in ('Generel', 'Parade', 'Kildeparken', 'Børnekarneval', 'Gløden')
);

drop policy if exists "Visitors can delete shared quotes" on public.quotes;
create policy "Visitors can delete shared quotes"
on public.quotes for delete to anon, authenticated
using (publication_consent is true);
