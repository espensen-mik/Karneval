import { NextRequest, NextResponse } from "next/server";
import { requireResearchSession } from "@/lib/research-auth";
import { dbRequest } from "@/lib/server-db";
import { readSurveySummary } from "@/lib/survey-summary";
const columns = "id,first_name,age,postal_code,participations,answers,publication_permission,contact_permission,created_at";
export async function GET(request: NextRequest) {
  const denied = await requireResearchSession(); if (denied) return denied;
  const page = Math.max(0, Math.min(100000, Math.floor(Number(request.nextUrl.searchParams.get("page")) || 0)));
  try {
    const before = new Date().toISOString();
    const [response, summary] = await Promise.all([dbRequest(`survey_responses?select=${columns}&created_at=lte.${encodeURIComponent(before)}&order=created_at.desc,id.asc&offset=${page * 50}&limit=50`), readSurveySummary(dbRequest, before)]);
    return NextResponse.json({ rows: await response.json(), total: summary.total, averageAge: summary.averageAge, page }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Besvarelserne kunne ikke hentes. Prøv igen." }, { status: 503 }); }
}
