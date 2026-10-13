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

Der er ingen login eller godkendelse på citatsiden i denne testversion. Linket giver adgang til at læse og indsende citater, så brug kun testindhold, som må være offentligt. Supabase-nøglen skal ligge som server environment variable i Vercel og må ikke indsættes i kildekoden.
