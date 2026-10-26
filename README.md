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

`/sjaelen/ordnetvaerk` er et interaktivt SVG-ordnetværk med `d3-force`. Hovedsiden viser selve netværket. Kuratering, filtre, antal ord og linjeindstillinger ligger på `/sjaelen/kuratering`, som også er tilgængelig som underpunkt i menuen. Visningsvalgene følger med i URL’en, når netværket åbnes fra indstillingerne. Det læser godkendte citaters `quote_text` samt alle udfyldte fritekstfelter fra Den digitale sjæl via det passwordbeskyttede `/api/sjaelen`. Alle databasesider læses. Hver citatpost og hvert enkelt svarfelt er ét bidrag med sit eget ID; forbindelser dannes kun inden for samme bidrag. Den faste sætningsstart ved “Aalborg Karneval er…” fjernes fra analysen, mens originalteksten bevares i eksemplerne. Det strukturerede nej-valg ved traditioner springes over. Netværket henter kun ID og answers, aldrig navne, alder, postnummer eller kontaktoplysninger. Spørgsmålstekst bruges kun som kategorimærkat og tælles ikke med. Kilder, PDF’er og workshopmateriale indgår ikke. Nye svar indgår ved åbning eller opdatering af materialet.

Analysen i `lib/soul-analysis.ts` normaliserer Unicode, store/små bogstaver og tegnsætning. `lib/soul-stopwords.ts` er den udvidelige danske stopordsliste. Enkeltord tælles højst én gang pr. bidrag. Vendinger på 2–4 sammenhængende ord kræver gentagelse i mindst to forskellige bidrag og krydser ikke tegnsætning. Som frasegrænser bruges indholdsord; “være” i begyndelsen og “selv” til sidst tillades også. Der foretages ingen automatisk bøjning, oversættelse, synonymafgørelse eller AI-analyse.

Cirkelradius er proportional med kvadratroden af antal bidrag (areal følger antal). Dokumenterede forbindelser er snittet af de to ords bidrags-ID’er. Netværket viser et begrænset udsnit, som kan udvides og filtreres. Linjer prioriteres efter flest fælles bidrag. Placering er en udforskningshjælp, ikke en ekstra måling. Træk og piletaster flytter noder; Enter åbner dokumentation; Escape slipper en tastaturflyttet node. Systemets indstilling for reduceret bevægelse stopper animationen.

Migrationen `supabase/migrations/20261015102322_soul_curation.sql` opretter kun `soul_categories`, `soul_synonyms` og `soul_links`, alle med RLS. Den oprindelige åbne testadgang er erstattet af passwordbeskyttelsen nedenfor. Kun indloggede besøgende kan oprette/redigere kuratering, arkivere kategorier og opløse variantgrupper eller fjerne redaktionelle forbindelser gennem serverens API. Der gives ingen nye rettigheder på citater eller kilder. Kategorier starter tomme; automatisk afledte ord og forbindelser lagres ikke. Manuelle grupper bruger union af bidrags-ID’er, så flere varianter i samme citat ikke dobbelttælles. En variant kan kun indgå i én gruppe gennem appens API. Opdateringer bruger `updated_at` for at afvise overskrivning af nyere ændringer.

Ved senere tilknytning af andre materialer skal ét fritekstsvar eller en selvstændig workshopudtalelse blive ét `Contribution`-objekt. Dokumenttekst skal opdeles pr. afsnit, og respondentnavne/identificerende metadata skal udelades. Adapteren skal afklare læseadgang, anonymisering og analyseenhed, før den nye materialetype bliver et aktivt filter; opret ikke tomme eksempelposter for at aktivere det.

Kontrol (Node.js 22+): `npm test`, `npm run typecheck`, `npm run build`. Projektet har ikke en separat lint-kommando. Analyse-testene bruger isolerede, små teststrenge og seedes aldrig i appen eller databasen.

### Leg med ord

