import { NextRequest, NextResponse } from "next/server";
import { requireResearchSession } from "@/lib/research-auth";
import { dbRequest } from "@/lib/server-db";
import { readSurveySummary } from "@/lib/survey-summary";
import { archiveQuery, ARCHIVE_PAGE_SIZE } from "@/lib/survey-archive";
import { validateSurveyFavorite } from "@/lib/survey-favorite";
const columns = "id,first_name,age,postal_code,participations,answers,publication_permission,contact_permission,created_at,is_favorite";
export async function GET(request: NextRequest) {
  const denied = await requireResearchSession(); if (denied) return denied;
  const { page, filters, order } = archiveQuery(request.nextUrl.searchParams);
  try {
    const before = new Date().toISOString();
    const signal = AbortSignal.timeout(10000);
    if (request.nextUrl.searchParams.get("summary") === "1") {
      const summary = await readSurveySummary((path, init) => dbRequest(path, { ...init, signal }), before);
      return NextResponse.json(summary, { headers: { "Cache-Control": "private, no-store" } });
    }
    const response = await dbRequest(`survey_responses?select=${columns}&created_at=lte.${encodeURIComponent(before)}&order=${order}${filters}&offset=${page * ARCHIVE_PAGE_SIZE}&limit=${ARCHIVE_PAGE_SIZE}`, { headers: { Prefer: "count=exact" }, signal });
    return NextResponse.json({ rows: await response.json(), matched: Number(response.headers.get("content-range")?.split("/")[1] || 0), page }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Besvarelserne kunne ikke hentes. Prøv igen." }, { status: 503 }); }
}

// Survey deletion is disabled. Next.js returns 405 for DELETE requests.

export async function PATCH(request: NextRequest) {
  const denied = await requireResearchSession(); if (denied) return denied;
  let favorite: ReturnType<typeof validateSurveyFavorite>;
  try { favorite = validateSurveyFavorite(await request.json()); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Ugyldig favorit." }, { status: 400 }); }
  try {
    const response = await dbRequest(`survey_responses?id=eq.${favorite.id}&select=id,is_favorite`, {
      method: "PATCH", headers: { Prefer: "return=representation" },
      body: JSON.stringify({ is_favorite: favorite.is_favorite }), signal: AbortSignal.timeout(10000),
    });
    const [saved] = await response.json();
    if (!saved) return NextResponse.json({ error: "Besvarelsen findes ikke længere." }, { status: 404 });
    return NextResponse.json(saved, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Favoritten kunne ikke gemmes. Prøv igen." }, { status: 503 }); }
}
