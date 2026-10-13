import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const categories = ["Generel", "Parade", "Kildeparken", "Børnekarneval", "Gløden"] as const;
const columns = "id,quote_text,person_name,person_title,organization,quote_source,category,created_at";

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

function headers(key: string, prefer?: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

export async function GET() {
  const supabase = config();
  if (!supabase) return NextResponse.json({ error: "Citater er ikke sat op endnu." }, { status: 503 });

  try {
    const url = new URL(`${supabase.url}/rest/v1/quotes`);
    url.searchParams.set("select", columns);
    url.searchParams.set("order", "created_at.desc");
    url.searchParams.set("limit", "1000");
    const response = await fetch(url, { headers: headers(supabase.key), cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: "Citaterne kunne ikke hentes." }, { status: 502 });
    return NextResponse.json(await response.json(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Forbindelsen til citatarkivet fejlede." }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = config();
  if (!supabase) return NextResponse.json({ error: "Citater er ikke sat op endnu." }, { status: 503 });

  try {
    const body = await request.json();
    const quote_text = typeof body.quote_text === "string" ? body.quote_text.trim() : "";
    const person_name = typeof body.person_name === "string" ? body.person_name.trim() : "";
    const person_title = typeof body.person_title === "string" ? body.person_title.trim() : "";
    const organization = typeof body.organization === "string" ? body.organization.trim() : "";
    const quote_source = typeof body.quote_source === "string" ? body.quote_source.trim() : "";
    const category = typeof body.category === "string" ? body.category : "";
    const publication_consent = body.publication_consent === true;

    if (quote_text.length < 1 || quote_text.length > 3000) return NextResponse.json({ error: "Citatet skal være mellem 1 og 3.000 tegn." }, { status: 400 });
    if (person_name.length < 1 || person_name.length > 160) return NextResponse.json({ error: "Navnet skal være mellem 1 og 160 tegn." }, { status: 400 });
    if (person_title.length < 1 || person_title.length > 200) return NextResponse.json({ error: "Titel skal være mellem 1 og 200 tegn." }, { status: 400 });
    if (organization.length > 200 || quote_source.length > 500) return NextResponse.json({ error: "Et af de valgfrie felter er for langt." }, { status: 400 });
    if (!categories.includes(category as (typeof categories)[number])) return NextResponse.json({ error: "Vælg en gyldig kategori." }, { status: 400 });
    if (!publication_consent) return NextResponse.json({ error: "Bekræft, at citatet må vises i researchrummet." }, { status: 400 });

    const response = await fetch(`${supabase.url}/rest/v1/quotes?select=${columns}`, {
      method: "POST",
      headers: headers(supabase.key, "return=representation"),
      body: JSON.stringify({
        quote_text, person_name, person_title,
        organization: organization || null,
        quote_source: quote_source || null,
        category,
        publication_consent: true,
        status: "approved",
      }),
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: "Citatet kunne ikke gemmes. Tjek at Supabase-migrationen er kørt." }, { status: 502 });
    const rows = await response.json();
    return NextResponse.json(rows[0], { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Indsendelsen kunne ikke læses. Prøv igen." }, { status: 400 });
  }
}