`/sjaelen/leg-med-ord` er en separat legeflade uden forbindelseslinjer. Den bruger enkeltord fra de samme citater og spørgeskemasvar. Træk bobler sammen, navngiv samlingen, del den igen, eller fjern ord med minus. Samlede boblers areal følger antallet af unikke bidrag, der indeholder mindst ét af ordene; samme bidrag tæller aldrig dobbelt. Skalaen holdes fast ved sammenlægning. Samlinger og fravalg gemmes kun i browserens localStorage og ændrer hverken citater eller fælles kuratering. Fortryd husker de seneste 30 handlinger i sessionen; Nulstil genskaber alle ord. Der kræves ingen migrationer eller nye pakker.

### Kilderegister

`/kilder` er et manuelt register med titel, dato og forfatter/kilde samt enten en URL eller en PDF. Det starter tomt; de tidligere indbyggede kilder er fjernet. Wiki vises ikke længere i menuen.

Kør `supabase/migrations/20261013170000_create_source_register.sql` for at oprette tabellen `public.sources` og den private Storage-bucket `source-pdfs`. Registeret bruger de samme Supabase-miljøvariabler som citaterne. Indloggede besøgende kan læse og tilføje kilder samt åbne PDF’er gennem serverens API.

PDF’er på højst 20 MB uploades direkte fra browseren via en signeret upload-URL; serveren kontrollerer filen, før metadata gemmes. PDF-links i registeret åbner en tidsbegrænset URL. Storage tillader kun PDF-filer og giver ikke besøgende adgang til at overskrive eller slette dem.

Researchrummet kræver nu fælles password. Supabase-servernøglen ligger kun som servermiljøvariabel i Vercel og må aldrig indsættes i klientkode eller git.


### Den digitale sjæl og fælles login

`/sjaelen` er den offentlige formular med ét trin ad gangen, gentagelige sætninger, tilbage-navigation og gennemsyn før indsendelse. Ingen kladde eller personoplysninger gemmes i localStorage. Et stabilt tilfældigt indsendelses-ID gør genforsøg idempotente. Materialet blandes ikke ind i SJÆLEN eller Leg med ord.

`/den-digitale-sjael` viser komplette besvarelser med fornavn og alder, navigation mellem personer og sideinddeling på 25 besvarelser. Mailadresse og fuldt navn gemmes særskilt i `survey_contacts`. Læse-API’et vælger eksplicit kolonner fra `survey_responses` og læser aldrig kontakttabellen. Spørgeskemaets egen gennemgang viser kun den aktuelle deltagers egne oplysninger fra formularens hukommelse.

Login er et fælles serverkontrolleret password, uden brugerkonti. Sessionen er en HMAC-SHA256-signeret HttpOnly/SameSite=Lax-cookie, Secure på HTTPS, gyldig i 12 timer. Passwordskift invaliderer alle eksisterende sessioner. Middleware beskytter researchsider og API’er; alle datahandlers kontrollerer også sessionen selv. Ændrende browserkald kræver samme Origin. Statiske billed- og logoaktiver forbliver offentlige; researchdata og PDF-adgang kræver login. Log ud fjerner browserens session.

Nye databasefunktioner bruger invoker-rettigheder og kan kun kaldes med servernøglen. RLS er slået til uden browserpolicies på besvarelser/kontakter og rate-limit-tabellen. Supabases informationsmeddelelse om RLS uden policies er derfor tilsigtet: ingen direkte browseradgang ([dokumentation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)). Login begrænses til 10 forsøg pr. 15 minutter, indsendelse til 20 pr. time pr. forbindelse. Kun HMAC-hash af forbindelsens IP indgår i begrænsningen; gamle tællere slettes efter to dage ved næste forespørgsel.

**Aktivering:**
1. Opret `SUPABASE_SECRET_KEY` og `RESEARCH_PASSWORD` som servermiljøvariabler i Vercel Production (og i `.env.local` for lokal udvikling).
2. Kør migrationen `digital_soul_responses`, som opretter de nye private tabeller og atomisk indsendelse.
3. Deploy den passwordbeskyttede app, og kontrollér at login samt eksisterende citater/kilder virker.
4. Kør `private_research_access`, som fjerner den gamle direkte anon/authenticated-adgang og Storage-testpolicies. Den må først aktiveres sammen med servernøglen og den nye app. Kontrollér derefter, at publishable/anon-nøglen ikke kan læse tabellerne direkte.

