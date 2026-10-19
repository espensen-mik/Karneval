import { NextRequest, NextResponse } from "next/server";
import { requireResearchSession } from "@/lib/research-auth";
import { dbRequest } from "@/lib/server-db";
import { readSurveySummary } from "@/lib/survey-summary";
import { archiveQuery, ARCHIVE_PAGE_SIZE } from "@/lib/survey-archive";
import { validateSurveyDeletion } from "@/lib/survey-delete";
const columns = "id,first_name,age,postal_code,participations,answers,publication_permission,contact_permission,created_at";
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

export async function DELETE(request: NextRequest) {
  const denied = await requireResearchSession(); if (denied) return denied;
  let id: string;
  try { id = validateSurveyDeletion(await request.json()); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Ugyldig sletning." }, { status: 400 }); }
  try {
    // Contact details are removed atomically by the existing ON DELETE CASCADE FK.
    const response = await dbRequest(`survey_responses?id=eq.${id}&select=id`, { method: "DELETE", headers: { Prefer: "return=representation" } });
    const deleted: { id: string }[] = await response.json();
    if (!deleted.length) return NextResponse.json({ error: "Besvarelsen findes ikke længere. Opdatér oversigten." }, { status: 404 });
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Besvarelsen kunne ikke slettes. Prøv igen." }, { status: 503 }); }
}
