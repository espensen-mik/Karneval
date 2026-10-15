# Sjælen af Karneval

Internt researchværktøj til at samle viden, kilder og perspektiver om Aalborg Karneval.

## Udvikling

Projektet bruger Next.js App Router og deployes via Vercel fra GitHub.

### Citatarkiv

Citatsiden ligger på `/citater`. Den bruger Supabase REST API fra en server route og kræver disse Vercel environment variables:

- `SUPABASE_URL`: projektets URL
- `SUPABASE_SECRET_KEY`: projektets server-secret key (aldrig NEXT_PUBLIC_)
- `RESEARCH_PASSWORD`: fælles password på mindst 12 tegn

Kør migrationsfilerne i `supabase/migrations` i Supabase SQL Editor, i tidsstempelrækkefølge. Citatindsendelser bliver synlige straks efter indsendelse. De tilladte kategorier er Generel, Parade, Kildeparken, Børnekarneval og Gløden.

## Adgang og data

### SJÆLEN

`/sjaelen` er et interaktivt SVG-ordnetværk med `d3-force`. Hovedsiden viser selve netværket. Kuratering, filtre, antal ord og linjeindstillinger ligger på `/sjaelen/kuratering`, som også er tilgængelig som underpunkt i menuen. Visningsvalgene følger med i URL’en, når netværket åbnes fra indstillingerne. Det læser kun offentligt godkendte citaters `quote_text` via `/api/sjaelen`; alle sider fra Supabase læses, så optællingen ikke stopper ved en standardgrænse. Metadata bruges kun til filtrering og kildehenvisninger. Hver citatpost er ét bidrag. Kilder, PDF’er, spørgeskemaer og workshopmateriale indgår ikke endnu; de vises som utilknyttede materialetyper.

Analysen i `lib/soul-analysis.ts` normaliserer Unicode, store/små bogstaver og tegnsætning. `lib/soul-stopwords.ts` er den udvidelige danske stopordsliste. Enkeltord tælles højst én gang pr. bidrag. Vendinger på 2–4 sammenhængende ord kræver gentagelse i mindst to forskellige bidrag og krydser ikke tegnsætning. Som frasegrænser bruges indholdsord; “være” i begyndelsen og “selv” til sidst tillades også. Der foretages ingen automatisk bøjning, oversættelse, synonymafgørelse eller AI-analyse.

Cirkelradius er proportional med kvadratroden af antal bidrag (areal følger antal). Dokumenterede forbindelser er snittet af de to ords bidrags-ID’er. Netværket viser et begrænset udsnit, som kan udvides og filtreres. Linjer prioriteres efter flest fælles bidrag. Placering er en udforskningshjælp, ikke en ekstra måling. Træk og piletaster flytter noder; Enter åbner dokumentation; Escape slipper en tastaturflyttet node. Systemets indstilling for reduceret bevægelse stopper animationen.

Migrationen `supabase/migrations/20261015102322_soul_curation.sql` opretter kun `soul_categories`, `soul_synonyms` og `soul_links`, alle med RLS. Den oprindelige åbne testadgang er erstattet af passwordbeskyttelsen nedenfor. Kun indloggede besøgende kan oprette/redigere kuratering, arkivere kategorier og opløse variantgrupper eller fjerne redaktionelle forbindelser gennem serverens API. Der gives ingen nye rettigheder på citater eller kilder. Kategorier starter tomme; automatisk afledte ord og forbindelser lagres ikke. Manuelle grupper bruger union af bidrags-ID’er, så flere varianter i samme citat ikke dobbelttælles. En variant kan kun indgå i én gruppe gennem appens API. Opdateringer bruger `updated_at` for at afvise overskrivning af nyere ændringer.

Ved senere tilknytning af andre materialer skal ét fritekstsvar eller en selvstændig workshopudtalelse blive ét `Contribution`-objekt. Dokumenttekst skal opdeles pr. afsnit, og respondentnavne/identificerende metadata skal udelades. Adapteren skal afklare læseadgang, anonymisering og analyseenhed, før den nye materialetype bliver et aktivt filter; opret ikke tomme eksempelposter for at aktivere det.

Kontrol (Node.js 22+): `npm test`, `npm run typecheck`, `npm run build`. Projektet har ikke en separat lint-kommando. Analyse-testene bruger isolerede, små teststrenge og seedes aldrig i appen eller databasen.

### Leg med ord