Der installeres ingen nye app-pakker. De nye tests dækker sessionens signatur, udløb, passwordskift, sikre returadresser og servervalidering af spørgeskemasvar. Database-/browsertests bruger isolerede data eller transaktioner med rollback.

Spørgeskemaversion 2 udelader det separate ordspørgsmål. Tidligere ordsvar bevares og vises fortsat i besvarelsesarkivet, når de findes. Nye gentagelige sætninger kvitteres med korte, skiftende beskeder og en rolig animation, som slås fra ved reduceret bevægelse.

Den tidligere formularadresse `/spoergeskema` viderestiller til `/sjaelen` og bevarer query-parametre. Midlertidig layouttest åbnes med `/sjaelen?test=1`; den sender aldrig svar. Kun den præcise formularsti er offentlig. `/sjaelen/ordnetvaerk`, `/sjaelen/kuratering`, `/sjaelen/leg-med-ord` og research-API’er kræver stadig login.

### Analyse af spørgeskemaet

`/den-digitale-sjael/analyse` viser aldersfordeling, deltagelser og en separat ordanalyse af `answers.carnival_is`. Den passwordbeskyttede API henter kun ID, alder, deltagelser og dette ene svarfelt, på tværs af alle databasesider. Den sender fordelinger, optællinger og op til fem teksteksempler pr. vist term til browseren; kontaktoplysninger indgår ikke. Et ord tæller som standard højst én gang pr. besvarelse, og visningen kan skiftes til optælling pr. enkeltstående svar. Vendinger på 2–4 ord kræver mindst to besvarelser. Den eksisterende danske stopordsliste genbruges, den faste indledning fjernes i starten af et svar, og der anvendes ingen AI, automatisk synonymgruppering eller sammenblanding med citatnetværket. Ingen nye tabeller, migrationer eller pakker er nødvendige.

### Svartid i besvarelsesarkivet

Oversigten henter højst 25 besvarelser ad gangen. Nøgletal hentes uafhængigt med `/api/den-digitale-sjael?summary=1`, kun ved åbning, manuel opdatering og sletning; søgning, sortering og sideskift genberegner dem ikke. Et langsomt statistikopslag blokerer ikke listen. Statistikken læser kun aldre i serverbatches og overfører aldrig alle besvarelser til browseren. Læseforespørgsler har 10 sekunders databasefrist og 15 sekunders klientfrist inklusive JSON-body, med synlig fejl og genforsøg. Auth og no-store bevares.

Verificeret med 1.000 isolerede svar, 40 sider, søgning, aldersfilter, sortering og direkte besvarelseslink. I den lokale produktionstest kom første side på 24 ms, mens statistik med vilje var forsinket til 834 ms; dette er ikke en måling eller garanti for Vercel-svartid eller samtidig belastning fra 1.000 brugere.

### Udvalgte stemmer

`/den-digitale-sjael/udvalgte-stemmer` samler manuelt udvalgte, enkelte svar fra spørgeskemaet. I besvarelsens læsepanel åbner et klik på svaret eller “Tilføj til SJÆL” en modal med fælles temaer. Temaer kan oprettes i vælgeren; et svar kan knyttes til højst 20 temaer. Tomt temavalg fjerner kun udvalget. Samlingen har temafiltre, tekstsøgning og sideinddeling på 24 stemmer. “Hele besvarelsen” åbner den præcise kilde via det eksisterende passwordbeskyttede arkiv.

Migration `20261020134701_digital_voices.sql` opretter `soul_voice_themes`, `soul_voices`, `soul_voice_theme_links` og to funktioner med invoker-rettigheder. Tabeller har RLS uden browserpolicies, ingen anon/authenticated-rettigheder og kun service_role-adgang gennem `/api/sjaelen/stemmer`. Funktionernes PUBLIC-execute er tilbagekaldt. Ingen nye pakker eller miljøvariabler.

