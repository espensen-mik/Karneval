import { parseSurveyAnswerKey } from "@/lib/quote-draft";
import { requireResearchSession } from "@/lib/research-auth";
import { sourceConfig as config, sourceHeaders as headers } from "@/lib/server-db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const categories = ["Generel", "Parade", "Kildeparken", "Børnekarneval", "Gløden"] as const;
const columns = "id,quote_text,person_name,person_title,organization,quote_source,category,created_at,survey_answer_key";

export async function GET(request: NextRequest) {
  const denied = await requireResearchSession(); if (denied) return denied;
  const supabase = config();
  if (!supabase) return NextResponse.json({ error: "Citater er ikke sat op endnu." }, { status: 503 });

  try {
    const url = new URL(`${supabase.url}/rest/v1/quotes`);
    const surveyResponse = request.nextUrl.searchParams.get("survey_response");
    if (surveyResponse) {
      if (!/^[0-9a-f-]{36}$/i.test(surveyResponse)) return NextResponse.json({ error: "Ugyldig besvarelse." }, { status: 400 });
      url.searchParams.set("survey_answer_key", `like.${surveyResponse}:*`);
    }
    url.searchParams.set("select", surveyResponse ? "id,survey_answer_key" : columns);
    url.searchParams.set("order", "created_at.desc");
    url.searchParams.set("limit", "1000");
    const response = await fetch(url, { headers: headers(supabase.key), cache: "no-store" });
    if (!response.ok) {
      const status = response.status;
      console.error(`Supabase quote GET failed with HTTP ${status}`);
      const hint = status === 401 || status === 403
        ? "Kontrollér Supabase URL, publishable key og adgangspolitikker."
        : status === 400 || status === 404
          ? "Kontrollér at citatmigrationerne er kørt, og at tabellen public.quotes findes."
          : "Kontrollér Supabase-forbindelsen og Vercel-loggene.";
      return NextResponse.json({ error: `Supabase svarede med HTTP ${status}. ${hint}` }, { status: 502 });
    }
    return NextResponse.json(await response.json(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Forbindelsen til citatarkivet fejlede." }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireResearchSession(); if (denied) return denied;
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

    if (quote_text.length < 1 || quote_text.length > 3000) return NextResponse.json({ error: "Citatet skal være mellem 1 og 3.000 tegn." }, { status: 400 });
    if (person_name.length < 1 || person_name.length > 160) return NextResponse.json({ error: "Navnet skal være mellem 1 og 160 tegn." }, { status: 400 });
    if (person_title.length < 1 || person_title.length > 200) return NextResponse.json({ error: "Titel skal være mellem 1 og 200 tegn." }, { status: 400 });
    if (organization.length > 200 || quote_source.length > 500) return NextResponse.json({ error: "Et af de valgfrie felter er for langt." }, { status: 400 });
    if (!categories.includes(category as (typeof categories)[number])) return NextResponse.json({ error: "Vælg en gyldig kategori." }, { status: 400 });

    const origin = body.survey_answer_key == null ? null : parseSurveyAnswerKey(body.survey_answer_key);
    if (body.survey_answer_key != null && !origin) return NextResponse.json({ error: "Ugyldig reference til besvarelsen." }, { status: 400 });
    if (origin) {
      const sourceUrl = new URL(`${supabase.url}/rest/v1/survey_responses`);
      sourceUrl.searchParams.set("id", `eq.${origin.response}`);
      sourceUrl.searchParams.set("select", "answers,publication_permission");
      const sourceResponse = await fetch(sourceUrl, { headers: headers(supabase.key), cache: "no-store" });
      if (!sourceResponse.ok) return NextResponse.json({ error: "Besvarelsen kunne ikke kontrolleres. Prøv igen." }, { status: 502 });
      const [source] = await sourceResponse.json();
      if (!source?.publication_permission || typeof source.answers?.[origin.question]?.[origin.index] !== "string") return NextResponse.json({ error: "Udtalelsen findes ikke eller må ikke citeres." }, { status: 400 });
    }

    const response = await fetch(`${supabase.url}/rest/v1/quotes?select=${columns}`, {
      method: "POST",
      headers: headers(supabase.key, "return=representation"),
      body: JSON.stringify({
        quote_text, person_name, person_title,
        organization: organization || null,
        quote_source: quote_source || null,
        category,
        survey_answer_key: origin ? `${origin.response.toLowerCase()}:${origin.question.toLowerCase()}:${origin.index}` : null,
        // Legacy publication flag required by the existing public-mode policies.
        // Submissions are published directly; the form has no consent checkbox.
        publication_consent: true,
        status: "approved",
      }),
      cache: "no-store",
    });
    if (response.status === 409 && origin) return NextResponse.json({ error: "Denne udtalelse er allerede tilføjet som citat. Find den i citatbanken." }, { status: 409 });
    if (!response.ok) return NextResponse.json({ error: "Citatet kunne ikke gemmes. Tjek at Supabase-migrationen er kørt." }, { status: 502 });
    const rows = await response.json();
    return NextResponse.json(rows[0], { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Indsendelsen kunne ikke læses. Prøv igen." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await requireResearchSession(); if (denied) return denied;
  const supabase = config();
  if (!supabase) return NextResponse.json({ error: "Citater er ikke sat op endnu." }, { status: 503 });
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Citatets id er ugyldigt." }, { status: 400 });
    const quote_text = typeof body.quote_text === "string" ? body.quote_text.trim() : "";
    const person_name = typeof body.person_name === "string" ? body.person_name.trim() : "";
    const person_title = typeof body.person_title === "string" ? body.person_title.trim() : "";
    const organization = typeof body.organization === "string" ? body.organization.trim() : "";
    const quote_source = typeof body.quote_source === "string" ? body.quote_source.trim() : "";
    const category = typeof body.category === "string" ? body.category : "";
    if (quote_text.length < 1 || quote_text.length > 3000) return NextResponse.json({ error: "Citatet skal være mellem 1 og 3.000 tegn." }, { status: 400 });
    if (person_name.length < 1 || person_name.length > 160) return NextResponse.json({ error: "Navnet skal være mellem 1 og 160 tegn." }, { status: 400 });
    if (person_title.length < 1 || person_title.length > 200) return NextResponse.json({ error: "Titel skal være mellem 1 og 200 tegn." }, { status: 400 });
    if (organization.length > 200 || quote_source.length > 500) return NextResponse.json({ error: "Et af de valgfrie felter er for langt." }, { status: 400 });
    if (!categories.includes(category as (typeof categories)[number])) return NextResponse.json({ error: "Vælg en gyldig kategori." }, { status: 400 });
    const url = new URL(`${supabase.url}/rest/v1/quotes`); url.searchParams.set("id", `eq.${id}`); url.searchParams.set("select", columns);
    const response = await fetch(url, { method: "PATCH", headers: headers(supabase.key, "return=representation"), body: JSON.stringify({ quote_text, person_name, person_title, organization: organization || null, quote_source: quote_source || null, category, publication_consent: true, status: "approved" }), cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: "Citatet kunne ikke opdateres. Kontrollér Supabase-adgangspolitikkerne." }, { status: 502 });
    const rows = await response.json();
    if (!rows[0]) return NextResponse.json({ error: "Citatet blev ikke fundet." }, { status: 404 });
    return NextResponse.json(rows[0], { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Redigeringen kunne ikke læses. Prøv igen." }, { status: 400 }); }
}

export async function DELETE(request: NextRequest) {
  const denied = await requireResearchSession(); if (denied) return denied;
  const supabase = config();
  if (!supabase) return NextResponse.json({ error: "Citater er ikke sat op endnu." }, { status: 503 });
  const id = request.nextUrl.searchParams.get("id") || "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Citatets id er ugyldigt." }, { status: 400 });
  try {
    const url = new URL(`${supabase.url}/rest/v1/quotes`); url.searchParams.set("id", `eq.${id}`); url.searchParams.set("select", "id");
    const response = await fetch(url, { method: "DELETE", headers: headers(supabase.key, "return=representation"), cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: "Citatet kunne ikke slettes. Kontrollér Supabase-adgangspolitikkerne." }, { status: 502 });
    const rows = await response.json();
    if (!rows[0]) return NextResponse.json({ error: "Citatet blev ikke fundet." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Sletningen kunne ikke gennemføres. Prøv igen." }, { status: 502 }); }
}
