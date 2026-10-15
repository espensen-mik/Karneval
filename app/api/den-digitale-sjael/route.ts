import { NextRequest, NextResponse } from "next/server";
import { requireResearchSession } from "@/lib/research-auth";
import { dbRequest } from "@/lib/server-db";
const columns = "id,first_name,age,postal_code,participations,answers,publication_permission,contact_permission,created_at";
export async function GET(request: NextRequest) {
  const denied = await requireResearchSession(); if (denied) return denied;
  const page = Math.max(0, Math.min(100000, Math.floor(Number(request.nextUrl.searchParams.get("page")) || 0)));
  try {
    const response = await dbRequest(`survey_responses?select=${columns}&order=created_at.desc,id.asc&offset=${page * 50}&limit=50`, { headers: { Prefer: "count=exact" } });
    return NextResponse.json({ rows: await response.json(), total: Number(response.headers.get("content-range")?.split("/")[1] || 0), page }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Besvarelserne kunne ikke hentes. Prøv igen." }, { status: 503 }); }
}