Svartekst og fornavn/alder læses fra originalbesvarelsen ved visning; kun kilde-ID, spørgsmåls-ID, svarfeltets indeks og tematilknytninger gemmes. E-mail/kontakttabellen læses aldrig. Unik kildeidentitet og atomisk upsert forhindrer kopier ved gentagne gemninger. Kildesletning rydder automatisk udvalget via FK-cascade. Temaerne er redaktionelle og ændrer hverken kildetekster eller ordnetværkets kategorier.

Verificeret med transaktionstest og rollback for flere temaer, gentagen gemning, ændring/fjernelse, præcist svarfelt og kildesletning, samt browserflow på desktop og mobil med isolerede testdata. Produktionssamlingen starter tom uden opfundne temaer.

### Geografisk fordeling

Analysesiden viser fordelingen efter postby med antal, andel af alle besvarelser og tilhørende postnumre. De 10 største områder vises først; alle kan åbnes. Hvert deduplikeret besvarelses-ID tæller én gang uanset antal svarfelter. Postområder som Aalborg og Aalborg SV holdes adskilt, og ukendte/manglende postnumre udelades ikke.

`lib/data/postal-cities.ts` er en lokal opslagstabel med 1.063 postnumre udledt fra Danmarks Statistiks POSTNR2/PNR20-metadata, hentet 21. oktober 2026: https://api.statbank.dk/v1/tableinfo/POSTNR2?format=JSON&lang=da. Kilde: Danmarks Statistik, CC BY 4.0; kildehenvisning vises på siden. Tabellen omfatter også postområder fra statistikkens historiske serier. Intet API kaldes ved visning, og ingen deltagerdata sendes til opslagstjenester. Den tidligere DAWA-postnummertjeneste returnerede HTTP 410 og bruges ikke.

Ordskyens fælles kategorier, synonym-/variantgrupper og redaktionelle forbindelser blev nulstillet 22. oktober 2026 efter brugerens ønske. Udvalgte stemmers temaer og udvalg samt alle kildedata blev bevaret. Leg med ord bruger samme udvidede tekstgrundlag; dens lokale browserleg ændres ikke af nulstillingen af fælles kuratering.

### Ordsky med kontekst

`/sjaelen/ordsky` er en selvstændig, passwordbeskyttet sproglig opdagelsesflade inspireret af Nodus Labs’ kontekstuelle ordskyer: https://noduslabs.com/cases/generate-word-cloud-context/ og https://support.noduslabs.com/hc/en-us/articles/4403247532306-How-to-Generate-a-Word-Cloud-with-a-Context. Egen implementation med eksisterende React/SVG/d3-force; ingen nye pakker eller eksterne analyser.

Den læser samme citater og alle spørgeskemaets fritekstsvar som ordnetværket via `/api/sjaelen`. `lib/word-cloud.ts` indekserer bidrag én gang og genberegner lokale optællinger i udsnittet. Klik på flere ord bruger AND inden for ét bidrag; svarfelter sammenkædes aldrig på tværs af personer eller spørgsmål. Søgefeltet finder også ord/vendinger uden for de viste 30/60/100/150. Minimum 1/2/3/5, materialetype og spørgsmål/kategori kan justeres. Teksteksempler viser originalerne med markerede søgeord og links til de præcise kilder. Vendinger følger eksisterende regelbaseret udtræk og skal findes i mindst to bidrag i grundmaterialet.

Skriftstørrelse følger lokal bidragstælling. Forbindelser er dokumenteret samforekomst i samme bidrag, vægtet som `fælles / sqrt(antalA * antalB)`. Kun et begrænset udvalg tegnes. Farver beregnes deterministisk ved lokal modularitetsoptimering på det synlige vægtede netværk. De er strukturelle grupper, ikke navngivne temaer eller semantiske sandheder, og kan skifte med visningen. Gruppemarkering dæmper øvrige ord uden at ændre kildematerialet.

Nuancevisning uden valgte spor prioriterer den mindst hyppige del af ordforrådet over minimum. Med valgte spor prioriteres andelen i udsnittet divideret med andelen i det valgte grundmateriale; ingen signifikanstest. Dominerende ord kan skjules og gendannes, uden at bidragstællinger ændres. Ingen tilstand lagres i database eller browserlager. Fælles kuratering bruges ikke i denne uafhængige visning.

