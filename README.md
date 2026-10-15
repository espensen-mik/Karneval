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

### SJÆLEN

`/sjaelen` er et interaktivt SVG-ordnetværk med `d3-force`. Det læser kun offentligt godkendte citaters `quote_text` via `/api/sjaelen`; alle sider fra Supabase læses, så optællingen ikke stopper ved en standardgrænse. Metadata bruges kun til filtrering og kildehenvisninger. Hver citatpost er ét bidrag. Kilder, PDF’er, spørgeskemaer og workshopmateriale indgår ikke endnu; de vises som utilknyttede materialetyper.

Analysen i `lib/soul-analysis.ts` normaliserer Unicode, store/små bogstaver og tegnsætning. `lib/soul-stopwords.ts` er den udvidelige danske stopordsliste. Enkeltord tælles højst én gang pr. bidrag. Vendinger på 2–4 sammenhængende ord kræver gentagelse i mindst to forskellige bidrag og krydser ikke tegnsætning. Som frasegrænser bruges indholdsord; “være” i begyndelsen og “selv” til sidst tillades også. Der foretages ingen automatisk bøjning, oversættelse, synonymafgørelse eller AI-analyse.

Cirkelradius er proportional med kvadratroden af antal bidrag (areal følger antal). Dokumenterede forbindelser er snittet af de to ords bidrags-ID’er. Netværket viser et begrænset udsnit, som kan udvides og filtreres. Linjer prioriteres efter flest fælles bidrag. Placering er en udforskningshjælp, ikke en ekstra måling. Træk og piletaster flytter noder; Enter åbner dokumentation; Escape slipper en tastaturflyttet node. Systemets indstilling for reduceret bevægelse stopper animationen.

Migrationen `supabase/migrations/20261015102322_soul_curation.sql` opretter kun `soul_categories`, `soul_synonyms` og `soul_links`, alle med RLS. Den følger den udtrykkeligt godkendte, åbne testadgang: besøgende kan oprette/redigere kuratering, arkivere kategorier og opløse variantgrupper eller fjerne redaktionelle forbindelser. Der gives ingen nye rettigheder på citater eller kilder. Kategorier starter tomme; automatisk afledte ord og forbindelser lagres ikke. Manuelle grupper bruger union af bidrags-ID’er, så flere varianter i samme citat ikke dobbelttælles. En variant kan kun indgå i én gruppe gennem appens API. Opdateringer bruger `updated_at` for at afvise overskrivning af nyere ændringer.

Ved senere tilknytning af andre materialer skal ét fritekstsvar eller en selvstændig workshopudtalelse blive ét `Contribution`-objekt. Dokumenttekst skal opdeles pr. afsnit, og respondentnavne/identificerende metadata skal udelades. Adapteren skal afklare læseadgang, anonymisering og analyseenhed, før den nye materialetype bliver et aktivt filter; opret ikke tomme eksempelposter for at aktivere det.

Kontrol (Node.js 22+): `npm test`, `npm run typecheck`, `npm run build`. Projektet har ikke en separat lint-kommando. Analyse-testene bruger isolerede, små teststrenge og seedes aldrig i appen eller databasen.

### Kilderegister

`/kilder` er et manuelt register med titel, dato og forfatter/kilde samt enten en URL eller en PDF. Det starter tomt; de tidligere indbyggede kilder er fjernet. Wiki vises ikke længere i menuen.

Kør `supabase/migrations/20261013170000_create_source_register.sql` for at oprette tabellen `public.sources` og den private Storage-bucket `source-pdfs`. Registeret bruger de samme Supabase-miljøvariabler som citaterne. Besøgende med sitets link kan læse og tilføje kilder samt åbne PDF’er, som aftalt for denne testversion.

PDF’er på højst 20 MB uploades direkte fra browseren via en signeret upload-URL; serveren kontrollerer filen, før metadata gemmes. PDF-links i registeret åbner en tidsbegrænset URL. Storage tillader kun PDF-filer og giver ikke besøgende adgang til at overskrive eller slette dem.

Der er ingen login eller godkendelse på citatsiden i denne testversion. Linket giver adgang til at læse og indsende citater, så brug kun testindhold, som må være offentligt. Supabase-nøglen skal ligge som server environment variable i Vercel og må ikke indsættes i kildekoden.