`/sjaelen/leg-med-ord` er en separat legeflade uden forbindelseslinjer. Den bruger enkeltord fra de samme citattekster. Træk bobler sammen, navngiv samlingen, del den igen, eller fjern ord med minus. Samlede boblers areal følger antallet af unikke citater, der indeholder mindst ét af ordene; samme citat tæller aldrig dobbelt. Skalaen holdes fast ved sammenlægning. Samlinger og fravalg gemmes kun i browserens localStorage og ændrer hverken citater eller fælles kuratering. Fortryd husker de seneste 30 handlinger i sessionen; Nulstil genskaber alle ord. Der kræves ingen migrationer eller nye pakker.

### Kilderegister

`/kilder` er et manuelt register med titel, dato og forfatter/kilde samt enten en URL eller en PDF. Det starter tomt; de tidligere indbyggede kilder er fjernet. Wiki vises ikke længere i menuen.

Kør `supabase/migrations/20261013170000_create_source_register.sql` for at oprette tabellen `public.sources` og den private Storage-bucket `source-pdfs`. Registeret bruger de samme Supabase-miljøvariabler som citaterne. Indloggede besøgende kan læse og tilføje kilder samt åbne PDF’er gennem serverens API.

PDF’er på højst 20 MB uploades direkte fra browseren via en signeret upload-URL; serveren kontrollerer filen, før metadata gemmes. PDF-links i registeret åbner en tidsbegrænset URL. Storage tillader kun PDF-filer og giver ikke besøgende adgang til at overskrive eller slette dem.

Researchrummet kræver nu fælles password. Supabase-servernøglen ligger kun som servermiljøvariabel i Vercel og må aldrig indsættes i klientkode eller git.


### Den digitale sjæl og fælles login

`/spoergeskema` er den offentlige formular med ét trin ad gangen, gentagelige sætninger/ord, tilbage-navigation og gennemsyn før indsendelse. Ingen kladde eller personoplysninger gemmes i localStorage. Et stabilt tilfældigt indsendelses-ID gør genforsøg idempotente. Materialet blandes ikke ind i SJÆLEN eller Leg med ord.

`/den-digitale-sjael` viser komplette besvarelser med fornavn og alder, navigation mellem personer og sideinddeling på 50 besvarelser. Mailadresse og fuldt navn gemmes særskilt i `survey_contacts`. Læse-API’et vælger eksplicit kolonner fra `survey_responses` og læser aldrig kontakttabellen. Spørgeskemaets egen gennemgang viser kun den aktuelle deltagers egne oplysninger fra formularens hukommelse.

Login er et fælles serverkontrolleret password, uden brugerkonti. Sessionen er en HMAC-SHA256-signeret HttpOnly/SameSite=Lax-cookie, Secure på HTTPS, gyldig i 12 timer. Passwordskift invaliderer alle eksisterende sessioner. Middleware beskytter researchsider og API’er; alle datahandlers kontrollerer også sessionen selv. Ændrende browserkald kræver samme Origin. Statiske billed- og logoaktiver forbliver offentlige; researchdata og PDF-adgang kræver login. Log ud fjerner browserens session.

Nye databasefunktioner bruger invoker-rettigheder og kan kun kaldes med servernøglen. RLS er slået til uden browserpolicies på besvarelser/kontakter og rate-limit-tabellen. Supabases informationsmeddelelse om RLS uden policies er derfor tilsigtet: ingen direkte browseradgang ([dokumentation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)). Login begrænses til 10 forsøg pr. 15 minutter, indsendelse til 20 pr. time pr. forbindelse. Kun HMAC-hash af forbindelsens IP indgår i begrænsningen; gamle tællere slettes efter to dage ved næste forespørgsel.

**Aktivering:**
1. Opret `SUPABASE_SECRET_KEY` og `RESEARCH_PASSWORD` som servermiljøvariabler i Vercel Production (og i `.env.local` for lokal udvikling).
2. Kør migrationen `digital_soul_responses`, som opretter de nye private tabeller og atomisk indsendelse.
3. Deploy den passwordbeskyttede app, og kontrollér at login samt eksisterende citater/kilder virker.
4. Kør `private_research_access`, som fjerner den gamle direkte anon/authenticated-adgang og Storage-testpolicies. Den må først aktiveres sammen med servernøglen og den nye app. Kontrollér derefter, at publishable/anon-nøglen ikke kan læse tabellerne direkte.

Der installeres ingen nye app-pakker. De nye tests dækker sessionens signatur, udløb, passwordskift, sikre returadresser og servervalidering af spørgeskemasvar. Database-/browsertests bruger isolerede data eller transaktioner med rollback.