SVG-kortet har pan, hjulzoom, zoomknapper, tilpas til hele kortet, node-træk og tastaturvalg/placering. Et træk registreres ikke som klik. Rektangulær tekstkollision holder ordene adskilt; layout falder til ro, og reduceret bevægelse respekteres. Unit tests dækker snit, filtrering, dokumenterede linjer, deterministiske grupper, sjældne ord, lokal specificitet, fraser og skjul/gendan uden datatab.


### Sjælemøde

Workshoppen er nu et rent læsearkiv under `/sjaelemoede/karneval-er`, `/sjaelemoede/min-oplevelse` og `/sjaelemoede/sjaelen-af-karneval`. Gruppe 1–3 og alle oprindelige overskrifter og tekster bevares. Udsagn vises i gruppernes egne samlinger med søgning og overskriftsgenveje; historier kan foldes ud; de tre gruppeformuleringer kan sammenlignes på samme side. Historierne havde ikke gruppetilknytning i datamodellen og får ingen opdigtet gruppering.

`/api/sjaelemoede` tillader kun GET bag den eksisterende passwordsession. Serveren henter samtlige sider af de fire tabeller med stabile sorteringer og eksakte optællinger; der vises fejl frem for et ufuldstændigt arkiv. Migration `20261025194107_workshop_read_only.sql` fjerner skrive- og RPC-rettigheder fra serverrollen uden at ændre eller slette indhold. Tabeller, RLS og læseadgang bevares, og workshoptekster tæller stadig i sidemenuens ordtal. De indgår fortsat ikke automatisk i ordanalyserne eller citatbanken.

### Ordtal i sidebar

Desktopmenuen viser det samlede antal ord i citattekster, alle spørgeskemaets tekstfelter og de tre typer workshoptekster. Navne, spørgsmål, workshopoverskrifter og øvrige metadata indgår ikke. Gentagelser tælles; et spørgeskemasvar, der også findes som citat, tæller begge steder. Bindestreger og apostroffer inde i et ord bevares ved optællingen. `material_word_count()` returnerer kun aggregerede tal og kan udelukkende kaldes af serverens `service_role`. `/api/ordtal` kræver passwordsession og deler servercache i 60 sekunder. Desktopklienten opdaterer ved navigation og cirka hvert minut, når siden er synlig. Der hentes intet ordtal på mobil.

### Søg i sjælen

`/sjaelen/soeg` er den nye passwordbeskyttede indgang fra menupunktet SJÆLEN. Den offentlige formular `/sjaelen` er uændret. Den eksisterende visualisering på `/sjaelen/ordnetvaerk` hedder nu Sjælerejse og bevarer sine links og visningsindstillinger.

Søge-API'et `/api/sjaelen/soeg` læser alle sider af citater, alle kendte spørgeskemafelter (et resultat pr. enkeltstående svar), workshopoverskrifter/udsagn/historier/gruppeformuleringer og kilderegisterets titel/forfatter/filnavn. PDF-indhold og eksterne artiklers indhold er ikke indekseret. Kontakttabellen læses aldrig. Udvalgte stemmer findes via deres oprindelige besvarelser; kuraterings- og systemtabeller indekseres ikke som selvstændige tekster.

Søgningen er bogstavuafhængig deltekstssøgning med alle søgeord i samme resultat, materialefilter og 20 resultater pr. side. Originaltekst og metadata bevares; browseren får kun uddrag. Indekset deles i op til 30 sekunder pr. serverinstans, hvorefter det genindlæses. Ingen nye tabeller, migrationer eller pakker. Ordforslagene vælges tilfældigt blandt alle ord med mere end 20 forekomster. Ved åbning og med refresh-knappen vælges op til 20 ord; refresh prioriterer ord uden for det foregående udvalg. Ordlisten tæller ordforekomster i bidragsteksterne, uden metadata, stopord, enkeltbogstaver og den faste sætningsindledning. Ordformer holdes adskilt, og overførte citater tæller også i den oprindelige besvarelse. Manglende læsning af en datakilde giver en fejl frem for et ufuldstændigt resultat.
