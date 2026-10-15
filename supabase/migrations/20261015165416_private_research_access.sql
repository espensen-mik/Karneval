-- Run only with the password-protected server deployment and server key configured.
-- All existing research data now goes through authenticated Next.js endpoints.
revoke all on public.quotes, public.sources, public.soul_categories, public.soul_links, public.soul_synonyms from public, anon, authenticated;
grant select, insert, update, delete on public.quotes, public.sources, public.soul_categories, public.soul_links, public.soul_synonyms to service_role;
-- Revoke the old test policies as well as table grants.
do $$
declare p record;
begin
  for p in select tablename, policyname from pg_policies where schemaname='public' and tablename in ('quotes','sources','soul_categories','soul_links','soul_synonyms') loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end;
$$;
drop policy if exists "Visitors can read source PDFs" on storage.objects;
drop policy if exists "Visitors can upload source PDFs" on storage.objects;
