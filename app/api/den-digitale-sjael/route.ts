import { NextRequest, NextResponse } from "next/server";
import { requireResearchSession } from "@/lib/research-auth";
import { dbRequest } from "@/lib/server-db";
import { readSurveySummary } from "@/lib/survey-summary";
import { archiveQuery, ARCHIVE_PAGE_SIZE } from "@/lib/survey-archive";
const columns = "id,first_name,age,postal_code,participations,answers,publication_permission,contact_permission,created_at";
export async function GET(request: NextRequest) {
  const denied = await requireResearchSession(); if (denied) return denied;
  const { page, filters, order } = archiveQuery(request.nextUrl.searchParams);
  try {
    const before = new Date().toISOString();
    const [response, summary] = await Promise.all([dbRequest(`survey_responses?select=${columns}&created_at=lte.${encodeURIComponent(before)}&order=${order}${filters}&offset=${page * ARCHIVE_PAGE_SIZE}&limit=${ARCHIVE_PAGE_SIZE}`, { headers: { Prefer: "count=exact" } }), readSurveySummary(dbRequest, before)]);
    return NextResponse.json({ rows: await response.json(), matched: Number(response.headers.get("content-range")?.split("/")[1] || 0), total: summary.total, averageAge: summary.averageAge, page }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Besvarelserne kunne ikke hentes. Prøv igen." }, { status: 503 }); }
}
