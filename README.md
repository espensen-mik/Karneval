# Sjælen af Karneval

Internt researchværktøj til at samle viden, kilder og perspektiver om Aalborg Karneval.

## Udvikling

Projektet bruger Next.js App Router og deployes via Vercel fra GitHub.

### Citatarkiv

Citatsiden ligger på `/citater`. Den bruger Supabase REST API fra en server route og kræver disse Vercel environment variables:

- `SUPABASE_URL`: projektets URL
- `SUPABASE_PUBLISHABLE_KEY`: projektets publishable key (eller legacy anon key)

Kør migrationsfilerne i `supabase/migrations` i Supabase SQL Editor, i tidsstempelrækkefølge. Citatindsendelser bliver synlige straks efter indsendelse. De tilladte kategorier er Generel, Parade, Kildeparken, Børnekarneval og Gløden.

## Adgang og data

### Kilderegister

`/kilder` er et manuelt register med titel, dato og forfatter/kilde samt enten en URL eller en PDF. Det starter tomt; de tidligere indbyggede kilder er fjernet. Wiki vises ikke længere i menuen.

Kør `supabase/migrations/20261013170000_create_source_register.sql` for at oprette tabellen `public.sources` og den private Storage-bucket `source-pdfs`. Registeret bruger de samme Supabase-miljøvariabler som citaterne. Besøgende med sitets link kan læse og tilføje kilder samt åbne PDF’er, som aftalt for denne testversion.

PDF’er på højst 20 MB uploades direkte fra browseren via en signeret upload-URL; serveren kontrollerer filen, før metadata gemmes. PDF-links i registeret åbner en tidsbegrænset URL. Storage tillader kun PDF-filer og giver ikke besøgende adgang til at overskrive eller slette dem.

Der er ingen login eller godkendelse på citatsiden i denne testversion. Linket giver adgang til at læse og indsende citater, så brug kun testindhold, som må være offentligt. Supabase-nøglen skal ligge som server environment variable i Vercel og må ikke indsættes i kildekoden.
